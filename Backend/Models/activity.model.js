import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { 
        type: String, 
        enum: ['create', 'view', 'edit', 'delete', 'share', 'comment', 'export', 'favorite'],
        required: true 
    },
    targetType: { 
        type: String, 
        enum: ['snippet', 'directory', 'comment', 'group'], 
        required: true 
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    metadata: {
        previousState: { type: mongoose.Schema.Types.Mixed },
        newState: { type: mongoose.Schema.Types.Mixed },
        changes: [{ type: String }],
        visibility: { type: String },
        sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        exportFormat: { type: String }
    },
    ipAddress: String,
    userAgent: String,
    relatedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

activitySchema.index({ userId: 1, targetId: 1, createdAt: -1 });

// Add a static method to create activity logs
activitySchema.statics.logActivity = async function(data) {
    const activity = new this({
        userId: data.userId,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        metadata: data.metadata,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        relatedUsers: data.relatedUsers || []
    });
    return activity.save();
};

const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);
export default Activity;
