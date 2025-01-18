import mongoose from 'mongoose';

const directorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    path: { type: String, required: true }, // Full path for nested structure
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Directory' },
    ancestors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Directory' }],
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
    metadata: {
        size: { type: Number, default: 0 }, // Total size of contents
        snippetCount: { type: Number, default: 0 },
        subDirectoryCount: { type: Number, default: 0 }
    },
    visibility: { type: String, enum: ['public', 'private', 'shared'], default: 'private' }
}, { timestamps: true });

directorySchema.index({ name: 'text', path: 'text' });

// Add these methods to directorySchema
directorySchema.methods.updateMetadata = async function() {
    const Snippet = mongoose.model('Snippet');
    const Directory = this.constructor;
    
    const [snippetCount, subDirectoryCount, snippets] = await Promise.all([
        Snippet.countDocuments({ directoryId: this._id }),
        Directory.countDocuments({ parentId: this._id }),
        Snippet.find({ directoryId: this._id }, 'content')
    ]);
    
    this.metadata.snippetCount = snippetCount;
    this.metadata.subDirectoryCount = subDirectoryCount;
    this.metadata.size = snippets.reduce((acc, curr) => acc + Buffer.byteLength(curr.content, 'utf8'), 0);
    
    return this.save();
};

directorySchema.methods.isAccessibleBy = function(userId) {
    return this.createdBy.equals(userId) || 
           this.visibility === 'public' ||
           this.sharedWith.some(share => 
               share.entity.equals(userId) && ['viewer', 'editor', 'owner'].includes(share.role)
           );
};

export default mongoose.model('Directory', directorySchema);
