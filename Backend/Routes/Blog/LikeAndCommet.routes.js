import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { body } from 'express-validator';
import {
    createComment,
    updateComment,
    deleteComment,
    toggleLike,
    getBlogComments
} from '../../controllers/Blog/likeandcommet.controller.js';

const router = Router();

// Validation middleware
const commentValidation = [
    body('content')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Comment content is required'),
    body('blogId')
        .isMongoId()
        .withMessage('Valid blog ID is required'),
    body('parentCommentId')
        .optional()
        .isMongoId()
        .withMessage('Valid parent comment ID is required')
];

const likeValidation = [
    body('contentType')
        .isIn(['blog', 'comment'])
        .withMessage('Invalid content type'),
    body('contentId')
        .isMongoId()
        .withMessage('Valid content ID is required')
];

// All routes require authentication
router.use(authMiddleware);

// Comment routes
router.get('/comments/:blogId', getBlogComments);
router.post('/comments', commentValidation, createComment);
router.put('/comments/:id', commentValidation, updateComment);
router.delete('/comments/:id', deleteComment);

// Like routes
router.post('/likes', likeValidation, toggleLike);

export default router;
