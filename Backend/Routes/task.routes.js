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
    generateTasksWithAI,
    saveGeneratedTasks,
    addTaskDependency,
    removeTaskDependency,
    startTimeTracking,
    stopTimeTracking,
    getTimeEntries,
    createRecurringTask,
    generateRecurringInstances,
    cloneTask,
    calculateTaskHealth,
    calculateProjectTasksHealth
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

// Task dependencies
router.post('/:taskId/dependencies/:dependencyId', auth, addTaskDependency);
router.delete('/:taskId/dependencies/:dependencyId', auth, removeTaskDependency);

// Time tracking
router.post('/:taskId/time/start', auth, startTimeTracking);
router.post('/:taskId/time/stop', auth, stopTimeTracking);
router.get('/:taskId/time', auth, getTimeEntries);

// Task health
router.post('/:taskId/health', auth, calculateTaskHealth);
router.post('/projects/:projectId/health', auth, calculateProjectTasksHealth);

// Recurring tasks
router.post('/recurring/projects/:projectId', auth, createRecurringTask);
router.post('/recurring/generate', auth, generateRecurringInstances);

// Task cloning
router.post('/:taskId/clone', auth, cloneTask);

// AI task generation
router.post('/ai/generate/:projectId', auth, generateTasksWithAI);
router.post('/ai/save/:projectId', auth, saveGeneratedTasks);

export default router;
