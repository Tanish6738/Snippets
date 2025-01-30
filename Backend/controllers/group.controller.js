import Group from "../Models/group.model.js";
import Activity from "../Models/activity.model.js";
import { validationResult } from "express-validator";
import mongoose from 'mongoose'; // Add this import
import Directory from "../Models/directory.model.js";  // Add this line

// Create new group
export const createGroup = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const group = new Group({
            ...req.body,
            createdBy: req.user._id,
            members: [{ userId: req.user._id, role: 'admin' }]
        });

        await group.save();
        console.log('Group created:', group); // Add logging
        res.status(201).json(group);
    } catch (error) {
        console.error('Create group error:', error); // Add logging
        res.status(400).json({ error: error.message });
    }
};

// Get all groups
export const getAllGroups = async (req, res) => {
    try {
        const { limit = 10, sort = '-createdAt', featured } = req.query;
        const query = {
            $or: [
                { 'settings.visibility': 'public' },
                { 'members.userId': req.user._id }
            ]
        };

        if (featured === 'true') {
            query.featured = true;
        }

        const groups = await Group.find(query)
            .populate('members.userId', 'username email')
            .populate({
                path: 'snippets.snippetId',
                select: 'title content programmingLanguage'
            })
            .sort(sort)
            .lean();

        const response = {
            groups: groups.map(group => ({
                ...group,
                snippetCount: group.snippets.filter(s => s.snippetId).length
            })),
            total: groups.length,
            hasMore: groups.length === parseInt(limit)
        };

        res.set('Cache-Control', 'no-cache');
        res.set('Pragma', 'no-cache');
        
        res.json(response);
    } catch (error) {
        console.error('getAllGroups error:', error);
        res.status(500).json({ 
            error: "Failed to fetch groups",
            message: error.message
        });
    }
};

// Get group by ID
export const getGroupById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate group ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid group ID format" });
        }

        // Find group and populate necessary fields
        const group = await Group.findById(id)
            .populate('members.userId', 'username email')
            .populate({
                path: 'snippets.snippetId',
                select: 'title description'
            })
            .populate({
                path: 'directories.directoryId',
                select: 'name path'
            })
            .lean();

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Check if user has access to group
        const isMember = group.members.some(member => 
            member.userId._id.toString() === req.user._id.toString()
        );

        if (!isMember && group.settings?.visibility !== 'public') {
            return res.status(403).json({ error: "Access denied" });
        }

        res.json(group);
    } catch (error) {
        console.error('getGroupById error:', error);
        res.status(500).json({ 
            error: "Failed to fetch group",
            message: error.message
        });
    }
};

// Get group
export const getGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }
        res.status(200).json(group);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update group
export const updateGroup = async (req, res) => {
    try {
        const group = await Group.findOne({
            _id: req.params.id,
            'members': { 
                $elemMatch: { 
                    userId: req.user._id, 
                    role: 'admin' 
                }
            }
        });

        if (!group) {
            return res.status(404).json({ error: "Group not found or unauthorized" });
        }

        Object.assign(group, req.body);
        await group.save();
        res.json(group);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete group
export const deleteGroup = async (req, res) => {
    try {
        const group = await Group.findOneAndDelete({
            _id: req.params.id,
            'members': { 
                $elemMatch: { 
                    userId: req.user._id, 
                    role: 'admin' 
                }
            }
        });

        if (!group) {
            return res.status(404).json({ error: "Group not found or unauthorized" });
        }

        res.json({ message: "Group deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add member to group
export const addMember = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        const { userId, role = 'member', permissions } = req.body;
        
        // Check if user is already a member
        if (group.members.some(member => member.userId.toString() === userId)) {
            return res.status(400).json({ error: "User is already a member" });
        }

        // Add member with specified role and permissions
        group.members.push({
            userId,
            role,
            permissions: permissions || [
                'create_snippet',
                'edit_snippet',
                'create_directory',
                'edit_directory'
            ]
        });

        await group.save();

        const updatedGroup = await Group.findById(group._id)
            .populate('members.userId', 'username email');

        res.json(updatedGroup);
    } catch (error) {
        console.error('Add member error:', error);
        res.status(400).json({ error: error.message });
    }
};

// Remove member from group
export const removeMember = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        await group.removeMember(req.params.userId);
        res.json(group);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Add snippet to group
export const addSnippet = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        if (!group.snippets.includes(req.body.snippetId)) {
            group.snippets.push(req.body.snippetId);
            await group.save();
        }

        res.json(group);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Remove snippet from group
export const removeSnippet = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        group.snippets = group.snippets.filter(snippetId => snippetId.toString() !== req.params.snippetId);
        await group.save();

        res.json(group);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Add directory to group
export const addDirectory = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        if (!group.directories.includes(req.body.directoryId)) {
            group.directories.push(req.body.directoryId);
            await group.save();
        }

        res.json(group);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Remove directory from group
export const removeDirectory = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        group.directories = group.directories.filter(directoryId => directoryId.toString() !== req.params.directoryId);
        await group.save();

        res.json(group);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Add this function with the other exports
export const getJoinedGroups = async (req, res) => {
    try {
        const groups = await Group.find({
            'members.userId': req.user._id
        })
        .populate('members.userId', 'username email')
        .sort('-createdAt')
        .limit(parseInt(req.query.limit) || 10)
        .lean();

        // Set cache control headers
        res.set('Cache-Control', 'no-cache');
        res.set('Pragma', 'no-cache');
        
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Chat Controllers
export const addMessage = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        const { content, attachments } = req.body;
        await group.addMessage(req.user._id, content, attachments);

        // Log activity
        await Activity.logActivity({
            userId: req.user._id,
            action: 'create',
            targetType: 'group',
            targetId: group._id,
            metadata: { messageType: 'chat' }
        });

        console.log('Message added to group chat:', content); // Add logging

        res.status(201).json(group.chat.messages[group.chat.messages.length - 1]);
    } catch (error) {
        console.error('Add message error:', error); // Add logging
        res.status(400).json({ error: error.message });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { limit = 50, before } = req.query;
        const group = await Group.findById(req.params.id)
            .populate('chat.messages.sender', 'username avatar');

        let messages = group.chat.messages;
        if (before) {
            messages = messages.filter(m => m.createdAt < new Date(before));
        }
        messages = messages.slice(-limit);

        res.json(messages);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const pinMessage = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group.canPerformAction(req.user._id, 'manage_chat')) {
            return res.status(403).json({ error: "Not authorized" });
        }

        if (!group.chat.pinnedMessages.includes(req.params.messageId)) {
            group.chat.pinnedMessages.push(req.params.messageId);
            await group.save();
        }

        res.json(group.chat.pinnedMessages);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Enhanced Member Management
export const updateMemberPermissions = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group.canPerformAction(req.user._id, 'manage_roles')) {
            return res.status(403).json({ error: "Not authorized" });
        }

        await group.updateMemberPermissions(req.params.userId, req.body.permissions);
        res.json(group.members.find(m => m.userId.equals(req.params.userId)));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Content Management
export const getGroupContent = async (req, res) => {
    try {
        const { id } = req.params;
        const group = await Group.findById(id);

        if (!group || !group.rootDirectory) {
            return res.status(404).json({ error: "Group or root directory not found" });
        }

        const directoryTree = await Directory.aggregate([
            { $match: { _id: group.rootDirectory } },
            {
                $graphLookup: {
                    from: "directories",
                    startWith: "$_id",
                    connectFromField: "_id",
                    connectToField: "parentId",
                    as: "descendants",
                    depthField: "level"
                }
            },
            {
                $addFields: {
                    allDirIds: {
                        $concatArrays: [ ["$_id"], "$descendants._id" ]
                    }
                }
            },
            {
                $lookup: {
                    from: "snippets",
                    localField: "allDirIds",
                    foreignField: "directory.current",
                    as: "allSnippets"
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    path: 1,
                    level: 1,
                    descendants: {
                        $map: {
                            input: "$descendants",
                            as: "dir",
                            in: {
                                _id: "$$dir._id",
                                name: "$$dir.name",
                                path: "$$dir.path",
                                level: "$$dir.level",
                                parentId: "$$dir.parentId",
                                snippets: {
                                    $filter: {
                                        input: "$allSnippets",
                                        as: "snip",
                                        cond: { $eq: ["$$snip.directory.current", "$$dir._id"] }
                                    }
                                }
                            }
                        }
                    },
                    snippets: {
                        $filter: {
                            input: "$allSnippets",
                            as: "snip",
                            cond: { $eq: ["$$snip.directory.current", "$_id"] }
                        }
                    }
                }
            }
        ]);

        res.json(directoryTree[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const searchGroupContent = async (req, res) => {
    try {
        const { query } = req.query;
        const group = await Group.findById(req.params.id);
        
        const snippets = await mongoose.model('Snippet').find({
            _id: { $in: group.snippets.map(s => s.snippetId) },
            $text: { $search: query }
        });

        const directories = await mongoose.model('Directory').find({
            _id: { $in: group.directories.map(d => d.directoryId) },
            $text: { $search: query }
        });

        res.json({ snippets, directories });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getGroupStats = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        const stats = {
            memberCount: group.members.length,
            snippetCount: group.snippets.length,
            directoryCount: group.directories.length,
            messageCount: group.chat.messages.length
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add these new controller functions

export const getGroupSnippets = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate({
                path: 'snippets.snippetId',
                select: 'title content programmingLanguage description createdAt updatedAt tags visibility createdBy',
                populate: {
                    path: 'createdBy',
                    select: 'username email'
                }
            });

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Check access permissions
        const isMember = group.members.some(member => 
            member.userId.toString() === req.user._id.toString()
        );

        if (!isMember && group.settings?.visibility !== 'public') {
            return res.status(403).json({ error: "Access denied" });
        }

        // Map snippets and filter out any null references
        const snippets = group.snippets
            .filter(item => item.snippetId)
            .map(item => ({
                ...item.snippetId.toObject(),
                addedAt: item.addedAt,
                addedBy: item.addedBy
            }));

        console.log(`Found ${snippets.length} snippets for group ${group._id}`);
        res.json(snippets);

    } catch (error) {
        console.error('getGroupSnippets error:', error);
        res.status(500).json({ 
            error: "Failed to fetch group snippets",
            message: error.message
        });
    }
};

export const getGroupDirectories = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate('directories.directoryId')
            .populate('rootDirectory');
        
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Check access permissions
        const isMember = group.members.some(member => 
            member.userId.toString() === req.user._id.toString()
        );

        if (!isMember && group.settings?.visibility !== 'public') {
            return res.status(403).json({ error: "Access denied" });
        }

        // Get all directories associated with the group
        const directories = await Directory.find({
            groupId: group._id
        }).sort('path');

        // If no directories exist but group has a rootDirectory, something went wrong
        if (directories.length === 0 && group.rootDirectory) {
            const rootDir = await Directory.findById(group.rootDirectory);
            if (rootDir) {
                return res.json([rootDir]);
            }
        }

        // Return found directories
        res.json(directories);

    } catch (error) {
        console.error('getGroupDirectories error:', error);
        res.status(500).json({ 
            error: "Failed to fetch group directories",
            message: error.message 
        });
    }
};
