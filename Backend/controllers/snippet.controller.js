import Snippet from "../Models/snippet.model.js";
import { validationResult } from "express-validator";

// Create new snippet
export const createSnippet = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const snippetData = {
            ...req.body,
            programmingLanguage: req.body.language || req.body.programmingLanguage,
            createdBy: req.user._id
        };
        delete snippetData.language;

        const snippet = new Snippet(snippetData);
        await snippet.save();

        await Activity.logActivity({
            userId: req.user._id,
            action: 'create',
            targetType: 'snippet',
            targetId: snippet._id,
            metadata: { 
                visibility: snippet.visibility,
                programmingLanguage: snippet.programmingLanguage
            }
        });

        res.status(201).json(snippet);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update snippet
export const updateSnippet = async (req, res) => {
    try {
        const snippet = await Snippet.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!snippet) {
            return res.status(404).json({ error: "Snippet not found" });
        }

        // Create version history entry
        if (req.body.content && req.body.content !== snippet.content) {
            snippet.versionHistory.push({
                version: snippet.versionHistory.length + 1,
                content: snippet.content,
                updatedBy: req.user._id
            });
        }

        Object.assign(snippet, req.body);
        await snippet.save();
        res.json(snippet);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete snippet
export const deleteSnippet = async (req, res) => {
    try {
        const snippet = await Snippet.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!snippet) {
            return res.status(404).json({ error: "Snippet not found" });
        }

        res.json({ message: "Snippet deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get snippet by ID
export const getSnippetById = async (req, res) => {
    try {
        const snippet = await Snippet.findById(req.params.id)
            .populate('createdBy', 'username email')
            .populate('sharedWith.entity');

        if (!snippet) {
            return res.status(404).json({ error: "Snippet not found" });
        }

        // Check access permissions
        if (snippet.visibility === 'private' && 
            snippet.createdBy._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Access denied" });
        }

        // Increment views
        snippet.stats.views += 1;
        await snippet.save();

        res.json(snippet);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all snippets (with filters)
export const getAllSnippets = async (req, res) => {
    try {
        const { page = 1, limit = 10, tags, language, visibility } = req.query;
        const query = {
            $or: [
                { visibility: 'public' },  // Show all public snippets
                { createdBy: req.user._id }, // Show user's own snippets
                { 'sharedWith.entity': req.user._id } // Show snippets shared with user
            ]
        };

        // Only apply these filters if they're provided in query params
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            query.tags = { $in: tagArray };
        }
        if (language) {
            query.language = language.toLowerCase();
        }
        if (visibility) {
            query.visibility = visibility;
        }

        const snippets = await Snippet.find(query)
            .populate('createdBy', 'username email')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Snippet.countDocuments(query);

        res.json({
            snippets,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Share snippet
export const shareSnippet = async (req, res) => {
    try {
        const snippet = await Snippet.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!snippet) {
            return res.status(404).json({ error: "Snippet not found" });
        }

        const { entityId, entityType, role } = req.body;

        // Check if already shared
        const existingShare = snippet.sharedWith.find(
            share => share.entity.toString() === entityId && 
            share.entityType === entityType
        );

        if (existingShare) {
            existingShare.role = role;
        } else {
            snippet.sharedWith.push({
                entity: entityId,
                entityType,
                role
            });
        }

        await snippet.save();
        res.json(snippet);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Search snippets
export const searchSnippets = async (req, res) => {
    try {
        const { q, page = 1, limit = 10 } = req.query;
        const query = {
            $text: { $search: q },
            $or: [
                { createdBy: req.user._id },
                { visibility: 'public' },
                { 'sharedWith.entity': req.user._id }
            ]
        };

        const snippets = await Snippet.find(query)
            .populate('createdBy', 'username email')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ score: { $meta: "textScore" } });

        res.json(snippets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Export snippet
export const exportSnippet = async (req, res) => {
    try {
        const snippet = await Snippet.findById(req.params.id);
        
        if (!snippet) {
            return res.status(404).json({ error: "Snippet not found" });
        }

        // Check access permissions
        if (snippet.visibility === 'private' && 
            snippet.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Access denied" });
        }

        // Increment export counter
        snippet.stats.copies += 1;
        await snippet.save();

        res.json({
            content: snippet.content,
            filename: `${snippet.title}.${snippet.language.toLowerCase()}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Toggle comments
export const toggleComments = async (req, res) => {
    try {
        const snippet = await Snippet.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!snippet) {
            return res.status(404).json({ error: "Snippet not found" });
        }

        snippet.commentsEnabled = req.body.enabled;
        await snippet.save();
        
        res.json(snippet);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Restore snippet version
export const restoreVersion = async (req, res) => {
    try {
        const snippet = await Snippet.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!snippet) {
            return res.status(404).json({ error: "Snippet not found" });
        }

        const version = snippet.versionHistory.find(v => v.version === parseInt(req.params.version));
        if (!version) {
            return res.status(404).json({ error: "Version not found" });
        }

        // Save current content as a new version
        snippet.versionHistory.push({
            version: snippet.versionHistory.length + 1,
            content: snippet.content,
            updatedBy: req.user._id,
            description: "Auto-saved before version restore"
        });

        // Restore the old version
        snippet.content = version.content;
        await snippet.save();

        res.json(snippet);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Bulk create snippets
export const bulkCreateSnippets = async (req, res) => {
    try {
        const snippets = req.body.snippets.map(snippet => ({
            ...snippet,
            createdBy: req.user._id,
            visibility: snippet.visibility || req.user.preferences.defaultSnippetVisibility
        }));

        const created = await Snippet.insertMany(snippets);
        res.status(201).json(created);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get snippet statistics
export const getSnippetStats = async (req, res) => {
    try {
        const snippet = await Snippet.findById(req.params.id);
        
        if (!snippet) {
            return res.status(404).json({ error: "Snippet not found" });
        }

        if (!snippet.isAccessibleBy(req.user._id)) {
            return res.status(403).json({ error: "Access denied" });
        }

        const stats = {
            ...snippet.stats,
            versions: snippet.versionHistory.length,
            sharedWith: snippet.sharedWith.length,
            lastModified: snippet.updatedAt
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getSnippet = async (req, res) => {
    try {
        const snippet = await Snippet.findById(req.params.id);
        if (!snippet) {
            return res.status(404).json({ error: "Snippet not found" });
        }
        res.status(200).json(snippet);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
