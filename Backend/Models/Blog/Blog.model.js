import mongoose from 'mongoose';
import { Comment, Like } from './CommentAndLike.js';

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        minlength: [1, 'Title must be at least 1 character long'],
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        index: true  // Define the index here instead of using schema.index()
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
        minlength: [1, 'Content must be at least 1 character long']
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Like'
    }],
    tags: [{
        type: String,
        lowercase: true,
        trim: true
    }],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    thumbnail: {
        url: String,
        alt: String
    },
    metadata: {
        readTime: {
            type: Number,
            default: 1
        },
        views: {
            type: Number,
            default: 0
        },
        featured: {
            type: Boolean,
            default: false
        }
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Add indexes (remove the duplicate slug index)
blogSchema.index({ author: 1, createdAt: -1 });
blogSchema.index({ tags: 1 });

// Remove or comment out the existing text index
// blogSchema.index({
//   title: 'text',
//   content: 'text',
//   tags: 'text',
//   'author.username': 'text'
// });

// Add a single compound text index instead
blogSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Pre-save middleware to generate slug
blogSchema.pre('save', function(next) {
    if (this.isModified('title')) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');
    }
    next();
});

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
