import express from 'express';
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
    // renameDirectory,
    getDirectoryTree,
    exportDirectory // Add this import
} from '../controllers/directory.controller.js';

const directoryRouter = express.Router();

directoryRouter.get('/tree', authMiddleware, getDirectoryTree);
directoryRouter.post('/', authMiddleware, createDirectory);
directoryRouter.get('/', authMiddleware, getAllDirectories);
directoryRouter.get('/:id', authMiddleware, getDirectoryById);
directoryRouter.get('/get/:id', authMiddleware, getDirectory);
directoryRouter.put('/:id', authMiddleware, updateDirectory);
directoryRouter.delete('/:id', authMiddleware, deleteDirectory);
directoryRouter.post('/:id/share', authMiddleware, shareDirectory);
directoryRouter.post('/:id/move', authMiddleware, moveDirectory);
// directoryRouter.post('/:id/rename', authMiddleware, renameDirectory);
directoryRouter.get('/:id/export', authMiddleware, exportDirectory); // Add this route

export default directoryRouter;
