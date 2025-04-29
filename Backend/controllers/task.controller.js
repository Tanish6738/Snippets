import Task from "../Models/task.model.js";
import Project from "../Models/project.model.js";
import User from "../Models/user.model.js";
import mongoose from "mongoose";

// Create a new task in a project
export const createTask = async (req, res) => {
    try {
        const { 
            title, 
            description, 
            priority, 
            dueDate, 
            assignedTo, 
            tags, 
            category, // Added category
            parentTaskId 
        } = req.body;
        
        const { projectId } = req.params;
        const userId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid project ID' 
            });
        }
        
        const project = await Project.findById(projectId);
        
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        
        // Check if user has permission to create tasks
        if (!project.hasPermission(userId, 'Contributor')) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to create tasks in this project' 
            });
        }
        
        // Validate parent task if provided
        let parentTask = null;
        let level = 0;
        
        if (parentTaskId) {
            if (!mongoose.Types.ObjectId.isValid(parentTaskId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid parent task ID' 
                });
            }
            
            parentTask = await Task.findById(parentTaskId);
            
            if (!parentTask) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Parent task not found' 
                });
            }
            
            if (!parentTask.project.equals(project._id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Parent task must be in the same project' 
                });
            }
            
            level = parentTask.level + 1;
        }
        
        // Validate assigned users if provided
        let assignedUsers = [];
        
        // If no specific assignees provided, assign to project admin by default
        if (!assignedTo || assignedTo.length === 0) {
            // Find the admin from project.members or use the project creator
            const adminMember = project.members.find(m => m.role === 'Admin');
            if (adminMember) {
                assignedUsers = [adminMember.user];
            } else {
                // Fallback to project creator
                assignedUsers = [project.createdBy];
            }
        } else {
            // Ensure all users are members of the project
            const validUserIds = project.members.map(m => m.user.toString());
            validUserIds.push(project.createdBy.toString());
            
            assignedUsers = assignedTo.filter(id => 
                mongoose.Types.ObjectId.isValid(id) && 
                validUserIds.includes(id)
            );
            
            // If none of the provided users are valid project members,
            // fall back to assigning to the project creator/admin
            if (assignedUsers.length === 0) {
                assignedUsers = [project.createdBy];
            }
        }
        
        // Create the task
        const task = new Task({
            title,
            description,
            project: projectId,
            parentTask: parentTaskId || null,
            priority,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            assignedTo: assignedUsers,
            createdBy: userId,
            tags: tags || [],
            category: category || 'General', // Added category
            level
        });
        
        await task.save();
        
        // If this is a subtask, add it to the parent task
        if (parentTask) {
            await parentTask.addSubtask(task._id);
        } else {
            // Top-level task, add to project
            project.tasks.push(task._id);
            await project.save();
        }
        
        // Get the assignee details for the activity log
        let assigneeNames = "project admin";
        if (assignedUsers.length > 0) {
            const users = await User.find({ _id: { $in: assignedUsers } }).select('username');
            if (users.length > 0) {
                assigneeNames = users.length === 1 
                    ? users[0].username 
                    : `${users.length} users`;
            }
        }
        
        // Add activity to project with assignment details
        await project.addActivity(
            'task_created', 
            `Task "${title}" was created and assigned to ${assigneeNames}`, 
            userId
        );
        
        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            task
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create task',
            error: error.message
        });
    }
};

// Get all tasks for a project
export const getTasksByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid project ID' 
            });
        }
        
        const project = await Project.findById(projectId);
        
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        
        // Check if user has access to the project
        const isMember = project.members.some(m => m.user.equals(userId)) || 
                       project.createdBy.equals(userId);
                       
        if (!isMember) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have access to this project' 
            });
        }
        
        // Get all root tasks (tasks without parent)
        const rootTasks = await Task.find({ 
            project: projectId,
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
            count: rootTasks.length,
            tasks: rootTasks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tasks',
            error: error.message
        });
    }
};

// Get a single task with its subtasks
export const getTaskById = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid task ID' 
            });
        }
        
        const task = await Task.findById(taskId)
            .populate({
                path: 'subtasks',
                populate: {
                    path: 'subtasks',
                    populate: 'subtasks'
                }
            })
            .populate('assignedTo', 'username email avatar')
            .populate('createdBy', 'username email avatar')
            .populate('parentTask');
        
        if (!task) {
            return res.status(404).json({ 
                success: false, 
                message: 'Task not found' 
            });
        }
        
        // Check if user has access to the project
        const project = await Project.findById(task.project);
        
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        
        const isMember = project.members.some(m => m.user.equals(userId)) || 
                       project.createdBy.equals(userId);
                       
        if (!isMember) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have access to this project' 
            });
        }
        
        res.status(200).json({
            success: true,
            task
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch task',
            error: error.message
        });
    }
};

// Update a task
export const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user._id;
        const { 
            title, 
            description, 
            status, 
            priority, 
            dueDate, 
            assignedTo, 
            tags, 
            category // Added category
        } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid task ID' 
            });
        }
        
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ 
                success: false, 
                message: 'Task not found' 
            });
        }
        
        // Get project to check permissions
        const project = await Project.findById(task.project);
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        
        // Check if user has permission to update tasks
        if (!project.hasPermission(userId, 'Contributor')) {
            // Allow users to update tasks assigned to them
            const isAssigned = task.assignedTo.some(id => id.equals(userId));
            if (!isAssigned) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You do not have permission to update this task' 
                });
            }
            // If user is only assigned, they can only update status
            if (title || description || priority || dueDate || assignedTo || tags || category) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You can only update the status of tasks assigned to you' 
                });
            }
        }
        
        // Validate assigned users if provided
        if (assignedTo && assignedTo.length > 0) {
            // Ensure all users are members of the project
            const validUserIds = project.members.map(m => m.user.toString());
            validUserIds.push(project.createdBy.toString());
            
            const validAssignees = assignedTo.filter(id => 
                mongoose.Types.ObjectId.isValid(id) && 
                validUserIds.includes(id)
            );
            
            task.assignedTo = validAssignees;
        }
        
        // Update task fields
        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (status !== undefined) task.status = status;
        if (priority !== undefined) task.priority = priority;
        if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : undefined;
        if (tags !== undefined) task.tags = tags;
        if (category !== undefined) task.category = category;
        
        await task.save();
        
        // Log activity
        let activityMessage = `Task "${task.title}" was updated`;
        if (status) {
            activityMessage = `Task "${task.title}" was marked as ${status}`;
        }
        await project.addActivity('task_updated', activityMessage, userId);
        
        res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            task
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update task',
            error: error.message
        });
    }
};

// Delete a task
export const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid task ID' 
            });
        }
        
        const task = await Task.findById(taskId);
        
        if (!task) {
            return res.status(404).json({ 
                success: false, 
                message: 'Task not found' 
            });
        }
        
        // Get project to check permissions
        const project = await Project.findById(task.project);
        
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        
        // Check if user has permission to delete tasks
        if (!project.hasPermission(userId, 'Admin') && 
            !task.createdBy.equals(userId)) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to delete this task' 
            });
        }
        
        // Function to recursively delete subtasks
        async function deleteSubtasks(taskId) {
            const subtasks = await Task.find({ parentTask: taskId });
            
            for (const subtask of subtasks) {
                await deleteSubtasks(subtask._id); // Delete sub-subtasks first
            }
            
            await Task.deleteOne({ _id: taskId });
        }
        
        // Delete all subtasks recursively
        await deleteSubtasks(taskId);
        
        // If this was a top-level task, remove it from the project
        if (!task.parentTask) {
            project.tasks = project.tasks.filter(id => !id.equals(taskId));
            await project.save();
        } else {
            // If this was a subtask, remove it from its parent
            const parentTask = await Task.findById(task.parentTask);
            if (parentTask) {
                await parentTask.removeSubtask(taskId);
            }
        }
        
        // Log activity
        await project.addActivity('task_deleted', `Task "${task.title}" was deleted`, userId);
        
        // Update project progress
        await project.updateProgress();
        
        res.status(200).json({
            success: true,
            message: 'Task and all subtasks deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete task',
            error: error.message
        });
    }
};

// Get project dashboard (summary, progress, upcoming tasks)
export const getProjectDashboard = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid project ID' 
            });
        }
        
        const project = await Project.findById(projectId);
        
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        
        // Check if user has access to the project
        const isMember = project.members.some(m => m.user.equals(userId)) || 
                       project.createdBy.equals(userId);
                       
        if (!isMember) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have access to this project' 
            });
        }
        
        // Project summary
        const summary = {
            totalTasks: project.tasks.length,
            completedTasks: await Task.countDocuments({ project: projectId, status: 'Completed' }),
            overdueTasks: await Task.countDocuments({ project: projectId, dueDate: { $lt: new Date() } }),
            // Add more summary fields as needed
        };
        
        // Project progress
        const progress = await project.calculateProgress();
        
        // Upcoming tasks
        const upcomingTasks = await Task.find({ 
            project: projectId, 
            dueDate: { $gte: new Date() },
            status: { $ne: 'Completed' }
        })
        .sort({ dueDate: 1 })
        .limit(5) // Limit to next 5 upcoming tasks
        .populate('assignedTo', 'username email avatar')
        .populate('createdBy', 'username email avatar');
        
        res.status(200).json({
            success: true,
            summary,
            progress,
            upcomingTasks
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
        const { projectId } = req.params;
        const { userId, role } = req.body;
        const requesterId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid project ID' 
            });
        }
        
        const project = await Project.findById(projectId);
        
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        
        // Check if requester has permission to add members
        if (!project.hasPermission(requesterId, 'Admin')) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to add members to this project' 
            });
        }
        
        // Add member to project
        project.members.push({ user: userId, role: role || 'Contributor' });
        await project.save();
        
        // Log activity
        await project.addActivity(
            'member_added',
            `User was added to the project`,
            requesterId
        );
        
        res.status(200).json({
            success: true,
            message: 'Member added to project successfully',
            project
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
        const { projectId, userId } = req.params;
        const requesterId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid project ID' 
            });
        }
        
        const project = await Project.findById(projectId);
        
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        
        // Check if requester has permission to remove members
        if (!project.hasPermission(requesterId, 'Admin')) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to remove members from this project' 
            });
        }
        
        // Remove member from project
        project.members = project.members.filter(m => !m.user.equals(userId));
        await project.save();
        
        // Log activity
        await project.addActivity(
            'member_removed',
            `User was removed from the project`,
            requesterId
        );
        
        res.status(200).json({
            success: true,
            message: 'Member removed from project successfully',
            project
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
        const { projectId, userId } = req.params;
        const { role } = req.body;
        const requesterId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid project ID' 
            });
        }
        
        const project = await Project.findById(projectId);
        
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        
        // Check if requester has permission to update roles
        if (!project.hasPermission(requesterId, 'Admin')) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to update member roles in this project' 
            });
        }
        
        // Update member role
        const member = project.members.find(m => m.user.equals(userId));
        if (member) {
            member.role = role || 'Contributor';
            await project.save();
            
            // Log activity
            await project.addActivity(
                'member_role_updated',
                `Member role was updated`,
                requesterId
            );
            
            return res.status(200).json({
                success: true,
                message: 'Member role updated successfully',
                project
            });
        } else {
            return res.status(404).json({ 
                success: false, 
                message: 'Member not found in project' 
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update member role',
            error: error.message
        });
    }
};

// Assign a task to users
export const assignTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { userIds } = req.body;
        const userId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid task ID' 
            });
        }
        
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'User IDs are required' 
            });
        }
        
        const task = await Task.findById(taskId);
        
        if (!task) {
            return res.status(404).json({ 
                success: false, 
                message: 'Task not found' 
            });
        }
        
        // Get project to check permissions
        const project = await Project.findById(task.project);
        
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        
        // Check if user has permission to assign tasks
        if (!project.hasPermission(userId, 'Contributor')) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to assign tasks in this project' 
            });
        }
        
        // Validate user IDs - ensure they are valid and are members of the project
        const validUserIds = project.members.map(m => m.user.toString());
        validUserIds.push(project.createdBy.toString());
        
        const validAssignees = userIds.filter(id => 
            mongoose.Types.ObjectId.isValid(id) && 
            validUserIds.includes(id)
        );
        
        if (validAssignees.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No valid users to assign' 
            });
        }
        
        // Get user details for activity log
        const users = await User.find({ _id: { $in: validAssignees } })
            .select('username');
            
        const usernames = users.map(u => u.username);
        
        // Update task assignees
        task.assignedTo = validAssignees;
        await task.save();
        
        // Add activity
        const activityMessage = usernames.length === 1 
            ? `Task "${task.title}" was assigned to ${usernames[0]}`
            : `Task "${task.title}" was assigned to multiple users`;
            
        await project.addActivity('task_assigned', activityMessage, userId);
        
        res.status(200).json({
            success: true,
            message: 'Task assigned successfully',
            task
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to assign task',
            error: error.message
        });
    }
};

// Add comment to a task
export const addComment = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { text, mentions } = req.body;
        const userId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid task ID' 
            });
        }
        
        if (!text || !text.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Comment text is required' 
            });
        }
        
        const task = await Task.findById(taskId);
        
        if (!task) {
            return res.status(404).json({ 
                success: false, 
                message: 'Task not found' 
            });
        }
        
        // Get project to check permissions
        const project = await Project.findById(task.project);
        
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        
        // Check if user has access to the project
        const isMember = project.members.some(m => m.user.equals(userId)) || 
                       project.createdBy.equals(userId);
                       
        if (!isMember) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have access to this project' 
            });
        }
        
        // Validate mentions if provided
        let validMentions = [];
        if (mentions && Array.isArray(mentions) && mentions.length > 0) {
            const validUserIds = project.members.map(m => m.user.toString());
            validUserIds.push(project.createdBy.toString());
            
            validMentions = mentions.filter(id => 
                mongoose.Types.ObjectId.isValid(id) && 
                validUserIds.includes(id)
            );
        }
        
        // Add comment to task
        await task.addComment(text, userId, validMentions);
        
        // Add activity
        await project.addActivity('comment_added', `Comment added to task "${task.title}"`, userId);
        
        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            comment: task.comments[task.comments.length - 1]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to add comment',
            error: error.message
        });
    }
};

// Generate tasks using AI
export const generateTasksWithAI = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { description } = req.body;
        const userId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid project ID' 
            });
        }
        
        if (!description) {
            return res.status(400).json({ 
                success: false, 
                message: 'Project description is required for AI task generation' 
            });
        }
        
        const project = await Project.findById(projectId);
        
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        
        // Check if user has permission to add tasks
        if (!project.hasPermission(userId, 'Contributor')) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to add tasks to this project' 
            });
        }
        
        // NOTE: This is a placeholder. In a real implementation, 
        // we would call the AI service to generate tasks.
        // For now, we'll return a mock response
        
        const generatedTasks = [
            {
                title: "Task 1: Project Setup",
                description: "Initialize project structure and dependencies",
                priority: "High",
                subtasks: [
                    {
                        title: "Setup development environment",
                        description: "Install necessary tools and dependencies",
                        priority: "Medium"
                    },
                    {
                        title: "Configure project settings",
                        description: "Set up configuration files for the project",
                        priority: "Medium"
                    }
                ]
            },
            {
                title: "Task 2: Design Phase",
                description: "Create design specifications and mockups",
                priority: "High",
                subtasks: [
                    {
                        title: "Create mockups",
                        description: "Design UI mockups for key screens",
                        priority: "Medium"
                    },
                    {
                        title: "Define style guide",
                        description: "Establish colors, typography, and component styles",
                        priority: "Low"
                    }
                ]
            },
            {
                title: "Task 3: Implementation",
                description: "Develop core features and functionality",
                priority: "Medium",
                subtasks: [
                    {
                        title: "Implement backend API",
                        description: "Create REST endpoints for data access",
                        priority: "High"
                    },
                    {
                        title: "Develop frontend components",
                        description: "Build UI components based on the design mockups",
                        priority: "Medium"
                    }
                ]
            }
        ];
        
        // In a real implementation, we would save these tasks to the database
        // For now, we'll just return them to the frontend for review
        
        res.status(200).json({
            success: true,
            message: 'AI-generated tasks ready for review',
            tasks: generatedTasks,
            note: "These are sample tasks for demonstration. In a real implementation, tasks would be generated based on the project description using AI."
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate tasks',
            error: error.message
        });
    }
};

// Save AI-generated tasks to the project
export const saveGeneratedTasks = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { tasks } = req.body;
        const userId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid project ID' 
            });
        }
        
        if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No tasks provided to save' 
            });
        }
        
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        if (!project.hasPermission(userId, 'Contributor')) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to add tasks to this project' 
            });
        }
        // Find the project admin for default task assignment
        let adminId = project.createdBy;
        const adminMember = project.members.find(m => m.role === 'Admin');
        if (adminMember) {
            adminId = adminMember.user;
        }
        // Helper function to recursively create tasks and subtasks
        async function createTaskWithSubtasks(taskData, parentId = null, level = 0) {
            const task = new Task({
                title: taskData.title,
                description: taskData.description || '',
                project: projectId,
                parentTask: parentId,
                priority: taskData.priority || 'Medium',
                dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
                assignedTo: (taskData.recommendedAssigneeIds && taskData.recommendedAssigneeIds.length > 0) ? taskData.recommendedAssigneeIds : [adminId],
                createdBy: userId,
                tags: taskData.tags || [],
                category: taskData.category || 'General',
                level: level,
                aiGenerated: true,
                dependencies: taskData.dependencies || []
            });
            await task.save();
            if (!parentId) {
                project.tasks.push(task._id);
            } else {
                const parentTask = await Task.findById(parentId);
                if (parentTask) {
                    await parentTask.addSubtask(task._id);
                }
            }
            // Recursively create subtasks
            if (taskData.subtasks && Array.isArray(taskData.subtasks) && taskData.subtasks.length > 0) {
                for (const subtaskData of taskData.subtasks) {
                    await createTaskWithSubtasks(subtaskData, task._id, level + 1);
                }
            }
            return task;
        }
        // Create all tasks
        const savedTasks = [];
        for (const taskData of tasks) {
            const savedTask = await createTaskWithSubtasks(taskData);
            savedTasks.push(savedTask);
        }
        await project.save();
        await project.addActivity(
            'ai_tasks_added',
            `${savedTasks.length} AI-generated tasks were added to the project`,
            userId
        );
        res.status(201).json({
            success: true,
            message: `${savedTasks.length} AI-generated tasks were saved successfully`,
            tasks: savedTasks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to save AI-generated tasks',
            error: error.message
        });
    }
};

// Task dependencies management
export const addTaskDependency = async (req, res) => {
    try {
        const { taskId, dependencyId } = req.params;
        const { type, delay } = req.body;
        const userId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(dependencyId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid task or dependency ID' 
            });
        }
        
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ 
                success: false, 
                message: 'Task not found' 
            });
        }
        
        const dependencyTask = await Task.findById(dependencyId);
        if (!dependencyTask) {
            return res.status(404).json({ 
                success: false, 
                message: 'Dependency task not found' 
            });
        }
        
        // Check if both tasks are in the same project
        if (!task.project.equals(dependencyTask.project)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tasks must be in the same project' 
            });
        }
        
        // Check permissions
        const project = await Project.findById(task.project);
        if (!project.hasPermission(userId, 'Contributor')) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to manage task dependencies' 
            });
        }
        
        // Check for circular dependencies
        if (await hasCircularDependency(dependencyId, taskId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Adding this dependency would create a circular reference' 
            });
        }
        
        // Add dependency
        await task.addDependency(
            dependencyId, 
            type || 'finish-to-start', 
            delay || 0
        );
        
        // Log activity
        await project.addActivity(
            'dependency_added',
            `Dependency added between tasks "${dependencyTask.title}" and "${task.title}"`,
            userId
        );
        
        res.status(200).json({
            success: true,
            message: 'Task dependency added successfully',
            task: await Task.findById(taskId)
                .populate('dependencies.task', 'title status')
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to add task dependency',
            error: error.message
        });
    }
};

export const removeTaskDependency = async (req, res) => {
    try {
        const { taskId, dependencyId } = req.params;
        const userId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(dependencyId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid task or dependency ID' 
            });
        }
        
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ 
                success: false, 
                message: 'Task not found' 
            });
        }
        
        // Check permissions
        const project = await Project.findById(task.project);
        if (!project.hasPermission(userId, 'Contributor')) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to manage task dependencies' 
            });
        }
        
        // Remove dependency
        await task.removeDependency(dependencyId);
        
        // Log activity
        await project.addActivity(
            'dependency_removed',
            `Dependency removed from task "${task.title}"`,
            userId
        );
        
        res.status(200).json({
            success: true,
            message: 'Task dependency removed successfully',
            task: await Task.findById(taskId)
                .populate('dependencies.task', 'title status')
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to remove task dependency',
            error: error.message
        });
    }
};

// Helper function to check for circular dependencies
async function hasCircularDependency(startTaskId, targetTaskId, visited = new Set()) {
    if (startTaskId === targetTaskId) return true;
    if (visited.has(startTaskId)) return false;
    
    visited.add(startTaskId);
    
    const task = await Task.findById(startTaskId);
    if (!task) return false;
    
    const dependentTasks = await Task.find({
        'dependencies.task': startTaskId
    });
    
    for (const dependentTask of dependentTasks) {
        if (await hasCircularDependency(dependentTask._id, targetTaskId, visited)) {
            return true;
        }
    }
    
    return false;
}

// Recurring tasks
export const createRecurringTask = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user._id;
        
        const { 
            title, 
            description, 
            priority,
            estimatedHours,
            recurrence,
            tags
        } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid project ID' 
            });
        }
        
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        
        // Check if user has permission
        if (!project.hasPermission(userId, 'Contributor')) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to create tasks in this project' 
            });
        }
        
        // Validate recurrence
        if (!recurrence || !recurrence.frequency) {
            return res.status(400).json({ 
                success: false, 
                message: 'Recurrence frequency is required' 
            });
        }
        
        // Create the task template
        const task = new Task({
            title,
            description,
            project: projectId,
            priority: priority || 'Medium',
            estimatedHours,
            createdBy: userId,
            tags: tags || [],
            recurrence: {
                isRecurring: true,
                frequency: recurrence.frequency,
                interval: recurrence.interval || 1,
                daysOfWeek: recurrence.daysOfWeek,
                endDate: recurrence.endDate || null,
                occurrences: recurrence.occurrences || null
            }
        });
        
        await task.save();
        project.tasks.push(task._id);
        await project.save();
        
        // Log activity
        await project.addActivity(
            'recurring_task_created',
            `Recurring task "${title}" was created`,
            userId
        );
        
        // Create the first instance if requested
        if (req.body.createFirstInstance) {
            // Clone the template task but mark it as non-recurring instance
            const instance = await Task.cloneTask(task._id, userId, {
                title: task.title,
                includeAttachments: false,
                includeSubtasks: false
            });
            
            instance.recurrence = {
                isRecurring: false,
                parentRecurringTaskId: task._id
            };
            
            await instance.save();
            
            // Return both template and first instance
            res.status(201).json({
                success: true,
                message: 'Recurring task created successfully with first instance',
                template: task,
                instance
            });
        } else {
            res.status(201).json({
                success: true,
                message: 'Recurring task template created successfully',
                task
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create recurring task',
            error: error.message
        });
    }
};

export const generateRecurringInstances = async (req, res) => {
    try {
        const userId = req.user._id;
        const { days = 30 } = req.query; // Default to 30 days ahead
        
        // Generate instances for up to X days in the future
        const upToDate = new Date(Date.now() + parseInt(days) * 24 * 60 * 60 * 1000);
        
        // Administrative check - only admins can do bulk generation
        const user = await User.findById(userId);
        if (!user || !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can generate recurring tasks in bulk'
            });
        }
        
        // Generate instances
        await Task.createRecurringInstances(upToDate);
        
        res.status(200).json({
            success: true,
            message: `Recurring task instances generated for the next ${days} days`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate recurring task instances',
            error: error.message
        });
    }
};

// Task cloning
export const cloneTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user._id;
        const { options } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid task ID' 
            });
        }
        
        const sourceTask = await Task.findById(taskId);
        if (!sourceTask) {
            return res.status(404).json({ 
                success: false, 
                message: 'Source task not found' 
            });
        }
        
        // Check if user has permission (at least contributor)
        const project = await Project.findById(sourceTask.project);
        if (!project.hasPermission(userId, 'Contributor')) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to clone tasks in this project' 
            });
        }
        
        // Clone the task
        const clonedTask = await Task.cloneTask(taskId, userId, {
            title: options?.title,
            adjustDates: options?.adjustDates || false,
            dateOffset: options?.dateOffset || 0,
            includeSubtasks: options?.includeSubtasks || false,
            includeAttachments: options?.includeAttachments || false,
            includeAssignees: options?.includeAssignees || false
        });
        
        // Log activity
        await project.addActivity(
            'task_cloned',
            `Task "${sourceTask.title}" was cloned to "${clonedTask.title}"`,
            userId
        );
        
        res.status(201).json({
            success: true,
            message: 'Task cloned successfully',
            task: clonedTask
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to clone task',
            error: error.message
        });
    }
};

// Task health calculation
export const calculateTaskHealth = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid task ID' 
            });
        }
        
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ 
                success: false, 
                message: 'Task not found' 
            });
        }
        
        // Check if user has permission
        const project = await Project.findById(task.project);
        if (!project.hasPermission(userId, 'Contributor')) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to manage this task' 
            });
        }
        
        // Calculate health
        await task.calculateHealth();
        
        res.status(200).json({
            success: true,
            message: 'Task health calculated successfully',
            health: task.health
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to calculate task health',
            error: error.message
        });
    }
};

// Calculate health for all tasks in a project
export const calculateProjectTasksHealth = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user._id;
        
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid project ID' 
            });
        }
        
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: 'Project not found' 
            });
        }
        
        // Check if user has permission
        if (!project.hasPermission(userId, 'Contributor')) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to manage tasks in this project' 
            });
        }
        
        // Get all tasks for this project
        const tasks = await Task.find({ project: projectId });
        const results = {
            total: tasks.length,
            updated: 0,
            byStatus: {
                'on-track': 0,
                'at-risk': 0,
                'delayed': 0,
                'ahead': 0
            }
        };
        
        // Calculate health for each task
        for (const task of tasks) {
            await task.calculateHealth();
            results.updated++;
            results.byStatus[task.health.status]++;
        }
        
        // Log activity
        await project.addActivity(
            'health_calculated',
            `Health calculated for all tasks in the project`,
            userId
        );
        
        res.status(200).json({
            success: true,
            message: 'Task health calculated for all tasks in the project',
            results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to calculate task health',
            error: error.message
        });
    }
};

// Create a subtask for a given parent task
export const createSubtask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user._id;
        const { title, description, priority, dueDate, assignedTo, tags } = req.body;

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ success: false, message: 'Invalid parent task ID' });
        }

        const parentTask = await Task.findById(taskId);
        if (!parentTask) {
            return res.status(404).json({ success: false, message: 'Parent task not found' });
        }

        const project = await Project.findById(parentTask.project);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Check if user has permission to create subtasks
        if (!project.hasPermission(userId, 'Contributor')) {
            return res.status(403).json({ success: false, message: 'You do not have permission to create subtasks in this project' });
        }

        // Validate assigned users if provided
        let assignedUsers = [];
        if (!assignedTo || assignedTo.length === 0) {
            const adminMember = project.members.find(m => m.role === 'Admin');
            assignedUsers = [adminMember ? adminMember.user : project.createdBy];
        } else {
            const validUserIds = project.members.map(m => m.user.toString());
            validUserIds.push(project.createdBy.toString());
            assignedUsers = assignedTo.filter(id => mongoose.Types.ObjectId.isValid(id) && validUserIds.includes(id));
            if (assignedUsers.length === 0) assignedUsers = [project.createdBy];
        }

        // Create the subtask
        const subtask = new Task({
            title,
            description,
            project: parentTask.project,
            parentTask: parentTask._id,
            priority,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            assignedTo: assignedUsers,
            createdBy: userId,
            tags: tags || [],
            level: parentTask.level + 1
        });
        await subtask.save();
        await parentTask.addSubtask(subtask._id);

        // Add activity
        await project.addActivity('subtask_created', `Subtask "${title}" was created under "${parentTask.title}"`, userId);

        res.status(201).json({ success: true, message: 'Subtask created successfully', subtask });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create subtask', error: error.message });
    }
};
