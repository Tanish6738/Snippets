import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true,
        trim: true 
    },
    description: { 
        type: String, 
        default: '' 
    },
    project: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Project',
        required: true 
    },
    parentTask: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Task',
        default: null 
    },
    subtasks: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Task' 
    }],
    // Task dependencies - tasks that must be completed before this task can start
    dependencies: [{
        task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
        type: { 
            type: String, 
            enum: ['finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish'],
            default: 'finish-to-start'
        },
        // Delay between dependency completion and this task (in days)
        delay: { type: Number, default: 0 }
    }],
    // Blocked status reason when task is blocked
    blockedReason: {
        type: String,
        default: ''
    },
    status: { 
        type: String, 
        enum: ['To Do', 'In Progress', 'Under Review', 'Completed', 'Blocked'],
        default: 'To Do'
    },
    priority: { 
        type: String, 
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    // Calculated priority score (0-100) based on urgency, importance, and dependencies
    priorityScore: {
        type: Number,
        default: 0
    },
    dueDate: { 
        type: Date 
    },
    startDate: { 
        type: Date 
    },
    estimatedHours: { 
        type: Number 
    },
    actualHours: { 
        type: Number 
    },
    // Time tracking entries
    timeEntries: [{
        startTime: { type: Date },
        endTime: { type: Date },
        duration: { type: Number }, // in minutes
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        notes: { type: String }
    }],
    assignedTo: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    comments: [{
        text: { type: String },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
        mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    attachments: [{
        name: { type: String },
        fileUrl: { type: String },
        fileType: { type: String },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now }
    }],
    level: { 
        type: Number, 
        default: 0 
    },
    aiGenerated: { 
        type: Boolean, 
        default: false 
    },
    tags: [{ 
        type: String 
    }],
    // Task health status calculated automatically
    health: {
        status: { 
            type: String, 
            enum: ['on-track', 'at-risk', 'delayed', 'ahead'],
            default: 'on-track'
        },
        lastAssessed: { type: Date, default: Date.now }
    },
    // Version history of task changes
    history: [{
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        changes: [{ 
            field: { type: String },
            oldValue: { type: mongoose.Schema.Types.Mixed },
            newValue: { type: mongoose.Schema.Types.Mixed }
        }]
    }],
    // For recurring tasks
    recurrence: {
        isRecurring: { type: Boolean, default: false },
        frequency: { 
            type: String, 
            enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'] 
        },
        interval: { type: Number, default: 1 }, // every X days/weeks/etc
        daysOfWeek: [{ type: Number }], // 0 = Sunday, 1 = Monday, etc
        endDate: { type: Date },
        occurrences: { type: Number },
        parentRecurringTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }
    },
    // External calendar integration
    externalCalendarIds: [{
        provider: { type: String, enum: ['google', 'outlook', 'apple'] },
        externalId: { type: String }
    }]
}, { timestamps: true });

// Method to add subtask
TaskSchema.methods.addSubtask = async function(subtaskId) {
    if (!this.subtasks.includes(subtaskId)) {
        this.subtasks.push(subtaskId);
        await this.save();
        
        // Update the subtask parent reference
        const Task = mongoose.model('Task');
        await Task.findByIdAndUpdate(subtaskId, {
            parentTask: this._id,
            project: this.project,
            level: this.level + 1
        });
    }
    return this;
};

// Method to remove subtask
TaskSchema.methods.removeSubtask = async function(subtaskId) {
    this.subtasks = this.subtasks.filter(id => !id.equals(subtaskId));
    await this.save();
    return this;
};

// Method to update parent task status based on subtasks completion
TaskSchema.methods.updateParentStatus = async function() {
    // Only proceed if this task has a parent
    if (!this.parentTask) return this;
    
    const Task = mongoose.model('Task');
    const parent = await Task.findById(this.parentTask);
    
    if (parent) {
        // Get all subtasks for the parent
        const subtasks = await Task.find({ _id: { $in: parent.subtasks } });
        
        // Check if all subtasks are completed
        const allCompleted = subtasks.every(task => task.status === 'Completed');
        
        if (allCompleted && subtasks.length > 0) {
            parent.status = 'Completed';
            await parent.save();
            
            // Recursively update grandparent status
            await parent.updateParentStatus();
        }
    }
    
    return this;
};

// Pre-save hook to update project progress when task status changes
TaskSchema.pre('save', async function(next) {
    if (this.isModified('status')) {
        const wasCompleted = this._modifiedPaths && 
            this._modifiedPaths().includes('status') && 
            this._previousState && 
            this._previousState.status === 'Completed';
        
        const isCompleted = this.status === 'Completed';
        
        // If task completion status changed, update parent task
        if (wasCompleted !== isCompleted) {
            // Update parent task status after save
            this._updateParentAfterSave = true;
        }
    }
    next();
});

// Post-save hook to update parent task and project
TaskSchema.post('save', async function() {
    if (this._updateParentAfterSave) {
        await this.updateParentStatus();
        
        // Update project progress
        const Project = mongoose.model('Project');
        const project = await Project.findById(this.project);
        if (project) {
            await project.updateProgress();
        }
        
        this._updateParentAfterSave = false;
    }
});

// Add comment method
TaskSchema.methods.addComment = async function(text, userId, mentions = []) {
    this.comments.push({
        text,
        createdBy: userId,
        createdAt: new Date(),
        mentions
    });
    
    await this.save();
    return this;
};

// Add dependency method
TaskSchema.methods.addDependency = async function(dependentTaskId, type = 'finish-to-start', delay = 0) {
    if (!this.dependencies.some(d => d.task.equals(dependentTaskId))) {
        this.dependencies.push({
            task: dependentTaskId,
            type,
            delay
        });
        await this.save();
        
        // Check if this task should be blocked based on dependencies
        await this.updateBlockedStatus();
    }
    return this;
};

// Remove dependency method
TaskSchema.methods.removeDependency = async function(dependentTaskId) {
    this.dependencies = this.dependencies.filter(d => !d.task.equals(dependentTaskId));
    await this.save();
    
    // Check if this task can be unblocked
    await this.updateBlockedStatus();
    
    return this;
};

// Update task blocked status based on dependencies
TaskSchema.methods.updateBlockedStatus = async function() {
    if (this.dependencies.length === 0) {
        if (this.status === 'Blocked' && this.blockedReason === 'Waiting for dependencies') {
            this.status = 'To Do';
            this.blockedReason = '';
            await this.save();
        }
        return this;
    }
    
    const Task = mongoose.model('Task');
    const incompleteDependencies = [];
    
    for (const dependency of this.dependencies) {
        if (dependency.type === 'finish-to-start' || dependency.type === 'finish-to-finish') {
            const depTask = await Task.findById(dependency.task);
            if (depTask && depTask.status !== 'Completed') {
                incompleteDependencies.push(depTask.title);
            }
        }
    }
    
    if (incompleteDependencies.length > 0 && this.status !== 'Completed') {
        this.status = 'Blocked';
        this.blockedReason = 'Waiting for dependencies';
        await this.save();
    } else if (this.status === 'Blocked' && this.blockedReason === 'Waiting for dependencies') {
        this.status = 'To Do';
        this.blockedReason = '';
        await this.save();
    }
    
    return this;
};

// Start time tracking
TaskSchema.methods.startTimeTracking = async function(userId) {
    // Check if there's already an active time tracking for this user
    const activeEntry = this.timeEntries.find(
        entry => entry.user.equals(userId) && !entry.endTime
    );
    
    if (activeEntry) {
        throw new Error('There is already an active time tracking session for this user');
    }
    
    this.timeEntries.push({
        startTime: new Date(),
        user: userId
    });
    
    // If task is in To Do, move it to In Progress
    if (this.status === 'To Do') {
        this.status = 'In Progress';
    }
    
    await this.save();
    return this.timeEntries[this.timeEntries.length - 1];
};

// Stop time tracking
TaskSchema.methods.stopTimeTracking = async function(userId, notes = '') {
    // Find the active time tracking entry for this user
    const entryIndex = this.timeEntries.findIndex(
        entry => entry.user.equals(userId) && !entry.endTime
    );
    
    if (entryIndex === -1) {
        throw new Error('No active time tracking session found for this user');
    }
    
    const entry = this.timeEntries[entryIndex];
    const endTime = new Date();
    
    // Calculate duration in minutes
    const duration = Math.round((endTime - entry.startTime) / (1000 * 60));
    
    // Update the entry
    this.timeEntries[entryIndex].endTime = endTime;
    this.timeEntries[entryIndex].duration = duration;
    this.timeEntries[entryIndex].notes = notes;
    
    // Update actual hours
    const hoursSpent = duration / 60;
    this.actualHours = (this.actualHours || 0) + hoursSpent;
    
    await this.save();
    return this.timeEntries[entryIndex];
};

// Calculate task health
TaskSchema.methods.calculateHealth = async function() {
    // Don't calculate health for completed tasks
    if (this.status === 'Completed') {
        this.health = {
            status: 'on-track',
            lastAssessed: new Date()
        };
        await this.save();
        return this;
    }
    
    let healthStatus = 'on-track';
    
    // Check if task has a due date and is overdue
    if (this.dueDate && new Date() > this.dueDate) {
        healthStatus = 'delayed';
    } 
    // Check if due date is approaching (within 24 hours)
    else if (this.dueDate && 
             new Date() > new Date(this.dueDate.getTime() - 24 * 60 * 60 * 1000) && 
             this.status !== 'Completed') {
        healthStatus = 'at-risk';
    }
    // Check if estimated hours vs actual hours indicates risk
    else if (this.estimatedHours && 
             this.actualHours && 
             this.actualHours > this.estimatedHours * 0.8 && 
             this.status !== 'Completed') {
        healthStatus = 'at-risk';
    }
    // Check if ahead of schedule
    else if (this.estimatedHours && 
             this.actualHours && 
             this.actualHours < this.estimatedHours * 0.5 && 
             this.status === 'In Progress') {
        healthStatus = 'ahead';
    }
    
    this.health = {
        status: healthStatus,
        lastAssessed: new Date()
    };
    
    await this.save();
    return this;
};

// Clone a task (without history and time entries)
TaskSchema.statics.cloneTask = async function(taskId, userId, options = {}) {
    const Task = this;
    const sourceTask = await Task.findById(taskId);
    
    if (!sourceTask) {
        throw new Error('Source task not found');
    }
    
    // Create clone with basic properties
    const cloneData = {
        title: options.title || `Copy of ${sourceTask.title}`,
        description: sourceTask.description,
        project: sourceTask.project,
        status: 'To Do', // Always start as To Do
        priority: sourceTask.priority,
        priorityScore: sourceTask.priorityScore,
        dueDate: options.adjustDates && sourceTask.dueDate ? 
            new Date(sourceTask.dueDate.getTime() + options.dateOffset || 0) : 
            sourceTask.dueDate,
        startDate: options.adjustDates && sourceTask.startDate ? 
            new Date(sourceTask.startDate.getTime() + options.dateOffset || 0) : 
            sourceTask.startDate,
        estimatedHours: sourceTask.estimatedHours,
        assignedTo: options.includeAssignees ? sourceTask.assignedTo : [],
        createdBy: userId,
        tags: sourceTask.tags,
        level: sourceTask.level
    };
    
    // Create the new task
    const clonedTask = new Task(cloneData);
    await clonedTask.save();
    
    // Clone attachments if requested
    if (options.includeAttachments && sourceTask.attachments.length > 0) {
        clonedTask.attachments = sourceTask.attachments;
        await clonedTask.save();
    }
    
    // Clone recurrence settings if requested
    if (options.includeRecurrence && sourceTask.recurrence && sourceTask.recurrence.isRecurring) {
        clonedTask.recurrence = {
            ...sourceTask.recurrence,
            parentRecurringTaskId: sourceTask._id
        };
        await clonedTask.save();
    }
    
    // Clone subtasks if requested
    if (options.includeSubtasks && sourceTask.subtasks.length > 0) {
        for (const subtaskId of sourceTask.subtasks) {
            const clonedSubtask = await Task.cloneTask(subtaskId, userId, {
                ...options,
                title: null // Use default naming for subtasks
            });
            
            // Add as subtask to the cloned parent
            await clonedTask.addSubtask(clonedSubtask._id);
        }
    }
    
    return clonedTask;
};

// Create recurring task instances
TaskSchema.statics.createRecurringInstances = async function(upToDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
    const Task = this;
    
    // Find all recurring task templates that should have instances created
    const recurringTasks = await Task.find({
        'recurrence.isRecurring': true,
        'recurrence.parentRecurringTaskId': null, // Only original templates
    });
    
    for (const template of recurringTasks) {
        // Get the last created instance or use the template's creation date
        const instances = await Task.find({
            'recurrence.parentRecurringTaskId': template._id
        }).sort({ createdAt: -1 }).limit(1);
        
        let lastDate = instances.length > 0 ? 
            instances[0].createdAt : 
            template.createdAt;
        
        // Calculate next occurrence dates up to the specified date
        const nextDates = [];
        let currentDate = new Date(lastDate);
        
        while (currentDate < upToDate) {
            switch (template.recurrence.frequency) {
                case 'daily':
                    currentDate = new Date(currentDate.setDate(
                        currentDate.getDate() + template.recurrence.interval
                    ));
                    break;
                case 'weekly':
                    currentDate = new Date(currentDate.setDate(
                        currentDate.getDate() + (7 * template.recurrence.interval)
                    ));
                    break;
                case 'monthly':
                    currentDate = new Date(currentDate.setMonth(
                        currentDate.getMonth() + template.recurrence.interval
                    ));
                    break;
                case 'yearly':
                    currentDate = new Date(currentDate.setFullYear(
                        currentDate.getFullYear() + template.recurrence.interval
                    ));
                    break;
            }
            
            if (currentDate <= upToDate) {
                nextDates.push(new Date(currentDate));
            }
            
            // Check if we've reached the end date or max occurrences
            if (template.recurrence.endDate && currentDate > new Date(template.recurrence.endDate)) {
                break;
            }
        }
        
        // Create instances for each date
        for (const date of nextDates) {
            // Clone the template
            const instance = await Task.cloneTask(template._id, template.createdBy, {
                title: template.title,
                adjustDates: true,
                dateOffset: date - lastDate, // Adjust all dates by this offset
                includeSubtasks: true,
                includeAttachments: true
            });
            
            // Mark as a recurring instance
            instance.recurrence = {
                isRecurring: false,
                parentRecurringTaskId: template._id
            };
            
            await instance.save();
        }
    }
};

const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema);

export default Task;