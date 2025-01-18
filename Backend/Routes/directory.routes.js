import express from 'express';
import { authMiddleware } from "../middlewares/auth.middleware.js";

import {
    createDirectory,
    getAllDirectories,
    getDirectoryById,
    updateDirectory,
    deleteDirectory,
    shareDirectory,
    getDirectory, // Import getDirectory controller
    moveDirectory, // Import moveDirectory controller
    renameDirectory, // Import renameDirectory controller
    getDirectoryTree // Import getDirectoryTree controller
} from '../controllers/directory.controller.js';

const directoryRouter = express.Router();

directoryRouter.get('/tree', authMiddleware, getDirectoryTree); // Add get directory tree route
directoryRouter.post('/', authMiddleware, createDirectory);
directoryRouter.get('/', authMiddleware, getAllDirectories);
directoryRouter.get('/:id', authMiddleware, getDirectoryById);
directoryRouter.get('/get/:id', authMiddleware, getDirectory); // Add this line
directoryRouter.put('/:id', authMiddleware, updateDirectory);
directoryRouter.delete('/:id', authMiddleware, deleteDirectory);
directoryRouter.post('/:id/share', authMiddleware, shareDirectory);
directoryRouter.post('/:id/move', authMiddleware, moveDirectory); // Add move directory route
directoryRouter.post('/:id/rename', authMiddleware, renameDirectory); // Add rename directory route

export default directoryRouter;
