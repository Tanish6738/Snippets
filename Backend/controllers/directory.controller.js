import Directory from "../Models/directory.model.js";
import { validationResult } from "express-validator";

// Create new directory
export const createDirectory = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const directoryData = {
            name: req.body.name,
            visibility: req.body.visibility || 'private',
            createdBy: req.user._id
        };

        if (req.body.parentId) {
            const parent = await Directory.findById(req.body.parentId);
            if (!parent || !parent.isAccessibleBy(req.user._id)) {
                return res.status(404).json({ error: "Parent directory not found or not accessible" });
            }
            directoryData.parentId = parent._id;
            directoryData.ancestors = [...parent.ancestors, parent._id];
            directoryData.path = `${parent.path}/${req.body.name}`;
            directoryData.level = parent.level + 1;
        } else {
            directoryData.path = `/${req.body.name}`;
            directoryData.level = 0;
        }

        const directory = new Directory(directoryData);
        await directory.save();

        if (req.body.parentId) {
            const parent = await Directory.findById(req.body.parentId);
            await parent.addChild(directory);
            await parent.updateMetadataRecursive();
        }

        res.status(201).json(directory);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all directories
export const getAllDirectories = async (req, res) => {
    try {
        const { featured, limit = 10 } = req.query;
        const query = {
            $or: [
                { createdBy: req.user._id },
                { visibility: 'public' },
                { 'sharedWith.entity': req.user._id }
            ]
        };

        if (featured === 'true') {
            query.featured = true;
        }

        // Add Cache-Control headers
        res.set({
            'Cache-Control': 'no-cache, must-revalidate',
            'Expires': '0',
            'ETag': false
        });

        const directories = await Directory.find(query)
            .populate('parentId')
            .limit(parseInt(limit));

        // Add timestamp to force client update
        const response = {
            directories,
            timestamp: new Date().toISOString()
        };

        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get directory by ID
export const getDirectoryById = async (req, res) => {
    try {
        const directory = await Directory.findById(req.params.id)
            .populate({
                path: 'ancestors',
                select: 'name path level'
            })
            .populate('directSnippets')
            .populate('allSnippets')
            .populate({
                path: 'children',
                populate: {
                    path: 'directSnippets allSnippets'
                }
            });

        if (!directory) {
            return res.status(404).json({ error: "Directory not found" });
        }

        if (!directory.isAccessibleBy(req.user._id)) {
            return res.status(403).json({ error: "Access denied" });
        }

        await directory.updateMetadata();
        res.json(directory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get directory
export const getDirectory = async (req, res) => {
    try {
        const directory = await Directory.findById(req.params.id);
        if (!directory) {
            return res.status(404).json({ error: "Directory not found" });
        }
        res.status(200).json(directory);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update directory
export const updateDirectory = async (req, res) => {
    try {
        const directory = await Directory.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!directory) {
            return res.status(404).json({ error: "Directory not found" });
        }

        Object.assign(directory, req.body);
        await directory.save();
        res.json(directory);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete directory
export const deleteDirectory = async (req, res) => {
    try {
        const directory = await Directory.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!directory) {
            return res.status(404).json({ error: "Directory not found" });
        }

        res.json({ message: "Directory deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Share directory
export const shareDirectory = async (req, res) => {
    try {
        const directory = await Directory.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!directory) {
            return res.status(404).json({ error: "Directory not found" });
        }

        const { entityId, entityType, role } = req.body;
        
        let entity;
        if (entityType === 'User') {
            entity = await User.findById(entityId);
        } else if (entityType === 'Group') {
            entity = await Group.findById(entityId);
        }
        
        if (!entity) {
            return res.status(404).json({ error: `${entityType} not found` });
        }

        const existingShare = directory.sharedWith.find(
            share => share.entity.toString() === entityId && 
            share.entityType === entityType
        );

        if (existingShare) {
            existingShare.role = role;
        } else {
            directory.sharedWith.push({
                entity: entityId,
                entityType,
                role
            });
        }

        await directory.save();

        await Activity.logActivity({
            userId: req.user._id,
            action: 'share',
            targetType: 'directory',
            targetId: directory._id,
            metadata: {
                sharedWith: [{
                    entity: entityId,
                    entityType,
                    role
                }]
            },
            relatedUsers: [entityType === 'User' ? entityId : null].filter(Boolean)
        });

        res.json(directory);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Move directory
export const moveDirectory = async (req, res) => {
    try {
        const { newParentId } = req.body;
        const directory = await Directory.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!directory) {
            return res.status(404).json({ error: "Directory not found" });
        }

        const oldParent = await Directory.findById(directory.parentId);
        const newParent = newParentId ? await Directory.findById(newParentId) : null;

        if (newParentId && (!newParent || !newParent.isAccessibleBy(req.user._id))) {
            return res.status(404).json({ error: "New parent directory not found or not accessible" });
        }

        // Update old parent
        if (oldParent) {
            oldParent.children = oldParent.children.filter(id => !id.equals(directory._id));
            await oldParent.save();
            await oldParent.updateMetadataRecursive();
        }

        // Update directory
        if (newParent) {
            directory.parentId = newParent._id;
            directory.ancestors = [...newParent.ancestors, newParent._id];
            directory.path = `${newParent.path}/${directory.name}`;
            directory.level = newParent.level + 1;
            
            // Update new parent
            newParent.children.push(directory._id);
            await newParent.save();
            await newParent.updateMetadataRecursive();
        } else {
            directory.parentId = null;
            directory.ancestors = [];
            directory.path = `/${directory.name}`;
            directory.level = 0;
        }

        await directory.save();
        res.json(directory);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get directory tree
export const getDirectoryTree = async (req, res) => {
    try {
        const directories = await Directory.find({
            $or: [
                { createdBy: req.user._id },
                { visibility: 'public' },
                { 'sharedWith.entity': req.user._id }
            ]
        })
        .populate('directSnippets')
        .populate('allSnippets');

        const buildTree = (parentId = null) => {
            return directories
                .filter(dir => (dir.parentId ? dir.parentId.toString() === parentId : parentId === null))
                .map(dir => ({
                    ...dir.toObject(),
                    children: buildTree(dir._id.toString()),
                    snippets: dir.directSnippets,
                    allSnippets: dir.allSnippets
                }));
        };

        const tree = buildTree();
        res.json(tree);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Export directory
export const exportDirectory = async (req, res) => {
    try {
        const { format, includeMetadata, includeSnippets, includeSubdirectories, flattenStructure } = req.query;
        const directory = await Directory.findOne({
            _id: req.params.id,
            $or: [
                { createdBy: req.user._id },
                { visibility: 'public' },
                { 'sharedWith.entity': req.user._id }
            ]
        }).populate('snippets');

        if (!directory) {
            return res.status(404).json({ error: "Directory not found" });
        }

        let exportData = {
            directory: includeMetadata ? directory : { name: directory.name, path: directory.path },
            snippets: includeSnippets ? directory.snippets : [],
            subdirectories: []
        };

        if (includeSubdirectories) {
            const subdirectories = await Directory.find({
                ancestors: directory._id
            }).populate('snippets');
            exportData.subdirectories = subdirectories;
        }

        // Set response headers
        res.setHeader('Content-Disposition', `attachment; filename=${directory.name}.${format}`);
        
        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            return res.json(exportData);
        } else if (format === 'zip') {
            // Implement ZIP file creation logic here
            // You'll need to use a library like 'archiver' to create ZIP files
            res.setHeader('Content-Type', 'application/zip');
            // Return ZIP file
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
