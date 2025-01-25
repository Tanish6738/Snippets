import Blog from '../../Models/Blog/Blog.model.js';
import { Comment, Like } from '../../Models/Blog/CommentAndLike.js';

// Create Blog
export const createBlog = async (req, res) => {
    try {
        const { title, content, tags, status, thumbnail } = req.body;
        
        const blog = new Blog({
            title,
            content,
            author: req.user._id,
            tags,
            status,
            thumbnail
        });

        await blog.save();
        await req.user.addBlogPost(blog._id);

        res.status(201).json({
            success: true,
            blog
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get All Blogs
export const getAllBlogs = async (req, res) => {
    try {
        const { page = 1, limit = 10, tag, status = 'published', search } = req.query;
        const query = { status };
        
        if (search) {
            // Simplified search logic
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { title: searchRegex },
                { content: searchRegex },
                { tags: searchRegex }
            ];
        }
        
        if (tag) {
            query.tags = tag;
        }

        // Rest of the function remains the same
        const blogs = await Blog.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('author', 'username avatar');

        const total = await Blog.countDocuments(query);

        res.json({
            success: true,
            blogs,
            total,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Search error:', error); // Add this for debugging
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get Blog by Slug
export const getBlogBySlug = async (req, res) => {
    try {
        const blog = await Blog.findOne({ slug: req.params.slug })
            .populate('author', 'username avatar bio')
            .populate({
                path: 'comments',
                populate: {
                    path: 'author',
                    select: 'username avatar'
                }
            });

        if (!blog) {
            return res.status(404).json({
                success: false,
                error: 'Blog not found'
            });
        }

        // Increment view count
        blog.metadata.views += 1;
        await blog.save();

        res.json({
            success: true,
            blog
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get Blog by ID
export const getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id)
            .populate('author', 'username avatar bio')
            .populate({
                path: 'comments',
                populate: {
                    path: 'author',
                    select: 'username avatar'
                }
            });

        if (!blog) {
            return res.status(404).json({
                success: false,
                error: 'Blog not found'
            });
        }

        res.json({
            success: true,
            blog
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update Blog
export const updateBlog = async (req, res) => {
    try {
        const { title, content, tags, status, thumbnail } = req.body;
        const blog = await Blog.findOne({
            _id: req.params.id,
            author: req.user._id
        });

        if (!blog) {
            return res.status(404).json({
                success: false,
                error: 'Blog not found'
            });
        }

        Object.assign(blog, {
            title,
            content,
            tags,
            status,
            thumbnail
        });

        await blog.save();

        res.json({
            success: true,
            blog
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Delete Blog
export const deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findOneAndDelete({
            _id: req.params.id,
            author: req.user._id
        });

        if (!blog) {
            return res.status(404).json({
                success: false,
                error: 'Blog not found'
            });
        }

        // Clean up associated comments and likes
        await Comment.deleteMany({ blog: blog._id });
        await Like.deleteMany({ 
            contentType: 'blog',
            contentId: blog._id
        });

        res.json({
            success: true,
            message: 'Blog deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Toggle Featured Status (Admin only)
export const toggleFeatured = async (req, res) => {
    try {
        if (!req.user.roles.includes('admin')) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({
                success: false,
                error: 'Blog not found'
            });
        }

        blog.metadata.featured = !blog.metadata.featured;
        await blog.save();

        res.json({
            success: true,
            blog
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const getBlogStats = async (req, res) => {
    try {
        const stats = await Blog.aggregate([
            { $match: { author: req.user._id } },
            {
                $facet: {
                    posts: [{ $count: "total" }],
                    views: [
                        { $group: { _id: null, total: { $sum: "$metadata.views" } } }
                    ],
                    likes: [
                        { $lookup: {
                            from: 'likes',
                            localField: '_id',
                            foreignField: 'contentId',
                            as: 'likes'
                        }},
                        { $group: { _id: null, total: { $sum: { $size: "$likes" } } } }
                    ],
                    comments: [
                        { $lookup: {
                            from: 'comments',
                            localField: '_id',
                            foreignField: 'blog',
                            as: 'comments'
                        }},
                        { $group: { _id: null, total: { $sum: { $size: "$comments" } } } }
                    ]
                }
            }
        ]);

        // Format the response
        const formattedStats = {
            posts: stats[0].posts[0]?.total || 0,
            views: stats[0].views[0]?.total || 0,
            likes: stats[0].likes[0]?.total || 0,
            comments: stats[0].comments[0]?.total || 0
        };

        res.json({
            success: true,
            stats: formattedStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};