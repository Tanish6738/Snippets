import Group from "../Models/group.model.js";
import { validationResult } from "express-validator";

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
        res.status(201).json(group);
    } catch (error) {
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
            .sort(sort)
            .lean();

        const response = {
            groups: groups,
            total: groups.length,
            hasMore: groups.length === parseInt(limit)
        };

        // Set cache control headers
        res.set('Cache-Control', 'no-cache');
        res.set('Pragma', 'no-cache');
        
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get group by ID
export const getGroupById = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate('members.userId', 'username email')
            .populate('snippets')
            .populate('directories');

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        res.json(group);
    } catch (error) {
        res.status(500).json({ error: error.message });
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

        if (!group.isMemberAllowed(req.user._id, 'admin')) {
            return res.status(403).json({ error: "Not authorized to add members" });
        }

        const { userId, role = 'member' } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        await group.addMember(userId, role);
        
        await User.findByIdAndUpdate(userId, {
            $push: {
                groups: {
                    groupId: group._id,
                    role
                }
            }
        });

        await Activity.logActivity({
            userId: req.user._id,
            action: 'create',
            targetType: 'group',
            targetId: group._id,
            metadata: {
                action: 'add_member',
                memberRole: role
            },
            relatedUsers: [userId]
        });

        res.json(group);
    } catch (error) {
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
