import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    contentType: {
        type: String,
        enum: ['blog', 'comment'],
        required: true
    },
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'contentType'
    }
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    blog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
        required: true
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    likes: [likeSchema],
    isEdited: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Indexes
commentSchema.index({ blog: 1, createdAt: -1 });
likeSchema.index({ user: 1, contentType: 1, contentId: 1 }, { unique: true });

const Like = mongoose.model('Like', likeSchema);
const Comment = mongoose.model('Comment', commentSchema);

export { Comment, Like };
