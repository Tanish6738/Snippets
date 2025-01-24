import { Comment, Like } from '../../Models/Blog/CommentAndLike.js';
import Blog from '../../Models/Blog/Blog.model.js';

// Create Comment
export const createComment = async (req, res) => {
    try {
        const { content, blogId, parentCommentId } = req.body;
        
        const comment = new Comment({
            content,
            author: req.user._id,
            blog: blogId,
            parentComment: parentCommentId || null
        });

        await comment.save();
        await req.user.addBlogComment(comment._id);

        if (parentCommentId) {
            await Comment.findByIdAndUpdate(parentCommentId, {
                $push: { replies: comment._id }
            });
        }

        await Blog.findByIdAndUpdate(blogId, {
            $push: { comments: comment._id }
        });

        await comment.populate('author', 'username avatar');
        
        res.status(201).json({
            success: true,
            comment
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Update Comment
export const updateComment = async (req, res) => {
    try {
        const comment = await Comment.findOne({
            _id: req.params.id,
            author: req.user._id
        });

        if (!comment) {
            return res.status(404).json({
                success: false,
                error: 'Comment not found'
            });
        }

        comment.content = req.body.content;
        comment.isEdited = true;
        await comment.save();

        res.json({
            success: true,
            comment
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Delete Comment
export const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findOne({
            _id: req.params.id,
            author: req.user._id
        });

        if (!comment) {
            return res.status(404).json({
                success: false,
                error: 'Comment not found'
            });
        }

        // Remove comment from parent's replies if it's a reply
        if (comment.parentComment) {
            await Comment.findByIdAndUpdate(comment.parentComment, {
                $pull: { replies: comment._id }
            });
        }

        // Remove comment from blog
        await Blog.findByIdAndUpdate(comment.blog, {
            $pull: { comments: comment._id }
        });

        // Delete the comment and its likes
        await Like.deleteMany({
            contentType: 'comment',
            contentId: comment._id
        });
        await comment.remove();

        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Toggle Like
export const toggleLike = async (req, res) => {
    try {
        const { contentType, contentId } = req.body;

        await req.user.toggleBlogLike(contentId);

        const contentModel = contentType === 'blog' ? Blog : Comment;
        const content = await contentModel.findById(contentId);

        if (!content) {
            return res.status(404).json({
                success: false,
                error: `${contentType} not found`
            });
        }

        res.json({
            success: true,
            message: 'Like toggled successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get Comments for Blog
export const getBlogComments = async (req, res) => {
    try {
        const { blogId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const comments = await Comment.find({
            blog: blogId,
            parentComment: null
        })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('author', 'username avatar')
            .populate({
                path: 'replies',
                populate: {
                    path: 'author',
                    select: 'username avatar'
                }
            });

        const total = await Comment.countDocuments({
            blog: blogId,
            parentComment: null
        });

        res.json({
            success: true,
            comments,
            total,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
