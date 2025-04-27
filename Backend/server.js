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
        socket.broadcast.to(socket.projectId).emit('task_update', {
            ...data,
            updatedBy: socket.userId,
            timestamp: new Date()
        });
    });
    
    // Handle task assignments
    socket.on('task_assigned', (data) => {
        socket.broadcast.to(socket.projectId).emit('task_assigned', {
            ...data,
            assignedBy: socket.userId,
            timestamp: new Date()
        });
    });
    
    // Handle new comments
    socket.on('new_comment', (data) => {
        socket.broadcast.to(socket.projectId).emit('new_comment', {
            ...data,
            userId: socket.userId,
            timestamp: new Date()
        });
    });
    
    // Handle new tasks
    socket.on('new_task', (data) => {
        socket.broadcast.to(socket.projectId).emit('new_task', {
            ...data,
            createdBy: socket.userId,
            timestamp: new Date()
        });
    });
    
    // Handle task status changes
    socket.on('status_change', (data) => {
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