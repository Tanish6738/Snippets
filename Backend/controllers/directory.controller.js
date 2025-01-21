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
            ...req.body,
            createdBy: req.user._id
        };

        if (req.body.parentId) {
            const parent = await Directory.findById(req.body.parentId);
            if (!parent) {
                return res.status(404).json({ error: "Parent directory not found" });
            }
            directoryData.ancestors = [...parent.ancestors, parent._id];
            directoryData.path = `${parent.path}/${req.body.name}`;
        } else {
            directoryData.path = `/${req.body.name}`;
        }

        const directory = new Directory(directoryData);

        await directory.save();
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
            .populate('parentId')
            .populate('ancestors');

        if (!directory) {
            return res.status(404).json({ error: "Directory not found" });
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

        if (newParentId) {
            const newParent = await Directory.findById(newParentId);
            if (!newParent) {
                return res.status(404).json({ error: "New parent directory not found" });
            }
            directory.ancestors = [...newParent.ancestors, newParent._id];
            directory.path = `${newParent.path}/${directory.name}`;
            directory.parentId = newParent._id;
        } else {
            directory.ancestors = [];
            directory.path = `/${directory.name}`;
            directory.parentId = null;
        }

        await directory.save();
        res.json(directory);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Rename directory
// export const renameDirectory = async (req, res) => {
//     try {
//         const { newName } = req.body;
//         const directory = await Directory.findOne({
//             _id: req.params.id,
//             createdBy: req.user._id
//         });

//         if (!directory) {
//             return res.status(404).json({ error: "Directory not found" });
//         }

//         directory.name = newName;
//         directory.path = directory.ancestors.length > 0
//             ? `${directory.ancestors.map(a => a.name).join('/')}/${newName}`
//             : `/${newName}`;

//         await directory.save();
//         res.json(directory);
//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// };

// Get directory tree
export const getDirectoryTree = async (req, res) => {
    try {
        const directories = await Directory.find({
            $or: [
                { createdBy: req.user._id },
                { visibility: 'public' },
                { 'sharedWith.entity': req.user._id }
            ]
        });

        const buildTree = (parentId = null) => {
            return directories
                .filter(dir => (dir.parentId ? dir.parentId.toString() === parentId : parentId === null))
                .map(dir => ({
                    ...dir.toObject(),
                    children: buildTree(dir._id.toString())
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
