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
        
        if (assignedTo && assignedTo.length > 0) {
            // Ensure all users are members of the project
            const validUserIds = project.members.map(m => m.user.toString());
            validUserIds.push(project.createdBy.toString());
            
            assignedUsers = assignedTo.filter(id => 
                mongoose.Types.ObjectId.isValid(id) && 
                validUserIds.includes(id)
            );
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
        
        // Add activity to project
        await project.addActivity('task_created', `Task "${title}" was created`, userId);
        
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
            populate: {
                path: 'subtasks',
                populate: {
                    path: 'subtasks'
                }
            }
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
            tags 
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
            if (title || description || priority || dueDate || assignedTo || tags) {
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
