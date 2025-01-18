import express from 'express';
import { authMiddleware } from "../middlewares/auth.middleware.js";

import {
    createGroup,
    getAllGroups,
    getGroupById,
    updateGroup,
    deleteGroup,
    addMember,
    removeMember,
    getGroup,
    addSnippet,
    removeSnippet,
    addDirectory,
    removeDirectory
} from '../controllers/group.controller.js';

const groupRouter = express.Router();

// Base group routes
groupRouter.post('/', authMiddleware, createGroup);
groupRouter.get('/', authMiddleware, getAllGroups);
groupRouter.get('/:id', authMiddleware, getGroupById);
groupRouter.get('/get/:id', authMiddleware, getGroup);
groupRouter.put('/:id', authMiddleware, updateGroup);
groupRouter.delete('/:id', authMiddleware, deleteGroup);

// Member management routes
groupRouter.post('/:id/members', authMiddleware, addMember);
groupRouter.delete('/:id/members/:userId', authMiddleware, removeMember);

// Snippet management routes
groupRouter.post('/:id/snippets', authMiddleware, addSnippet);
groupRouter.delete('/:id/snippets/:snippetId', authMiddleware, removeSnippet);

// Directory management routes
groupRouter.post('/:id/directories', authMiddleware, addDirectory);
groupRouter.delete('/:id/directories/:directoryId', authMiddleware, removeDirectory);

export default groupRouter;
