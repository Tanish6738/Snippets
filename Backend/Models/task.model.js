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

const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema);

export default Task;