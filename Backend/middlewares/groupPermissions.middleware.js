import Group from '../Models/group.model.js';

export const checkGroupPermission = (requiredPermission) => async (req, res, next) => {
    try {
        const { groupId } = req.body;
        if (!groupId) return next();

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        const member = group.members.find(m => m.userId.equals(req.user._id));
        if (!member) {
            return res.status(403).json({ error: "Not a group member" });
        }

        if (member.role === 'admin' || member.permissions.includes(requiredPermission)) {
            req.group = group;
            return next();
        }

        res.status(403).json({ error: "Insufficient permissions" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
