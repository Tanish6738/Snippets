import mongoose from "mongoose";

const TimeEntrySchema = new mongoose.Schema({
    taskId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Task',
        required: true
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    projectId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Project',
        required: true
    },
    startTime: { 
        type: Date, 
        required: true 
    },
    endTime: { 
        type: Date 
    },
    durationMs: { 
        type: Number,
        default: 0
    },
    notes: { 
        type: String,
        default: ''
    },
    tags: [{ 
        type: String 
    }]
}, { timestamps: true });

// Calculate duration when the time entry is stopped
TimeEntrySchema.methods.calculateDuration = function() {
    if (this.startTime && this.endTime) {
        const start = new Date(this.startTime);
        const end = new Date(this.endTime);
        this.durationMs = end.getTime() - start.getTime();
    }
    return this;
};

// Convert duration from ms to minutes
TimeEntrySchema.virtual('durationMinutes').get(function() {
    return Math.round(this.durationMs / 60000);
});

// Convert duration from ms to hours
TimeEntrySchema.virtual('durationHours').get(function() {
    return Math.round((this.durationMs / 3600000) * 100) / 100; // Round to 2 decimals
});

// Static method to get total time for a task
TimeEntrySchema.statics.getTaskTotalTime = async function(taskId) {
    const entries = await this.find({ taskId });
    const totalMs = entries.reduce((total, entry) => total + (entry.durationMs || 0), 0);
    return {
        totalMs,
        totalMinutes: Math.round(totalMs / 60000),
        totalHours: Math.round((totalMs / 3600000) * 100) / 100
    };
};

const TimeEntry = mongoose.models.TimeEntry || mongoose.model("TimeEntry", TimeEntrySchema);

export default TimeEntry;