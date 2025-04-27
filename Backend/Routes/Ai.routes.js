import express from 'express';
import { generateExplanation, generateCheatSheet, convertCode, generateDocumentation, generateBulkDocumentation, generateProjectTasks } from '../controllers/Ai.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Generate explanation for code snippets
router.post('/explain', authMiddleware, generateExplanation);

// Generate cheat sheet from snippets
router.post('/generate-cheatsheet', authMiddleware, generateCheatSheet);

// Convert code between programming languages
router.post('/convert-code', authMiddleware, convertCode);

// Generate documentation for code snippets
router.post('/generate-documentation', authMiddleware, generateDocumentation);

// Generate documentation for multiple snippets
router.post('/generate-bulk-documentation', authMiddleware, generateBulkDocumentation);

// Generate project task breakdown from description
router.post('/generate-tasks', authMiddleware, generateProjectTasks);

export default router;