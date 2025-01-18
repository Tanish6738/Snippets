import mongoose from 'mongoose';

const snippetSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    tags: [{ type: String, trim: true }],
    programmingLanguage: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 1000 },
    visibility: { type: String, enum: ['public', 'private', 'shared'], default: 'private' },
    directoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Directory' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sharedWith: [{
        entity: { type: mongoose.Schema.Types.ObjectId, refPath: 'sharedWith.entityType' },
        entityType: { type: String, enum: ['User', 'Group'] },
        role: { type: String, enum: ['viewer', 'editor', 'owner'] },
        sharedAt: { type: Date, default: Date.now }
    }],
    shareLink: {
        token: String,
        expiresAt: Date,
        isEnabled: { type: Boolean, default: false }
    },
    versionHistory: [{
        version: { type: Number, required: true },
        content: { type: String, required: true },
        description: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    exportFormats: [{ type: String, enum: ['txt', 'md', 'pdf', 'zip'] }],
    stats: {
        views: { type: Number, default: 0 },
        copies: { type: Number, default: 0 },
        favorites: { type: Number, default: 0 }
    },
    commentsEnabled: { type: Boolean, default: true },
    commentCount: { type: Number, default: 0 }
}, { timestamps: true });

snippetSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Remove console.log from pre-save hook
snippetSchema.pre('save', async function(next) {
    if (this.isModified('content')) {
        const currentVersion = this.versionHistory.length + 1;
        this.versionHistory.push({
            version: currentVersion,
            content: this.content,
            updatedBy: this.createdBy
        });
    }
    next();
});

snippetSchema.pre('save', async function(next) {
    if (this.directoryId) {
        const Directory = mongoose.model('Directory');
        const directory = await Directory.findById(this.directoryId);
        if (!directory) {
            throw new Error('Directory not found');
        }
        if (!directory.isAccessibleBy(this.createdBy)) {
            throw new Error('No access to this directory');
        }
    }
    next();
});

// Add these methods to snippetSchema
snippetSchema.methods.updateCommentCount = async function() {
    const Comment = mongoose.model('Comment');
    this.commentCount = await Comment.countDocuments({ snippetId: this._id });
    return this.save();
};

snippetSchema.methods.isAccessibleBy = function(userId) {
    return this.createdBy.equals(userId) || 
           this.visibility === 'public' ||
           this.sharedWith.some(share => 
               share.entity.equals(userId) && ['viewer', 'editor', 'owner'].includes(share.role)
           );
};

snippetSchema.methods.canEdit = function(userId) {
    return this.createdBy.equals(userId) ||
           this.sharedWith.some(share => 
               share.entity.equals(userId) && ['editor', 'owner'].includes(share.role)
           );
};

export default mongoose.model('Snippet', snippetSchema);