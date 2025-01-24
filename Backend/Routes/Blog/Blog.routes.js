import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { body } from 'express-validator';
import {
    createBlog,
    getAllBlogs,
    getBlogBySlug,
    updateBlog,
    deleteBlog,
    toggleFeatured
} from '../../controllers/Blog/blog.controller.js';

const blogRouter = Router();

// Validation middleware
const blogValidation = [
    body('title')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters'),
    body('content')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Content is required'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    body('status')
        .isIn(['draft', 'published', 'archived'])
        .withMessage('Invalid status')
];

// Public routes
blogRouter.get('/', getAllBlogs);
blogRouter.get('/:slug', getBlogBySlug);

// Protected routes
blogRouter.use(authMiddleware);

blogRouter.post('/', blogValidation, createBlog);
blogRouter.put('/:id', blogValidation, updateBlog);
blogRouter.delete('/:id', deleteBlog);
blogRouter.patch('/:id/featured', toggleFeatured);

export default blogRouter;
