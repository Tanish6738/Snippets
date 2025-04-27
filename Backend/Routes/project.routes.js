import express from 'express';
import { authMiddleware as auth } from '../middlewares/auth.middleware.js';
import {
    createProject,
    getUserProjects,
    getProjectById,
    updateProject,
    deleteProject,
    getProjectDashboard,
    addProjectMember,
    removeProjectMember,
    updateMemberRole
} from '../controllers/project.controller.js';

const router = express.Router();

// Project CRUD routes
router.post('/', auth, createProject);
router.get('/', auth, getUserProjects);
router.get('/:id', auth, getProjectById);
router.patch('/:id', auth, updateProject);
router.delete('/:id', auth, deleteProject);

// Project dashboard route
router.get('/:id/dashboard', auth, getProjectDashboard);

// Project member management routes
router.post('/:id/members', auth, addProjectMember);
router.delete('/:id/members/:memberId', auth, removeProjectMember);
router.patch('/:id/members/:memberId', auth, updateMemberRole);

export default router;
