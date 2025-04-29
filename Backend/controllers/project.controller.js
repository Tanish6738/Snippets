import Project from "../Models/project.model.js";
import User from "../Models/user.model.js";
import Task from "../Models/task.model.js";
import mongoose from "mongoose";

// Create a new project
export const createProject = async (req, res) => {
    try {
        const { 
            title, 
            description, 
            deadline, 
            priority, 
            tags, 
            projectType, 
            visibility, 
            initialMembers 
        } = req.body;
        const userId = req.user._id;
        
        // Initial members array always includes the creator as Admin
        const members = [{ user: userId, role: 'Admin', joinedAt: new Date() }];
        
        // Process initial members if provided and is a non-empty array
        if (initialMembers && Array.isArray(initialMembers) && initialMembers.length > 0) {
            try {
                // Find users by email and add them to the project
                const emails = initialMembers.map(member => member.email).filter(email => email && typeof email === 'string');
                
                if (emails.length > 0) {
                    const users = await User.find({ email: { $in: emails } });
                    
                    // Map emails to user IDs and roles
                    for (const user of users) {
                        // Skip if it's the creator (already added)
                        if (user._id.equals(userId)) continue;
                        
                        // Find the role for this user from the request
                        const memberData = initialMembers.find(m => m.email === user.email);
                        const role = memberData?.role || 'Contributor';
                        
                        // Add to members array
                        members.push({
                            user: user._id,
                            role,
                            joinedAt: new Date()
                        });
                    }
                }
            } catch (memberError) {
                // Just log the error but continue creating the project with just the creator
                console.error('Error processing initial members:', memberError);
                // We'll still create the project with just the creator
            }
        }
        
        const project = new Project({
            title,
            description,
            deadline: deadline ? new Date(deadline) : undefined,
            priority,
            tags: tags || [],
            createdBy: userId,
            members,
            projectType: projectType || 'Standard', // Standard, Development, Research, etc.
            visibility: visibility || 'private', // public or private
        });
        
        await project.save();
        await project.addActivity('project_created', `Project "${title}" was created`, userId);
        
        // If there were initial members, add activity entries for them
        const addedMembers = members.filter(member => !member.user.equals(userId));
        if (addedMembers.length > 0) {
            try {
                // Get usernames for the activity log
                const addedUserIds = addedMembers.map(m => m.user);
                const addedUsers = await User.find({ _id: { $in: addedUserIds } }).select('username');
                
                for (const user of addedUsers) {
                    await project.addActivity(
                        'member_added', 
                        `${user.username} was added to the project at creation`, 
                        userId
                    );
                }
            } catch (activityError) {
                // Log but don't fail if we can't add the activities
                console.error('Error adding member activities:', activityError);
            }
        }
        
        res.status(201).json({ 
            success: true, 
            message: 'Project created successfully',
            project
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create project',
            error: error.message 
        });
    }
};

// Get all projects for the current user
export const getUserProjects = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Find projects where user is a member or creator, OR public projects
        const projects = await Project.find({
            $or: [
                { createdBy: userId },
                { 'members.user': userId },
                { visibility: 'public' }
            ]
        })
        .sort({ createdAt: -1 })
        .populate('createdBy', 'username email avatar')
        .populate('members.user', 'username email avatar');
        
        res.status(200).json({
            success: true,
            count: projects.length,
            projects
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch projects',
            error: error.message
        });
    }
};

// Get all public projects
export const getPublicProjects = async (req, res) => {
    try {
        const projects = await Project.find({ visibility: 'public' })
            .sort({ createdAt: -1 })
            .populate('createdBy', 'username email avatar')
            .populate('members.user', 'username email avatar');
        
        res.status(200).json({
            success: true,
            count: projects.length,
            projects
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch public projects',
            error: error.message
        });
    }
};

// Get project by ID with tasks
export const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid project ID' 
            });
        }
        
        const project = await Project.findById(id)
            .populate('createdBy', 'username email avatar')
            .populate('members.user', 'username email avatar')
            .populate({
                path: 'tasks',
                populate: [
                    { path: 'assignedTo', select: 'username email avatar' },
                    { path: 'createdBy', select: 'username email avatar' }
                ]
            });
            
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        
        // Check if user has access to this project
        // Allow access if the project is public
        const isMember = project.members.some(m => m.user._id.equals(userId)) || 
                       project.createdBy._id.equals(userId);
                       
        if (!isMember && project.visibility !== 'public') {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have access to this project' 
            });
        }
        
        // Get root tasks (tasks without parent)
        const rootTasks = await Task.find({ 
            project: project._id,
            parentTask: null
        })
        .populate({
            path: 'subtasks',
            populate: [
                {
                    path: 'subtasks',
                    populate: [
                        {
                            path: 'subtasks',
                            populate: [
                                { path: 'assignedTo', select: 'username email avatar' },
                                { path: 'createdBy', select: 'username email avatar' }
                            ]
                        },
                        { path: 'assignedTo', select: 'username email avatar' },
                        { path: 'createdBy', select: 'username email avatar' }
                    ]
                },
                { path: 'assignedTo', select: 'username email avatar' },
                { path: 'createdBy', select: 'username email avatar' }
            ]
        })
        .populate('assignedTo', 'username email avatar')
        .populate('createdBy', 'username email avatar');
        
        res.status(200).json({
            success: true,
            project: {
                ...project._doc,
                rootTasks
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch project',
            error: error.message
        });
    }
};

// Update project
export const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { 
            title, 
            description, 
            deadline, 
            priority, 
            tags, 
            status,
            visibility,
            projectType
        } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid project ID' 
            });
        }
        
        const project = await Project.findById(id);
        
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        
        // Check if user has permission to update the project
        if (!project.hasPermission(userId, 'Admin')) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to update this project' 
            });
        }
        
        // Update project fields
        if (title !== undefined) project.title = title;
        if (description !== undefined) project.description = description;
        if (deadline !== undefined) project.deadline = new Date(deadline);
        if (priority !== undefined) project.priority = priority;
        if (tags !== undefined) project.tags = tags;
        if (status !== undefined) project.status = status;
        if (visibility !== undefined) project.visibility = visibility;
        if (projectType !== undefined) project.projectType = projectType;
        
        await project.save();
        await project.addActivity('project_updated', `Project "${project.title}" was updated`, userId);
        
        res.status(200).json({
            success: true,
            message: 'Project updated successfully',
            project
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update project',
            error: error.message
        });
    }
};

// Delete project
export const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid project ID' 
            });
        }
        
        const project = await Project.findById(id);
        
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        
        // Check if user has permission to delete the project
        if (!project.createdBy.equals(userId)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Only the project creator can delete this project' 
            });
        }
        
        // Delete all tasks associated with the project
        await Task.deleteMany({ project: id });
        
        // Delete the project
        await Project.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: 'Project and all associated tasks deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete project',
            error: error.message
        });
    }
};

// Get project dashboard (summary, progress, upcoming tasks)
export const getProjectDashboard = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid project ID' 
            });
        }
        
        const project = await Project.findById(id)
            .populate('createdBy', 'username email avatar')
            .populate('members.user', 'username email avatar');
            
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        
        // Check if user has access to this project
        const isMember = project.members.some(m => m.user._id.equals(userId)) || 
                       project.createdBy._id.equals(userId);
                        
        if (!isMember) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have access to this project' 
            });
        }
        
        // Get upcoming tasks (due in the next 7 days)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const upcomingTasks = await Task.find({
            project: id,
            dueDate: { $gte: new Date(), $lte: nextWeek }
        })
        .sort({ dueDate: 1 })
        .populate('assignedTo', 'username email avatar');
        
        // Get recent activity (last 10 items)
        const recentActivity = project.activity
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
            
        // Get task status summary - Fix: Use new ObjectId instead of mongoose.Types.ObjectId
        const taskStatusSummary = await Task.aggregate([
            { $match: { project: new mongoose.Types.ObjectId(id) } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        // Transform for easier frontend consumption
        const taskStatusCounts = {};
        taskStatusSummary.forEach(item => {
            taskStatusCounts[item._id] = item.count;
        });

        // Fetch all tasks for AI health insights
        let aiHealthInsights = null;
        try {
            const allTasks = await Task.find({ project: id })
                .select('title description status priority dueDate estimatedHours assignedTo tags dependencies');
            // Import the AI health insights logic directly
            const { generateTaskHealthInsights } = await import('./Ai.controller.js');
            // Simulate req/res for internal call
            const fakeReq = { params: { projectId: id }, body: { tasks: allTasks }, user: req.user };
            let aiResult = {};
            await new Promise((resolve) => {
                generateTaskHealthInsights(fakeReq, {
                    status: (code) => ({ json: (data) => { aiResult = { code, ...data }; resolve(); } }),
                    json: (data) => { aiResult = { code: 200, ...data }; resolve(); }
                });
            });
            aiHealthInsights = aiResult.success ? aiResult.insights : null;
        } catch (err) {
            aiHealthInsights = null;
        }
        
        res.status(200).json({
            success: true,
            dashboard: {
                project: {
                    _id: project._id,
                    title: project.title,
                    description: project.description,
                    progress: project.progress,
                    status: project.status,
                    deadline: project.deadline,
                    priority: project.priority,
                    createdBy: project.createdBy,
                    createdAt: project.createdAt
                },
                upcomingTasks,
                recentActivity,
                taskStatusSummary: taskStatusCounts,
                memberCount: project.members.length,
                aiHealthInsights // New: AI-powered health insights
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch project dashboard',
            error: error.message
        });
    }
};

// Add member to project
export const addProjectMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, role } = req.body;
        const userId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid project ID' 
            });
        }
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }
        
        const project = await Project.findById(id);
        
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        
        // Check if user has permission to add members
        if (!project.hasPermission(userId, 'Admin')) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to add members to this project' 
            });
        }
        
        // Find the user by email
        const userToAdd = await User.findOne({ email });
        
        if (!userToAdd) {
            return res.status(404).json({ 
                success: false, 
                message: 'User with this email not found' 
            });
        }
        
        // Check if user is already a member
        const isAlreadyMember = project.members.some(m => m.user.equals(userToAdd._id));
        
        if (isAlreadyMember) {
            return res.status(400).json({ 
                success: false, 
                message: 'User is already a member of this project' 
            });
        }
        
        // Add user to project
        project.members.push({
            user: userToAdd._id,
            role: role || 'Contributor',
            joinedAt: new Date()
        });
        
        await project.save();
        await project.addActivity('member_added', `${userToAdd.username} was added to the project`, userId);
        
        res.status(200).json({
            success: true,
            message: 'Member added successfully',
            member: {
                user: {
                    _id: userToAdd._id,
                    username: userToAdd.username,
                    email: userToAdd.email,
                    avatar: userToAdd.avatar
                },
                role: role || 'Contributor'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to add member to project',
            error: error.message
        });
    }
};

// Remove member from project
export const removeProjectMember = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const userId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid project or member ID' 
            });
        }
        
        const project = await Project.findById(id);
        
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        
        // Check if user has permission to remove members
        if (!project.hasPermission(userId, 'Admin')) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to remove members from this project' 
            });
        }
        
        // Check if member is the project creator
        if (project.createdBy.equals(memberId)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Cannot remove the project creator' 
            });
        }
        
        // Find the member in the project
        const memberIndex = project.members.findIndex(m => m.user.equals(memberId));
        
        if (memberIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Member not found in the project' 
            });
        }
        
        // Get member details before removing
        const memberToRemove = await User.findById(memberId).select('username');
        
        // Remove member from project
        project.members.splice(memberIndex, 1);
        await project.save();
        
        // Add activity log
        await project.addActivity('member_removed', `${memberToRemove.username} was removed from the project`, userId);
        
        // Also remove this user from any tasks they're assigned to
        await Task.updateMany(
            { project: id },
            { $pull: { assignedTo: memberId } }
        );
        
        res.status(200).json({
            success: true,
            message: 'Member removed successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to remove member from project',
            error: error.message
        });
    }
};

// Update member role
export const updateMemberRole = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const { role } = req.body;
        const userId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid project or member ID' 
            });
        }
        
        if (!role || !['Admin', 'Contributor', 'Viewer'].includes(role)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid role' 
            });
        }
        
        const project = await Project.findById(id);
        
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        
        // Check if user has permission to update roles
        if (!project.hasPermission(userId, 'Admin')) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to update member roles' 
            });
        }
        
        // Check if member is the project creator
        if (project.createdBy.equals(memberId)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Cannot change the role of the project creator' 
            });
        }
        
        // Find the member in the project
        const memberIndex = project.members.findIndex(m => m.user.equals(memberId));
        
        if (memberIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Member not found in the project' 
            });
        }
        
        // Get member details
        const member = await User.findById(memberId).select('username');
        
        // Update member role
        project.members[memberIndex].role = role;
        await project.save();
        
        // Add activity log
        await project.addActivity(
            'role_updated', 
            `${member.username}'s role was updated to ${role}`, 
            userId
        );
        
        res.status(200).json({
            success: true,
            message: 'Member role updated successfully',
            member: {
                user: memberId,
                role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update member role',
            error: error.message
        });
    }
};
