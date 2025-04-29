import mongoose from 'mongoose';

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
    status: {
        type: String,
        enum: ['To Do', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
        default: 'To Do'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    dueDate: {
        type: Date
    },
    estimatedHours: {
        type: Number
    },
    actualHours: {
        type: Number
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tags: [{
        type: String
    }],
    dependencies: [{
        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task'
        },
        type: {
            type: String,
            enum: ['finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish'],
            default: 'finish-to-start'
        },
        delay: {
            type: Number,
            default: 0
        }
    }],
    attachments: [{
        name: { type: String },
        fileUrl: { type: String },
        fileType: { type: String },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now }
    }],
    comments: [{
        text: { type: String },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
        mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    checklist: [{
        title: { type: String },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
        completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    level: {
        type: Number,
        default: 0
    },
    recurrence: {
        isRecurring: { type: Boolean, default: false },
        parentRecurringTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
        frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'custom'] },
        interval: { type: Number },
        daysOfWeek: [{ type: Number, min: 0, max: 6 }], // 0 = Sunday, 6 = Saturday
        endDate: { type: Date },
        occurrences: { type: Number }
    },
    category: {
        type: String,
        default: 'General' // e.g., Development, Testing, Documentation, Meeting, Design
    },
    aiGenerated: {
        type: Boolean,
        default: false
    },
    health: {
        status: { type: String, enum: ['on-track', 'at-risk', 'delayed', 'ahead'], default: 'on-track' },
        lastCalculatedAt: { type: Date },
        factors: {
            daysUntilDue: { type: Number },
            blockedByDependencies: { type: Boolean, default: false },
            progressRate: { type: Number }, // percentage
            risksIdentified: { type: Number, default: 0 }
        }
    }
}, { timestamps: true });

// Method to add a subtask to this task
TaskSchema.methods.addSubtask = async function(subtaskId) {
    if (!this.subtasks.includes(subtaskId)) {
        this.subtasks.push(subtaskId);
    }
    await this.save();
    return this;
};

// Method to remove a subtask from this task
TaskSchema.methods.removeSubtask = async function(subtaskId) {
    this.subtasks = this.subtasks.filter(id => !id.equals(subtaskId));
    await this.save();
    return this;
};

// Method to add a comment to the task
TaskSchema.methods.addComment = async function(text, userId, mentions = []) {
    this.comments.push({
        text,
        user: userId,
        mentions,
        createdAt: new Date()
    });
    
    await this.save();
    
    // Get the added comment
    return this.comments[this.comments.length - 1];
};

// Method to add a dependency
TaskSchema.methods.addDependency = async function(taskId, type = 'finish-to-start', delay = 0) {
    // Check if dependency already exists
    const existingDependency = this.dependencies.find(d => d.task.equals(taskId));
    
    if (existingDependency) {
        // Update existing dependency
        existingDependency.type = type;
        existingDependency.delay = delay;
    } else {
        // Add new dependency
        this.dependencies.push({
            task: taskId,
            type,
            delay
        });
    }
    
    await this.save();
    return this;
};

// Method to remove a dependency
TaskSchema.methods.removeDependency = async function(taskId) {
    this.dependencies = this.dependencies.filter(d => !d.task.equals(taskId));
    await this.save();
    return this;
};

// Method to calculate task health
TaskSchema.methods.calculateHealth = async function() {
    // Implementation of health calculation logic
    const now = new Date();
    let healthStatus = 'on-track';
    const factors = {
        daysUntilDue: 0,
        blockedByDependencies: false,
        progressRate: 0,
        risksIdentified: 0
    };
    
    // Calculate days until due date
    if (this.dueDate) {
        const dueDate = new Date(this.dueDate);
        const timeDiff = dueDate.getTime() - now.getTime();
        const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24));
        factors.daysUntilDue = daysUntilDue;
        
        // If less than 2 days and task isn't in progress or completed, flag as at risk
        if (daysUntilDue <= 2 && !['In Progress', 'Completed'].includes(this.status)) {
            healthStatus = 'at-risk';
        }
        
        // If due date has passed and task isn't completed, flag as delayed
        if (daysUntilDue < 0 && this.status !== 'Completed') {
            healthStatus = 'delayed';
        }
    }
    
    // Check dependencies
    if (this.dependencies.length > 0) {
        const Task = mongoose.model('Task');
        
        for (const dep of this.dependencies) {
            const dependencyTask = await Task.findById(dep.task);
            
            if (dependencyTask && dependencyTask.status !== 'Completed') {
                factors.blockedByDependencies = true;
                
                // If dependency is blocking and dependency isn't completed, task is at risk
                if (dep.type === 'finish-to-start' && healthStatus === 'on-track') {
                    healthStatus = 'at-risk';
                }
                
                break;
            }
        }
    }
    
    // Calculate progress based on checklist items if they exist
    if (this.checklist && this.checklist.length > 0) {
        const completedItems = this.checklist.filter(item => item.completed).length;
        factors.progressRate = Math.round((completedItems / this.checklist.length) * 100);
    }
    
    // If task was completed early, mark as ahead
    if (this.status === 'Completed' && this.dueDate) {
        const completedDate = this.updatedAt;
        const dueDate = new Date(this.dueDate);
        
        if (completedDate < dueDate) {
            healthStatus = 'ahead';
        }
    }
    
    // Update the health status and factors
    this.health = {
        status: healthStatus,
        lastCalculatedAt: now,
        factors
    };
    
    await this.save();
    return this.health;
};

// Static method to clone a task
TaskSchema.statics.cloneTask = async function(taskId, userId, options = {}) {
    try {
        const Task = this;
        const sourceTask = await Task.findById(taskId);
        
        if (!sourceTask) {
            throw new Error('Source task not found');
        }
        
        // Create a new task with properties from the source task
        const clonedTask = new Task({
            title: options.title || `Copy of ${sourceTask.title}`,
            description: sourceTask.description,
            project: sourceTask.project,
            parentTask: sourceTask.parentTask, // Keep same parent
            status: 'To Do', // Always start as To Do
            priority: sourceTask.priority,
            createdBy: userId,
            tags: sourceTask.tags
        });
        
        // Handle date adjustments if requested
        if (sourceTask.dueDate && (options.adjustDates !== false)) {
            const dateOffset = options.dateOffset || 0; // Days to offset
            const newDueDate = new Date(sourceTask.dueDate);
            newDueDate.setDate(newDueDate.getDate() + dateOffset);
            clonedTask.dueDate = newDueDate;
        }
        
        // Handle estimated hours
        if (sourceTask.estimatedHours) {
            clonedTask.estimatedHours = sourceTask.estimatedHours;
        }
        
        // Include assignees if requested
        if (options.includeAssignees && sourceTask.assignedTo && sourceTask.assignedTo.length > 0) {
            clonedTask.assignedTo = [...sourceTask.assignedTo];
        }
        
        // Save the cloned task
        await clonedTask.save();
        
        // If requested, clone attachments (references to same files)
        if (options.includeAttachments && sourceTask.attachments && sourceTask.attachments.length > 0) {
            clonedTask.attachments = sourceTask.attachments.map(att => ({
                name: att.name,
                fileUrl: att.fileUrl,
                fileType: att.fileType,
                uploadedBy: userId,
                uploadedAt: new Date()
            }));
            
            await clonedTask.save();
        }
        
        // If requested and source has subtasks, clone subtasks recursively
        if (options.includeSubtasks && sourceTask.subtasks && sourceTask.subtasks.length > 0) {
            // Fetch subtasks
            const subtasks = await Task.find({ _id: { $in: sourceTask.subtasks } });
            
            // Clone each subtask
            for (const subtask of subtasks) {
                const clonedSubtask = await Task.cloneTask(subtask._id, userId, {
                    ...options,
                    title: subtask.title, // Keep original title for subtasks
                });
                
                // Set the parent to the new cloned task
                clonedSubtask.parentTask = clonedTask._id;
                await clonedSubtask.save();
                
                // Add to subtasks of cloned task
                clonedTask.subtasks.push(clonedSubtask._id);
            }
            
            await clonedTask.save();
        }
        
        // If this task is a top-level task, add it to the project
        if (!clonedTask.parentTask) {
            const Project = mongoose.model('Project');
            const project = await Project.findById(clonedTask.project);
            
            if (project) {
                project.tasks.push(clonedTask._id);
                await project.save();
            }
        } else {
            // If it's a subtask, add it to the parent's subtasks
            const parentTask = await Task.findById(clonedTask.parentTask);
            if (parentTask) {
                await parentTask.addSubtask(clonedSubtask._id);
            }
        }
        
        return clonedTask;
    } catch (error) {
        console.error('Error cloning task:', error);
        throw error;
    }
};

// Static method to create recurring task instances
TaskSchema.statics.createRecurringInstances = async function(upToDate) {
    try {
        const Task = this;
        const Project = mongoose.model('Project');
        
        // Find all recurring task templates
        const recurringTasks = await Task.find({
            'recurrence.isRecurring': true,
            $or: [
                { 'recurrence.endDate': { $gte: new Date() } },
                { 'recurrence.endDate': null }
            ]
        });
        
        const results = {
            processed: recurringTasks.length,
            created: 0,
            errors: 0
        };
        
        for (const taskTemplate of recurringTasks) {
            try {
                // Determine dates to generate instances for
                const dates = calculateRecurringDates(
                    taskTemplate.recurrence,
                    upToDate
                );
                
                // For each date, check if we already have an instance,
                // if not, create one
                for (const date of dates) {
                    // Check if instance already exists for this date
                    const existingInstance = await Task.findOne({
                        'recurrence.parentRecurringTaskId': taskTemplate._id,
                        dueDate: {
                            $gte: new Date(date.setHours(0, 0, 0, 0)),
                            $lt: new Date(date.setHours(23, 59, 59, 999))
                        }
                    });
                    
                    if (!existingInstance) {
                        // Create a new instance
                        const instance = new Task({
                            title: taskTemplate.title,
                            description: taskTemplate.description,
                            project: taskTemplate.project,
                            parentTask: taskTemplate.parentTask,
                            status: 'To Do',
                            priority: taskTemplate.priority,
                            dueDate: date,
                            estimatedHours: taskTemplate.estimatedHours,
                            assignedTo: taskTemplate.assignedTo,
                            createdBy: taskTemplate.createdBy,
                            tags: taskTemplate.tags,
                            recurrence: {
                                isRecurring: false,
                                parentRecurringTaskId: taskTemplate._id
                            }
                        });
                        
                        await instance.save();
                        
                        // Add to parent task if this is a subtask
                        if (instance.parentTask) {
                            const parentTask = await Task.findById(instance.parentTask);
                            if (parentTask) {
                                await parentTask.addSubtask(instance._id);
                            }
                        } else {
                            // Add to project if top-level task
                            const project = await Project.findById(instance.project);
                            if (project) {
                                project.tasks.push(instance._id);
                                await project.save();
                            }
                        }
                        
                        results.created++;
                    }
                }
            } catch (err) {
                console.error(`Error processing recurring task ${taskTemplate._id}:`, err);
                results.errors++;
            }
        }
        
        return results;
    } catch (error) {
        console.error('Error creating recurring instances:', error);
        throw error;
    }
};

// Helper function to calculate recurring dates
function calculateRecurringDates(recurrence, upToDate) {
    const dates = [];
    const now = new Date();
    const endDate = recurrence.endDate ? new Date(recurrence.endDate) : upToDate;
    
    let currentDate = new Date();
    
    switch (recurrence.frequency) {
        case 'daily':
            while (currentDate <= endDate) {
                if (currentDate >= now) {
                    dates.push(new Date(currentDate));
                }
                currentDate.setDate(currentDate.getDate() + (recurrence.interval || 1));
            }
            break;
            
        case 'weekly':
            // If specific days of week are set, use those
            if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
                while (currentDate <= endDate) {
                    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
                    
                    if (recurrence.daysOfWeek.includes(dayOfWeek) && currentDate >= now) {
                        dates.push(new Date(currentDate));
                    }
                    
                    currentDate.setDate(currentDate.getDate() + 1);
                    
                    // If we've gone through a full week, apply the interval
                    if (dayOfWeek === 6) { // If Saturday (end of week)
                        currentDate.setDate(
                            currentDate.getDate() + (7 * ((recurrence.interval || 1) - 1))
                        );
                    }
                }
            } else {
                // Simple weekly recurrence
                while (currentDate <= endDate) {
                    if (currentDate >= now) {
                        dates.push(new Date(currentDate));
                    }
                    currentDate.setDate(currentDate.getDate() + (7 * (recurrence.interval || 1)));
                }
            }
            break;
            
        case 'monthly':
            while (currentDate <= endDate) {
                if (currentDate >= now) {
                    dates.push(new Date(currentDate));
                }
                
                // Add months based on interval
                currentDate.setMonth(currentDate.getMonth() + (recurrence.interval || 1));
            }
            break;
            
        case 'custom':
            // For custom recurrence, we'd need a more complex implementation
            // based on specific requirements
            break;
    }
    
    // Limit by occurrences if specified
    if (recurrence.occurrences && dates.length > recurrence.occurrences) {
        return dates.slice(0, recurrence.occurrences);
    }
    
    return dates;
}

const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

export default Task;