import express from 'express';
import { generateExplanation, generateCheatSheet, convertCode } from '../controllers/Ai.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Generate explanation for code snippets
router.post('/explain', authMiddleware, generateExplanation);

// Generate cheat sheet from snippets
router.post('/generate-cheatsheet', authMiddleware, generateCheatSheet);

// Convert code between programming languages
router.post('/convert-code', authMiddleware, convertCode);

export default router;