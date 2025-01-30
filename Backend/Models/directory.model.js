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
        subDirectoryCount: { type: Number, default: 0 },
        totalSize: { type: Number, default: 0 }
    },
    visibility: { type: String, enum: ['public', 'private', 'group'], default: 'private' },
    children: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Directory'
    }],
    snippets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Snippet'
    }],
    level: { type: Number, default: 0 },
    isRoot: { type: Boolean, default: false },
    allSnippets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Snippet' }],
    directSnippets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Snippet' }],
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }
}, { timestamps: true });

directorySchema.index({ name: 'text', path: 'text' });

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

directorySchema.methods.addChild = async function(childDir) {
    if (!this.children.includes(childDir._id)) {
        this.children.push(childDir._id);
        childDir.parentId = this._id;
        childDir.level = this.level + 1;
        childDir.path = `${this.path}/${childDir.name}`;
        await Promise.all([this.save(), childDir.save()]);
    }
    return this;
};

directorySchema.methods.propagateSnippetToAncestors = async function(snippetId) {
    const ancestors = await this.constructor.find({ _id: { $in: this.ancestors } });
    await Promise.all(ancestors.map(ancestor => {
        if (!ancestor.allSnippets.includes(snippetId)) {
            ancestor.allSnippets.push(snippetId);
            return ancestor.save();
        }
    }));
};

directorySchema.methods.addSnippet = async function(snippet) {
    if (!this.directSnippets.includes(snippet._id)) {
        this.directSnippets.push(snippet._id);
        this.allSnippets.push(snippet._id);
        snippet.directoryId = this._id;
        await this.propagateSnippetToAncestors(snippet._id);
        await Promise.all([this.save(), snippet.save()]);
    }
    return this;
};

directorySchema.methods.getFullHierarchy = async function() {
    return await this.constructor.findById(this._id)
        .populate({
            path: 'children',
            populate: {
                path: 'snippets'
            }
        })
        .populate('snippets');
};

directorySchema.methods.getFullHierarchyWithSnippets = async function() {
    const populatedDir = await this.constructor.findById(this._id)
        .populate({
            path: 'children',
            populate: {
                path: 'directSnippets allSnippets'
            }
        })
        .populate('directSnippets')
        .populate('allSnippets');
    return populatedDir;
};

directorySchema.methods.updateMetadataRecursive = async function() {
    const [snippets, subdirs] = await Promise.all([
        mongoose.model('Snippet').find({ directoryId: this._id }),
        this.constructor.find({ parentId: this._id })
    ]);

    let totalSize = 0;
    let totalSnippets = snippets.length;

    for (const subdir of subdirs) {
        await subdir.updateMetadataRecursive();
        totalSize += subdir.metadata.totalSize;
        totalSnippets += subdir.metadata.snippetCount;
    }

    totalSize += snippets.reduce((acc, curr) => 
        acc + Buffer.byteLength(curr.content, 'utf8'), 0);

    this.metadata = {
        size: totalSize,
        snippetCount: totalSnippets,
        subDirectoryCount: subdirs.length,
        totalSize: totalSize
    };

    await this.save();
    return this;
};

const Directory = mongoose.models.Directory || mongoose.model('Directory', directorySchema);

export default Directory;
