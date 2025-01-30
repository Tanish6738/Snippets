import Snippet from '../Models/snippet.model.js';
import Group from '../Models/group.model.js';
import User from '../Models/user.model.js';
import Activity from '../Models/activity.model.js';
import Directory from '../models/directory.model.js';

// Get public snippets with filtering and pagination
export const getPublicSnippets = async (req, res) => {
    try {
        const { page = 1, limit = 10, language, sort = 'newest' } = req.query;
        const query = { visibility: 'public' };

        if (language) {
            query.programmingLanguage = language;
        }

        const sortOptions = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            popular: { 'stats.views': -1 },
            favorites: { 'stats.favorites': -1 }
        };

        const snippets = await Snippet.find(query)
            .sort(sortOptions[sort])
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('createdBy', 'username avatar')
            .lean();

        const count = await Snippet.countDocuments(query);

        res.json({
            snippets,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalSnippets: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get public groups
export const getPublicGroups = async (req, res) => {
    try {
        const groups = await Group.aggregate([
            { $match: { 'settings.visibility': 'public' } },
            { $lookup: {
                from: 'users',
                localField: 'members.userId',
                foreignField: '_id',
                as: 'memberDetails'
            }},
            { $project: {
                name: 1,
                description: 1,
                memberCount: { $size: '$members' },
                snippetCount: { $size: '$snippets' },
                featured: 1,
                createdAt: 1
            }}
        ]);

        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get top contributing users
export const getTopUsers = async (req, res) => {
    try {
        const users = await User.aggregate([
            { $lookup: {
                from: 'snippets',
                localField: '_id',
                foreignField: 'createdBy',
                as: 'snippets'
            }},
            { $project: {
                username: 1,
                avatar: 1,
                snippetCount: { $size: '$snippets' },
                contributionScore: {
                    $add: [
                        { $size: '$snippets' },
                        { $size: '$blogActivity.posts' },
                        { $multiply: [{ $size: '$blogActivity.comments' }, 0.5] }
                    ]
                }
            }},
            { $sort: { contributionScore: -1 } },
            { $limit: 10 }
        ]);

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get platform statistics
export const getPublicStats = async (req, res) => {
    try {
        const [snippetCount, userCount, groupCount, activityCount] = await Promise.all([
            Snippet.countDocuments({ visibility: 'public' }),
            User.countDocuments(),
            Group.countDocuments({ 'settings.visibility': 'public' }),
            Activity.countDocuments()
        ]);

        res.json({
            snippetCount,
            userCount,
            groupCount,
            activityCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search public content
export const searchPublicContent = async (req, res) => {
    try {
        const { query, type = 'all' } = req.query;
        let results = {};

        if (type === 'all' || type === 'snippets') {
            results.snippets = await Snippet.find(
                { 
                    $and: [
                        { visibility: 'public' },
                        { $text: { $search: query } }
                    ]
                },
                { score: { $meta: 'textScore' } }
            )
            .sort({ score: { $meta: 'textScore' } })
            .limit(10)
            .populate('createdBy', 'username avatar');
        }

        if (type === 'all' || type === 'groups') {
            results.groups = await Group.find(
                { 
                    'settings.visibility': 'public',
                    $text: { $search: query }
                }
            ).limit(10);
        }

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get recent activity
export const getRecentActivity = async (req, res) => {
    try {
        const activities = await Activity.find({
            targetType: { $in: ['snippet', 'group'] },
            action: { $in: ['create', 'comment', 'share'] }
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('userId', 'username avatar')
        .populate('targetId');

        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get featured content
export const getFeaturedContent = async (req, res) => {
    try {
        const [featuredGroups, featuredSnippets] = await Promise.all([
            Group.find({ featured: true, 'settings.visibility': 'public' })
                .limit(5)
                .populate('createdBy', 'username avatar'),
            Snippet.find({ 
                visibility: 'public',
                'stats.favorites': { $gte: 5 }
            })
            .sort({ 'stats.favorites': -1 })
            .limit(5)
            .populate('createdBy', 'username avatar')
        ]);

        res.json({ featuredGroups, featuredSnippets });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get trending snippets
export const getTrendingSnippets = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const trendingSnippets = await Snippet.aggregate([
            {
                $match: {
                    visibility: 'public',
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $addFields: {
                    score: {
                        $add: [
                            '$stats.views',
                            { $multiply: ['$stats.favorites', 2] },
                            { $multiply: ['$stats.copies', 3] }
                        ]
                    }
                }
            },
            { $sort: { score: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'creator'
                }
            },
            { $unwind: '$creator' }
        ]);

        res.json(trendingSnippets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get popular tags
export const getPopularTags = async (req, res) => {
    try {
        const tags = await Snippet.aggregate([
            { $match: { visibility: 'public' } },
            { $unwind: '$tags' },
            {
                $group: {
                    _id: '$tags',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 20 }
        ]);

        res.json(tags);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get public directories
export const getPublicDirectories = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    const query = { 
      visibility: { $in: ['public', 'group'] }
    };

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      popular: { 'metadata.snippetCount': -1 }
    };

    const directories = await Directory.find(query)
      .populate('createdBy', 'username')
      .populate('sharedWith.entity')
      .sort(sortOptions[sort])
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Directory.countDocuments(query);

    res.json({
      directories,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
