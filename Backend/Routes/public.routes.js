import express from 'express';
import { 
    getPublicSnippets,
    getPublicGroups,
    getTopUsers,
    getPublicStats,
    searchPublicContent,
    getRecentActivity,
    getFeaturedContent,
    getTrendingSnippets,
    getPopularTags,
    getPublicDirectories // Added import for getPublicDirectories
} from '../controllers/public.controller.js';

const router = express.Router();

// Get public snippets with filters and pagination
router.get('/snippets', getPublicSnippets);

// Get public groups
router.get('/groups', getPublicGroups);

// Get top contributing users
router.get('/top-users', getTopUsers);

// Get platform statistics
router.get('/stats', getPublicStats);

// Search across public content
router.get('/search', searchPublicContent);

// Get recent platform activity
router.get('/recent-activity', getRecentActivity);

// Get featured content
router.get('/featured', getFeaturedContent);

// Get trending snippets
router.get('/trending-snippets', getTrendingSnippets);

// Get popular tags
router.get('/popular-tags', getPopularTags);

// Get public directories
router.get('/directories', getPublicDirectories);

export default router;
