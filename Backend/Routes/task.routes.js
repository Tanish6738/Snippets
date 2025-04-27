import express from 'express';
import { authMiddleware as auth } from '../middlewares/auth.middleware.js';
import {
    createTask,
    getTasksByProject,
    getTaskById,
    updateTask,
    deleteTask,
    assignTask,
    addComment,
    generateTasksWithAI
} from '../controllers/task.controller.js';

const router = express.Router();

// Task CRUD routes
router.post('/projects/:projectId', auth, createTask);
router.get('/projects/:projectId', auth, getTasksByProject);
router.get('/:taskId', auth, getTaskById);
router.patch('/:taskId', auth, updateTask);
router.delete('/:taskId', auth, deleteTask);

// Task assignment
router.post('/:taskId/assign', auth, assignTask);

// Task comments
router.post('/:taskId/comments', auth, addComment);

// AI task generation
router.post('/ai/generate/:projectId', auth, generateTasksWithAI);

export default router;
