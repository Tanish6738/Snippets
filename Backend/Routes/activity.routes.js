import express from 'express';
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { logActivity, getActivitiesByUser, getActivitiesByTarget, getActivitiesByAction, getActivity, updateActivity, deleteActivity } from '../controllers/activity.controller.js';

const activityRouter = express.Router();

activityRouter.post('/', authMiddleware, logActivity);
activityRouter.get('/user', authMiddleware, getActivitiesByUser);
activityRouter.get('/target/:targetId', authMiddleware, getActivitiesByTarget);
activityRouter.get('/action/:action', authMiddleware, getActivitiesByAction);
activityRouter.get('/:id', authMiddleware, getActivity);
activityRouter.put('/:id', authMiddleware, updateActivity);
activityRouter.delete('/:id', authMiddleware, deleteActivity);

export default activityRouter;
