import app from "./app.js";
import dotenv from "dotenv";
import http from "http";
import connectDB from "../Backend/Config/db.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Group from "./Models/group.model.js";

dotenv.config();

connectDB();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Update Socket.IO initialization with CORS config
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
        methods: ["GET", "POST"],
        allowedHeaders: ["Authorization", "Content-Type"],
        credentials: true
    }
});

io.use(async (socket, next) => {
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

io.on('connection', socket => {

    console.log('New connection:');

    socket.join(socket.groupId._id);

    socket.on('message', async (data) => {
        console.log(data);
        socket.broadcast.to(socket.groupId._id).emit('message', data);     
    });
    
    socket.on('event', data => {
        
    });
    socket.on('disconnect', () => { /* … */ });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
});

