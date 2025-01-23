import express from 'express';
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { createGroupValidation } from '../middlewares/groupValidation.middleware.js';

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
    removeDirectory,
    getJoinedGroups, // Add this import
    addMessage,
    pinMessage,
    getMessages,
    updateMemberPermissions,
    getGroupContent,
    searchGroupContent,
    getGroupStats
} from '../controllers/group.controller.js';

const groupRouter = express.Router();

// Add this route before the /:id routes to prevent conflict
groupRouter.get('/joined', authMiddleware, getJoinedGroups);

// Base group routes
groupRouter.post('/', authMiddleware, createGroupValidation, createGroup);
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

// Chat routes
groupRouter.post('/:id/chat', authMiddleware, addMessage);
groupRouter.get('/:id/chat', authMiddleware, getMessages);
groupRouter.post('/:id/chat/pin/:messageId', authMiddleware, pinMessage);

// Enhanced member management
groupRouter.put('/:id/members/:userId/permissions', authMiddleware, updateMemberPermissions);

// Content management
groupRouter.get('/:id/content', authMiddleware, getGroupContent);
groupRouter.get('/:id/search', authMiddleware, searchGroupContent);
groupRouter.get('/:id/stats', authMiddleware, getGroupStats);

export default groupRouter;
