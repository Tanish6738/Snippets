import mongoose from 'mongoose';

// Message sub-schema for chat functionality
const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    attachments: [{
        type: { type: String, enum: ['snippet', 'directory', 'file'] },
        itemId: { type: mongoose.Schema.Types.ObjectId },
        name: String
    }],
    reactions: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        type: String
    }],
    isEdited: { type: Boolean, default: false }
}, { timestamps: true });

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 500 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['member', 'admin', 'moderator'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
        permissions: [{
            type: String,
            enum: ['create_snippet', 'edit_snippet', 'delete_snippet', 
                   'create_directory', 'edit_directory', 'delete_directory',
                   'invite_members', 'remove_members', 'manage_roles']
        }]
    }],
    snippets: [{
        snippetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Snippet' },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now }
    }],
    directories: [{
        directoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Directory' },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now }
    }],
    rootDirectory: { type: mongoose.Schema.Types.ObjectId, ref: 'Directory' },
    chat: {
        messages: [messageSchema],
        pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId }],
        settings: {
            enabled: { type: Boolean, default: true },
            fileSharing: { type: Boolean, default: true },
            retention: { type: Number, default: 300 } // Days to keep messages
        }
    },
    featured: { type: Boolean, default: false },
    settings: {
        joinPolicy: { type: String, enum: ['open', 'invite', 'closed'], default: 'invite' },
        visibility: { type: String, enum: ['public', 'private'], default: 'private' },
        snippetPermissions: {
            defaultVisibility: { type: String, enum: ['public', 'private', 'group'], default: 'group' },
            allowMemberCreation: { type: Boolean, default: true }
        },
        directoryPermissions: {
            allowMemberCreation: { type: Boolean, default: true }
        }
    }
}, { timestamps: true });

// Initialize root directory on group creation
groupSchema.pre('save', async function(next) {
    // Only create root directory if it's a new group and no rootDirectory exists
    if (this.isNew && !this.rootDirectory) {
        const Directory = mongoose.model('Directory');
        try {
            // Check if root directory already exists for this group
            const existingRoot = await Directory.findOne({
                groupId: this._id,
                isRoot: true
            });

            if (!existingRoot) {
                const rootDir = new Directory({
                    name: `${this.name}-root`,
                    path: '/',
                    createdBy: this.createdBy,
                    isRoot: true,
                    level: 0,
                    visibility: 'group',
                    groupId: this._id
                });
                await rootDir.save();
                this.rootDirectory = rootDir._id;
                this.directories.push({
                    directoryId: rootDir._id,
                    addedBy: this.createdBy,
                    addedAt: new Date()
                });
                console.log('Created root directory for group:', this.name);
            }
        } catch (error) {
            console.error('Error creating root directory:', error);
        }
    }
    next();
});

// Chat methods
groupSchema.methods.addMessage = async function(senderId, content, attachments = []) {
    const message = {
        sender: senderId,
        content,
        attachments
    };
    this.chat.messages.push(message);
    console.log('Message added:', message); // Add logging
    return this.save();
};

// Snippet management methods
groupSchema.methods.addSnippet = async function(snippetId, userId) {
    if (!this.snippets.some(s => s.snippetId.equals(snippetId))) {
        this.snippets.push({
            snippetId,
            addedBy: userId
        });
        console.log('Snippet added:', snippetId); // Add logging
        await this.save();
    }
    return this;
};

// Directory management methods
groupSchema.methods.addDirectory = async function(directoryId, userId) {
    if (!this.directories.some(d => d.directoryId.equals(directoryId))) {
        this.directories.push({
            directoryId,
            addedBy: userId
        });
        console.log('Directory added:', directoryId); // Add logging
        await this.save();
    }
    return this;
};

// Member management with enhanced permissions
groupSchema.methods.addMember = async function(userId, role = 'member') {
    if (!this.members.some(m => m.userId.equals(userId))) {
        const defaultPermissions = role === 'admin' 
            ? ['create_snippet', 'edit_snippet', 'delete_snippet', 
               'create_directory', 'edit_directory', 'delete_directory',
               'invite_members', 'remove_members', 'manage_roles']
            : ['create_snippet', 'edit_snippet', 'create_directory', 
               'edit_directory', 'delete_snippet', 'delete_directory'];

        this.members.push({
            userId,
            role,
            permissions: defaultPermissions
        });
        console.log('Member added:', userId); // Add logging
        await this.save();
    }
    return this;
};

groupSchema.methods.updateMemberPermissions = async function(userId, permissions) {
    const member = this.members.find(m => m.userId.equals(userId));
    if (member) {
        member.permissions = permissions;
        await this.save();
    }
    return this;
};

// Check member permissions
groupSchema.methods.canPerformAction = function(userId, permission) {
    const member = this.members.find(m => m.userId.equals(userId));
    return member && (
        member.role === 'admin' || 
        member.permissions.includes(permission)
    );
};

const Group = mongoose.models.Group || mongoose.model('Group', groupSchema);
export default Group;
