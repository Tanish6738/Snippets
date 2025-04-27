import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true,
        trim: true 
    },
    description: { 
        type: String, 
        default: '' 
    },
    deadline: { 
        type: Date 
    },
    priority: { 
        type: String, 
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    status: { 
        type: String, 
        enum: ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
        default: 'Planning'
    },
    progress: { 
        type: Number, 
        default: 0,
        min: 0,
        max: 100
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    members: [{
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        },
        role: { 
            type: String, 
            enum: ['Admin', 'Contributor', 'Viewer'],
            default: 'Contributor' 
        },
        joinedAt: { 
            type: Date, 
            default: Date.now 
        }
    }],
    tasks: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Task' 
    }],
    tags: [{ 
        type: String 
    }],
    attachments: [{
        name: { type: String },
        fileUrl: { type: String },
        fileType: { type: String },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now }
    }],
    activity: [{
        action: { type: String },
        description: { type: String },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Method to check if a user has specific permission for this project
ProjectSchema.methods.hasPermission = function(userId, requiredRole) {
    // Creator is always Admin
    if (this.createdBy.equals(userId)) return true;
    
    const member = this.members.find(m => m.user.equals(userId));
    if (!member) return false;
    
    if (requiredRole === 'Admin') {
        return member.role === 'Admin';
    } else if (requiredRole === 'Contributor') {
        return ['Admin', 'Contributor'].includes(member.role);
    } else if (requiredRole === 'Viewer') {
        return ['Admin', 'Contributor', 'Viewer'].includes(member.role);
    }
    
    return false;
};

// Method to add activity log to the project
ProjectSchema.methods.addActivity = async function(action, description, userId) {
    this.activity.push({
        action,
        description,
        user: userId,
        timestamp: new Date()
    });
    await this.save();
    return this;
};

// Method to update project progress based on task completion
ProjectSchema.methods.updateProgress = async function() {
    const Task = mongoose.model('Task');
    const tasks = await Task.find({ _id: { $in: this.tasks } });
    
    if (tasks.length === 0) {
        this.progress = 0;
    } else {
        const completedTasks = tasks.filter(t => t.status === 'Completed').length;
        this.progress = Math.round((completedTasks / tasks.length) * 100);
    }
    
    // Update project status if all tasks are completed
    if (this.progress === 100 && tasks.length > 0) {
        this.status = 'Completed';
    } else if (this.progress > 0) {
        this.status = 'In Progress';
    }
    
    await this.save();
    return this;
};

const Project = mongoose.models.Project || mongoose.model("Project", ProjectSchema);

export default Project;