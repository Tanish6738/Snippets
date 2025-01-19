import Activity from "../Models/activity.model.js";

// Log activity
export const logActivity = async (req, res) => {
    try {
        const activityData = {
            userId: req.user._id,
            action: req.body.action,
            targetType: req.body.targetType,
            targetId: req.body.targetId,
            metadata: req.body.metadata,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            relatedUsers: req.body.relatedUsers || []
        };

        const activity = await Activity.logActivity(activityData);
        res.status(201).json(activity);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get activities by user
export const getActivitiesByUser = async (req, res) => {
    try {
        // Add Cache-Control headers
        res.set({
            'Cache-Control': 'no-cache, must-revalidate',
            'Expires': '0',
            'ETag': false
        });

        const activities = await Activity.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(10);

        // Add timestamp to force client update
        const response = {
            activities,
            timestamp: new Date().toISOString()
        };

        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get activities by target
export const getActivitiesByTarget = async (req, res) => {
    try {
        const activities = await Activity.find({ targetId: req.params.targetId }).sort({ createdAt: -1 });
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get activities by action type
export const getActivitiesByAction = async (req, res) => {
    try {
        const activities = await Activity.find({ action: req.params.action }).sort({ createdAt: -1 });
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get activity by ID
export const getActivity = async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id);
        if (!activity) {
            return res.status(404).json({ error: "Activity not found" });
        }
        res.status(200).json(activity);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update activity
export const updateActivity = async (req, res) => {
    try {
        const activity = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!activity) {
            return res.status(404).json({ error: "Activity not found" });
        }
        res.json(activity);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete activity
export const deleteActivity = async (req, res) => {
    try {
        const activity = await Activity.findByIdAndDelete(req.params.id);
        if (!activity) {
            return res.status(404).json({ error: "Activity not found" });
        }
        res.json({ message: "Activity deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
