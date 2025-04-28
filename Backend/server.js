import app from "./app.js";
import dotenv from "dotenv";
import http from "http";
import connectDB from "../Backend/Config/db.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Group from "./Models/group.model.js";
import Project from "./Models/project.model.js"; // Add Project import

dotenv.config();
 
connectDB();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Update Socket.IO initialization with CORS config
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://127.0.0.1:5173", "https://snippets-frontend-pearl.vercel.app"],
        methods: ["GET", "POST"],
        allowedHeaders: ["Authorization", "Content-Type"],
        credentials: true
    }
});

// Create namespaces for different features
const groupsNamespace = io.of('/groups');
const projectsNamespace = io.of('/projects'); // New namespace for projects

// Middleware for groups namespace
groupsNamespace.use(async (socket, next) => {
    try{
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1]; 
        const groupId = socket.handshake.query.groupId;

        const checkIdValid = mongoose.Types.ObjectId.isValid(groupId);

        if (!checkIdValid) {
            next(new Error('Invalid group id'));
        }

        socket.groupId = await Group.findById(groupId);

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_KEY);
            socket.decoded = decoded;
            next();
        }else{
            next(new Error('Please send token'));
        }
    }catch(err){
        next(err);
    }
});

// Middleware for projects namespace
projectsNamespace.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
        const projectId = socket.handshake.query.projectId;

        // Validate project ID
        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('Invalid project ID'));
        }

        // Verify token
        if (!token) {
            return next(new Error('Authentication token required'));
        }

        // Decode token
        try {
            const decoded = jwt.verify(token, process.env.JWT_KEY);
            socket.userId = decoded._id;
            
            // Verify project access
            const project = await Project.findById(projectId);
            
            if (!project) {
                return next(new Error('Project not found'));
            }
            
            // Check if user is a member of the project
            const isMember = project.members.some(m => m.user.equals(decoded._id)) || 
                             project.createdBy.equals(decoded._id);
            
            if (!isMember) {
                return next(new Error('Access denied: Not a member of this project'));
            }
            
            // Store project info in socket
            socket.projectId = projectId;
            socket.userRole = project.members.find(m => m.user.equals(decoded._id))?.role || 'Viewer';
            
            next();
        } catch (error) {
            return next(new Error('Invalid token'));
        }
    } catch (err) {
        next(err);
    }
});

// Handle group connections
groupsNamespace.on('connection', socket => {
    console.log('New group connection');

    const socketGroupId = socket.handshake.query.groupId;

    socket.roomId = socketGroupId;

    socket.join(socketGroupId);

    console.log('User joined group:', socketGroupId);

    socket.on('message', async (data) => {
        console.log(data);
        socket.broadcast.to(socketGroupId).emit('message', data);     
    });
    
    socket.on('event', data => {
        console.log('Event received:', data);
    });
    socket.on('disconnect', () => { /* … */ });
});

// Handle project connections
projectsNamespace.on('connection', socket => {
    console.log(`User ${socket.userId} connected to project ${socket.projectId}`);
    
    // Join project room
    socket.join(socket.projectId);
    
    // Notify others that user has joined
    socket.broadcast.to(socket.projectId).emit('user_joined', {
        userId: socket.userId,
        timestamp: new Date()
    });
    
    // Handle task updates
    socket.on('task_update', (data) => {
        console.log('Task update:', data);
        // Log activity to database
        try {
            const Activity = mongoose.model('Activity');
            Activity.logActivity({
                userId: socket.userId,
                action: 'update',
                targetType: 'task',
                targetId: data.taskId,
                metadata: {
                    projectId: socket.projectId,
                    changes: data.changes || {}
                }
            });
        } catch (err) {
            console.error('Error logging task update activity:', err);
        }

        socket.broadcast.to(socket.projectId).emit('task_update', {
            ...data,
            updatedBy: socket.userId,
            timestamp: new Date()
        });
    });
    
    // Handle task assignments
    socket.on('task_assigned', (data) => {
        // Log assignment activity
        try {
            const Activity = mongoose.model('Activity');
            Activity.logActivity({
                userId: socket.userId,
                action: 'assign',
                targetType: 'task',
                targetId: data.taskId,
                metadata: {
                    projectId: socket.projectId,
                    assignedTo: data.assignedTo
                },
                relatedUsers: [data.assignedTo]
            });
        } catch (err) {
            console.error('Error logging task assignment activity:', err);
        }

        socket.broadcast.to(socket.projectId).emit('task_assigned', {
            ...data,
            assignedBy: socket.userId,
            timestamp: new Date()
        });
    });
    
    // Handle new comments
    socket.on('new_comment', (data) => {
        // Log comment activity
        try {
            const Activity = mongoose.model('Activity');
            Activity.logActivity({
                userId: socket.userId,
                action: 'comment',
                targetType: data.targetType || 'task',
                targetId: data.targetId,
                metadata: {
                    projectId: socket.projectId,
                    commentId: data.commentId,
                    commentText: data.text && data.text.substring(0, 100) // Store preview
                }
            });
        } catch (err) {
            console.error('Error logging comment activity:', err);
        }

        socket.broadcast.to(socket.projectId).emit('new_comment', {
            ...data,
            userId: socket.userId,
            timestamp: new Date()
        });
    });
    
    // Handle new tasks
    socket.on('new_task', (data) => {
        // Log task creation activity
        try {
            const Activity = mongoose.model('Activity');
            Activity.logActivity({
                userId: socket.userId,
                action: 'create',
                targetType: 'task',
                targetId: data.taskId,
                metadata: {
                    projectId: socket.projectId,
                    taskTitle: data.title
                }
            });
        } catch (err) {
            console.error('Error logging task creation activity:', err);
        }

        socket.broadcast.to(socket.projectId).emit('new_task', {
            ...data,
            createdBy: socket.userId,
            timestamp: new Date()
        });
    });
    
    // Handle task status changes
    socket.on('status_change', (data) => {
        // Log status change activity
        try {
            const Activity = mongoose.model('Activity');
            Activity.logActivity({
                userId: socket.userId,
                action: 'status_change',
                targetType: 'task',
                targetId: data.taskId,
                metadata: {
                    projectId: socket.projectId,
                    oldStatus: data.oldStatus,
                    newStatus: data.newStatus
                }
            });
        } catch (err) {
            console.error('Error logging status change activity:', err);
        }

        socket.broadcast.to(socket.projectId).emit('status_change', {
            ...data,
            updatedBy: socket.userId,
            timestamp: new Date()
        });
    });
    
    // Handle project updates
    socket.on('project_update', (data) => {
        socket.broadcast.to(socket.projectId).emit('project_update', {
            ...data,
            updatedBy: socket.userId,
            timestamp: new Date()
        });
    });

    // Handle task dependency changes
    socket.on('dependency_change', (data) => {
        try {
            const Activity = mongoose.model('Activity');
            Activity.logActivity({
                userId: socket.userId,
                action: 'dependency_change',
                targetType: 'task',
                targetId: data.taskId,
                metadata: {
                    projectId: socket.projectId,
                    dependency: data.dependency,
                    changeType: data.changeType // 'add' or 'remove'
                }
            });
        } catch (err) {
            console.error('Error logging dependency change activity:', err);
        }
        socket.broadcast.to(socket.projectId).emit('dependency_change', {
            ...data,
            updatedBy: socket.userId,
            timestamp: new Date()
        });
    });

    // Handle time tracking events
    socket.on('time_tracking', (data) => {
        try {
            const Activity = mongoose.model('Activity');
            Activity.logActivity({
                userId: socket.userId,
                action: 'time_tracking',
                targetType: 'task',
                targetId: data.taskId,
                metadata: {
                    projectId: socket.projectId,
                    event: data.event, // 'start' or 'stop'
                    duration: data.duration || 0,
                    notes: data.notes || ''
                }
            });
        } catch (err) {
            console.error('Error logging time tracking activity:', err);
        }
        socket.broadcast.to(socket.projectId).emit('time_tracking', {
            ...data,
            updatedBy: socket.userId,
            timestamp: new Date()
        });
    });

    // Handle recurring task creation
    socket.on('recurring_task_created', (data) => {
        try {
            const Activity = mongoose.model('Activity');
            Activity.logActivity({
                userId: socket.userId,
                action: 'recurring_task_created',
                targetType: 'task',
                targetId: data.taskId,
                metadata: {
                    projectId: socket.projectId,
                    recurrence: data.recurrence
                }
            });
        } catch (err) {
            console.error('Error logging recurring task creation activity:', err);
        }
        socket.broadcast.to(socket.projectId).emit('recurring_task_created', {
            ...data,
            createdBy: socket.userId,
            timestamp: new Date()
        });
    });

    // Handle task cloning
    socket.on('task_cloned', (data) => {
        try {
            const Activity = mongoose.model('Activity');
            Activity.logActivity({
                userId: socket.userId,
                action: 'task_cloned',
                targetType: 'task',
                targetId: data.newTaskId,
                metadata: {
                    projectId: socket.projectId,
                    sourceTaskId: data.sourceTaskId
                }
            });
        } catch (err) {
            console.error('Error logging task cloning activity:', err);
        }
        socket.broadcast.to(socket.projectId).emit('task_cloned', {
            ...data,
            clonedBy: socket.userId,
            timestamp: new Date()
        });
    });

    // Broadcast activity logs (for real-time activity feed)
    socket.on('activity_log', (data) => {
        socket.broadcast.to(socket.projectId).emit('activity_log', {
            ...data,
            timestamp: new Date()
        });
    });
    
    socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected from project ${socket.projectId}`);
        
        // Notify others that user has left
        socket.broadcast.to(socket.projectId).emit('user_left', {
            userId: socket.userId,
            timestamp: new Date()
        });
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
});