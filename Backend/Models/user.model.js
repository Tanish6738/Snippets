import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    avatar: { type: String, default: null }, // URL for profile picture
    bio: { type: String, default: null, maxlength: 200 },
    roles: { type: [String], default: ['user'] }, // e.g., admin, user
    isVerified: { type: Boolean, default: false }, // Email verification status
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    groups: [{
        groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
        role: { type: String, enum: ['member', 'admin'], default: 'member' }
    }],
    preferences: {
        defaultSnippetVisibility: { type: String, enum: ['public', 'private'], default: 'private' },
        theme: { type: String, default: 'light' },
        emailNotifications: { type: Boolean, default: true }
    },
    lastLogin: { type: Date },
    favoriteSnippets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Snippet' }],
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
    // Hash the password before saving the user model
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

UserSchema.methods.generateAuthToken = async function () {
    // Generate an auth token for the user
    const user = this;
    const token = jwt.sign({ _id: user._id }, process.env.JWT_KEY);
    // Clear all existing tokens and add the new one
    user.tokens = [{ token }];
    await user.save();
    return token;
}

UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

UserSchema.methods.addToFavorites = async function(snippetId) {
    if (!this.favoriteSnippets.includes(snippetId)) {
        this.favoriteSnippets.push(snippetId);
        await this.save();
        
        // Update snippet stats
        const Snippet = mongoose.model('Snippet');
        await Snippet.findByIdAndUpdate(snippetId, {
            $inc: { 'stats.favorites': 1 }
        });
    }
    return this;
};

UserSchema.methods.removeFromFavorites = async function(snippetId) {
    this.favoriteSnippets = this.favoriteSnippets.filter(id => !id.equals(snippetId));
    await this.save();
    
    // Update snippet stats
    const Snippet = mongoose.model('Snippet');
    await Snippet.findByIdAndUpdate(snippetId, {
        $inc: { 'stats.favorites': -1 }
    });
    return this;
};

UserSchema.methods.getAccessibleSnippets = async function() {
    const Snippet = mongoose.model('Snippet');
    return Snippet.find({
        $or: [
            { createdBy: this._id },
            { visibility: 'public' },
            { 'sharedWith.entity': this._id }
        ]
    });
};

UserSchema.methods.isMemberOf = function(groupId) {
    return this.groups.some(g => g.groupId.equals(groupId));
};

UserSchema.methods.hasGroupRole = function(groupId, role) {
    const group = this.groups.find(g => g.groupId.equals(groupId));
    return group && group.role === role;
};

const User = mongoose.model("User", UserSchema);

export default User;