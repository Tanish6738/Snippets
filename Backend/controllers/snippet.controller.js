import Snippet from "../Models/snippet.model.js";
import Directory from "../Models/directory.model.js";
import User from "../Models/user.model.js";
import { validationResult } from "express-validator";

// Create new snippet
export const createSnippet = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, content, programmingLanguage, directoryId } = req.body;
        
        if (!title || !content || !programmingLanguage) {
            return res.status(400).json({
                errors: [{ msg: 'Title, content, and programming language are required' }]
            });
        }

        let directory = null;
        if (directoryId) {
            directory = await Directory.findById(directoryId);
            if (!directory || !directory.isAccessibleBy(req.user._id)) {
                return res.status(404).json({ error: "Directory not found or not accessible" });
            }
        }

        const snippetData = {
            title: title.trim(),
            content: content.trim(),
            programmingLanguage: programmingLanguage.trim(),
            tags: (req.body.tags || []).filter(Boolean).map(tag => tag.trim()),
            visibility: req.body.visibility || req.user.preferences.defaultSnippetVisibility,
            description: req.body.description?.trim() || '',
            createdBy: req.user._id,
            directory: directory ? {
                current: directory._id,
                path: [...directory.ancestors, directory._id]
            } : null,
            versionHistory: [{
                version: 1,
                content: content.trim(),
                updatedBy: req.user._id
            }]
        };

        const snippet = new Snippet(snippetData);
        await snippet.save();

        if (directory) {
            await directory.addSnippet(snippet);
        }

        // If groupId is provided, add snippet to group
        if (req.body.groupId) {
            await addSnippetToGroup(snippet._id, req.body.groupId, req.user._id);
        }

        const populatedSnippet = await Snippet.findById(snippet._id)
            .populate('createdBy', 'username email')
            .populate('directory.current')
            .populate('directory.path');

        res.status(201).json(populatedSnippet);
    } catch (error) {
        res.status(400).json({ 
            error: "Snippet creation failed",
            message: error.message 
        });
    }
};

// Update snippet
export const updateSnippet = async (req, res) => {
    try {
        const snippet = await Snippet.findOne({
            _id: req.params.id,
            $or: [
                { createdBy: req.user._id },
                { 'sharedWith.entity': req.user._id, 'sharedWith.role': { $in: ['editor', 'owner'] } }
            ]
        });

        if (!snippet) {
            return res.status(404).json({ error: "Snippet not found or not authorized" });
        }

        // Handle directory change
        if (req.body.directoryId && req.body.directoryId !== snippet.directory?.current) {
            await snippet.moveToDirectory(req.body.directoryId);
        }

        // Version history is handled by pre-save middleware

        const allowedUpdates = [
            'title', 'content', 'tags', 'visibility', 'description',
            'programmingLanguage', 'commentsEnabled', 'shareLink'
        ];

        const updates = Object.keys(req.body)
            .filter(key => allowedUpdates.includes(key))
            .reduce((obj, key) => {
                obj[key] = req.body[key];
                return obj;
            }, {});

        Object.assign(snippet, updates);
        await snippet.save();

        const populatedSnippet = await Snippet.findById(snippet._id)
            .populate('createdBy', 'username email')
            .populate('directory.current')
            .populate('directory.path')
            .populate('sharedWith.entity');

        res.json(populatedSnippet);
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

        // Safer access permission check
        const creatorId = snippet.createdBy?._id || snippet.createdBy;
        if (snippet.visibility === 'private' && 
            creatorId.toString() !== req.user._id.toString() &&
            !snippet.sharedWith.some(share => 
                share.entity._id.toString() === req.user._id.toString()
            )) {
            return res.status(403).json({ error: "Access denied" });
        }

        // Increment views
        snippet.stats.views = (snippet.stats.views || 0) + 1;
        await snippet.save();

        res.json(snippet);
    } catch (error) {
        console.error('Snippet fetch error:', error);
        res.status(500).json({ 
            error: "Failed to fetch snippet",
            details: error.message 
        });
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

        // Add Cache-Control headers
        res.set({
            'Cache-Control': 'no-cache, must-revalidate',
            'Expires': '0',
            'ETag': false
        });

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

        if (!snippet.canEdit(req.user._id)) {
            return res.status(403).json({ error: "Not authorized to share this snippet" });
        }

        let entity;
        if (entityType === 'User') {
            entity = await User.findById(entityId);
        } else if (entityType === 'Group') {
            entity = await Group.findById(entityId);
        }

        if (!entity) {
            return res.status(404).json({ error: `${entityType} not found` });
        }

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
                role,
                sharedAt: new Date()
            });
        }

        await snippet.save();

        const populatedSnippet = await Snippet.findById(snippet._id)
            .populate('createdBy', 'username email')
            .populate('sharedWith.entity');

        res.json(populatedSnippet);
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
        const { format, includeMetadata, includeTags } = req.query;
        const snippet = await Snippet.findById(req.params.id)
            .populate('createdBy', 'username email');
        
        if (!snippet) {
            return res.status(404).json({ error: "Snippet not found" });
        }

        // Check access permissions
        if (snippet.visibility === 'private' && 
            snippet.createdBy._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Access denied" });
        }

        let exportContent = '';
        const metadata = {
            title: snippet.title,
            author: snippet.createdBy.username,
            created: snippet.createdAt,
            language: snippet.programmingLanguage,
            tags: snippet.tags
        };

        switch (format) {
            case 'txt':
                exportContent = formatAsTxt(snippet, metadata, includeMetadata === 'true', includeTags === 'true');
                res.setHeader('Content-Type', 'text/plain');
                break;
            case 'json':
                exportContent = formatAsJson(snippet, metadata, includeMetadata === 'true', includeTags === 'true');
                res.setHeader('Content-Type', 'application/json');
                break;
            case 'md':
                exportContent = formatAsMarkdown(snippet, metadata, includeMetadata === 'true', includeTags === 'true');
                res.setHeader('Content-Type', 'text/markdown');
                break;
            default:
                return res.status(400).json({ error: "Unsupported format" });
        }

        // Increment export counter
        snippet.stats.copies += 1;
        await snippet.save();

        res.setHeader('Content-Disposition', `attachment; filename=${snippet.title}.${format}`);
        return res.send(exportContent);

    } catch (error) {
        console.error('Export error:', error);
        return res.status(500).json({ error: "Failed to export snippet" });
    }
};

// Helper functions for formatting
const formatAsTxt = (snippet, metadata, includeMetadata, includeTags) => {
    let content = '';
    
    if (includeMetadata) {
        content += `Title: ${metadata.title}\n`;
        content += `Author: ${metadata.author}\n`;
        content += `Created: ${metadata.created}\n`;
        content += `Language: ${metadata.language}\n`;
        if (includeTags && metadata.tags.length > 0) {
            content += `Tags: ${metadata.tags.join(', ')}\n`;
        }
        content += '\n---\n\n';
    }
    
    content += snippet.content;
    return content;
};

const formatAsJson = (snippet, metadata, includeMetadata, includeTags) => {
    const exportData = {
        content: snippet.content
    };

    if (includeMetadata) {
        exportData.metadata = {
            ...metadata,
            tags: includeTags ? metadata.tags : undefined
        };
    }

    return JSON.stringify(exportData, null, 2);
};

const formatAsMarkdown = (snippet, metadata, includeMetadata, includeTags) => {
    let content = '';
    
    if (includeMetadata) {
        content += `# ${metadata.title}\n\n`;
        content += `- **Author:** ${metadata.author}\n`;
        content += `- **Created:** ${metadata.created}\n`;
        content += `- **Language:** ${metadata.language}\n`;
        if (includeTags && metadata.tags.length > 0) {
            content += `- **Tags:** ${metadata.tags.join(', ')}\n`;
        }
        content += '\n---\n\n';
    }
    
    content += '```' + metadata.language.toLowerCase() + '\n';
    content += snippet.content + '\n';
    content += '```\n';
    return content;
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
            $or: [
                { createdBy: req.user._id },
                { 'sharedWith.entity': req.user._id, 'sharedWith.role': { $in: ['editor', 'owner'] } }
            ]
        });

        if (!snippet) {
            return res.status(404).json({ error: "Snippet not found or not authorized" });
        }

        const version = snippet.versionHistory.find(v => v.version === parseInt(req.params.version));
        if (!version) {
            return res.status(404).json({ error: "Version not found" });
        }

        // Current version is automatically saved by pre-save middleware
        snippet.content = version.content;
        await snippet.save();

        const populatedSnippet = await Snippet.findById(snippet._id)
            .populate('createdBy', 'username email')
            .populate('versionHistory.updatedBy');

        res.json(populatedSnippet);
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

// Generate share link
export const generateShareLink = async (req, res) => {
    try {
        const snippet = await Snippet.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!snippet) {
            return res.status(404).json({ error: "Snippet not found" });
        }

        // Update share settings
        snippet.shareLink = {
            isEnabled: true,
            settings: {
                visibility: req.body.visibility || 'private',
                allowComments: req.body.allowComments || false,
                requireLogin: req.body.requireLogin || false
            }
        };

        await snippet.save();

        // Return the snippet ID which will be used to construct the share URL
        res.json({
            success: true,
            snippetId: snippet._id
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get user snippets
export const getUserSnippets = async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
        
        const query = {
            createdBy: req.user._id
        };

        const snippets = await Snippet.find(query)
            .populate('createdBy', 'username email')
            .populate('directory.current')
            .sort(sort)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Snippet.countDocuments(query);

        res.json({
            snippets,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ 
            error: "Failed to fetch user snippets",
            message: error.message 
        });
    }
};

const addSnippetToGroup = async (snippetId, groupId, userId) => {
    const group = await Group.findById(groupId);
    if (!group) {
        throw new Error("Group not found");
    }

    if (!group.snippets.some(s => s.snippetId.equals(snippetId))) {
        group.snippets.push({
            snippetId,
            addedBy: userId,
            addedAt: new Date()
        });
        await group.save();
        console.log(`Added snippet ${snippetId} to group ${groupId}`);
    }
    return group;
};
