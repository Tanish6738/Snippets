import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 500 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['member', 'admin'], default: 'member' },
        joinedAt: { type: Date, default: Date.now }
    }],
    snippets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Snippet' }],
    directories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Directory' }],
    settings: {
        joinPolicy: { type: String, enum: ['open', 'invite', 'closed'], default: 'invite' },
        visibility: { type: String, enum: ['public', 'private'], default: 'private' }
    }
}, { timestamps: true });

groupSchema.pre('save', function(next) {
    // Ensure at least one admin exists
    if (this.members.length > 0 && !this.members.some(m => m.role === 'admin')) {
        this.members[0].role = 'admin';
    }
    next();
});

groupSchema.methods.addMember = async function(userId, role = 'member') {
    if (!this.members.some(m => m.userId.equals(userId))) {
        this.members.push({ userId, role });
        await this.save();
    }
    return this;
};

groupSchema.methods.removeMember = async function(userId) {
    this.members = this.members.filter(m => !m.userId.equals(userId));
    await this.save();
    return this;
};

groupSchema.methods.isMemberAllowed = function(userId, requiredRole) {
    const member = this.members.find(m => m.userId.equals(userId));
    if (!member) return false;
    if (requiredRole === 'member') return true;
    return member.role === requiredRole;
};

export default mongoose.model('Group', groupSchema);
