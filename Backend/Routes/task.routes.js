import express from 'express';
import {
    createTask,
    getTasksByProject,
    getTaskById,
    updateTask,
    deleteTask,
    createSubtask,
    assignTask,
    addComment,
    generateTasksWithAI,
    saveGeneratedTasks,
    addTaskDependency,
    removeTaskDependency,
    createRecurringTask,
    generateRecurringInstances,
    cloneTask,
    calculateTaskHealth,
    calculateProjectTasksHealth
} from '../controllers/task.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Project tasks
router.post('/projects/:projectId/tasks', authMiddleware, createTask);
router.get('/projects/:projectId/tasks', authMiddleware, getTasksByProject);

// Single task
router.get('/tasks/:taskId', authMiddleware, getTaskById);
router.put('/tasks/:taskId', authMiddleware, updateTask);
router.patch('/tasks/:taskId', authMiddleware, updateTask);
router.delete('/tasks/:taskId', authMiddleware, deleteTask);

// Subtasks
router.post('/tasks/:taskId/subtasks', authMiddleware, createSubtask);

// Assignment
router.post('/tasks/:taskId/assign', authMiddleware, assignTask);

// Comments
router.post('/tasks/:taskId/comments', authMiddleware, addComment);

// Dependencies
router.post('/tasks/:taskId/dependencies/:dependencyId', authMiddleware, addTaskDependency);
router.delete('/tasks/:taskId/dependencies/:dependencyId', authMiddleware, removeTaskDependency);

// Recurring tasks
router.post('/projects/:projectId/recurring-tasks', authMiddleware, createRecurringTask);
router.post('/recurring-tasks/generate', authMiddleware, generateRecurringInstances);

// Cloning
router.post('/tasks/:taskId/clone', authMiddleware, cloneTask);

// Health
router.get('/tasks/:taskId/health', authMiddleware, calculateTaskHealth);
router.get('/projects/:projectId/tasks-health', authMiddleware, calculateProjectTasksHealth);

// AI task generation
router.post('/projects/:projectId/generate-tasks', authMiddleware, generateTasksWithAI);
router.post('/projects/:projectId/save-generated-tasks', authMiddleware, saveGeneratedTasks);

export default router;
