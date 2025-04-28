import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
    generateExplanation,
    generateCheatSheet,
    convertCode,
    generateDocumentation,
    generateBulkDocumentation,
    generateProjectTasks,
    generateTaskHealthInsights,
    generateRecurringTaskRecommendations,
    generateBulkSnippets
} from '../controllers/Ai.controller.js';

const router = express.Router();

// Code explanation routes
router.post('/explanation', authMiddleware, generateExplanation);
router.post('/cheatsheet', authMiddleware, generateCheatSheet);
router.post('/convert', authMiddleware, convertCode);

// Documentation routes
router.post('/documentation', authMiddleware, generateDocumentation);
router.post('/documentation/bulk', authMiddleware, generateBulkDocumentation);

// Snippets generation routes
router.post('/snippets/bulk', authMiddleware, generateBulkSnippets);

// Project and task management routes
router.post('/tasks/generate', authMiddleware, generateProjectTasks);

// New advanced AI task features
router.post('/tasks/health/:projectId', authMiddleware, generateTaskHealthInsights);
router.post('/tasks/recurring/:projectId', authMiddleware, generateRecurringTaskRecommendations);

export default router;