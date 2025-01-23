import express from 'express';
import { body, query } from "express-validator";
import { authMiddleware } from "../middlewares/auth.middleware.js";

import {
    createDirectory,
    getAllDirectories,
    getDirectoryById,
    updateDirectory,
    deleteDirectory,
    shareDirectory,
    getDirectory,
    moveDirectory,
    getDirectoryTree,
    exportDirectory,
    getUserDirectories
} from '../controllers/directory.controller.js';

const directoryRouter = express.Router();

// Apply auth middleware to all routes
directoryRouter.use(authMiddleware);

// Directory tree
directoryRouter.get('/tree', getDirectoryTree);

// Create directory with validation
directoryRouter.post('/', [
    body('name').trim().notEmpty().withMessage('Directory name is required'),
    body('visibility').isIn(['public', 'private', 'shared']).optional(),
    body('parentId').optional()
], createDirectory);

// Get all directories with optional query params
directoryRouter.get('/', getAllDirectories);

// Get all directories created by the current user
directoryRouter.get("/user/directories", [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sort').optional().isString()
], getUserDirectories);

// Single directory routes
directoryRouter.get('/:id', getDirectoryById);
directoryRouter.get('/get/:id', getDirectory);
directoryRouter.put('/:id', updateDirectory);
directoryRouter.delete('/:id', deleteDirectory);

// Share directory
directoryRouter.post('/:id/share', [
    body('entityId').exists(),
    body('entityType').isIn(['User', 'Group']),
    body('role').isIn(['viewer', 'editor', 'owner'])
], shareDirectory);

// Move directory
directoryRouter.post('/:id/move', [
    body('newParentId').exists()
], moveDirectory);

// Export directory
directoryRouter.get('/:id/export', exportDirectory);

export default directoryRouter;
