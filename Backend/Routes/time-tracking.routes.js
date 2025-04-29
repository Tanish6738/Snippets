import express from 'express';
import { authMiddleware as auth } from '../middlewares/auth.middleware.js';
import {
    getTimeEntries,
    startTimeTracking,
    stopTimeTracking,
    updateTimeEntry,
    deleteTimeEntry,
    getProjectTimeReport,
    getUserTimeReport
} from '../controllers/time-tracking.controller.js';

const router = express.Router();

// Task-specific time tracking endpoints
router.get('/tasks/:taskId/time', auth, getTimeEntries);
router.post('/tasks/:taskId/time/start', auth, startTimeTracking);
router.post('/tasks/:taskId/time/stop', auth, stopTimeTracking);
router.patch('/tasks/:taskId/time/:entryId', auth, updateTimeEntry);
router.delete('/tasks/:taskId/time/:entryId', auth, deleteTimeEntry);

// Project time reports
router.get('/projects/:projectId/time/report', auth, getProjectTimeReport);

// User time reports
router.get('/users/:userId/time/report', auth, getUserTimeReport);

export default router;