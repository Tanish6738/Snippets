# Project Documentation

## Server Configuration Files

### server.js
The main server file that handles Socket.IO connections and Python code execution.

```javascript
import app from "./app.js";
import http from "http";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Project from "./models/project.model.js";
import { generateResult } from "./config/Ai.js";
import { exec } from "child_process";
import fs from "fs";

dotenv.config();
connectDB();

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const processedMessages = new Set();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    const projectId = socket.handshake.query.projectId;

    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error('Invalid Project ID'));
    }

    const project = await Project.findById(projectId);
    if (!project) return next(new Error('Project not found'));

    socket.project = project;

    if (!token) return next(new Error('Authentication error'));

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    if (!decoded) return next(new Error('Authentication error'));

    socket.decoded = decoded;
    next();
  } catch (error) {
    next(new Error('Authentication or project retrieval error'));
  }
});

io.on('connection', (socket) => {
  socket.roomId = String(socket.project._id);
  socket.join(socket.roomId);

  socket.on('project-message', async (data) => {
    try {
      if (!data || !data.messageId || !data.message) {
        throw new Error('Invalid message data');
      }

      if (!processedMessages.has(data.messageId)) {
        processedMessages.add(data.messageId);

        const isAiMessage = data.message.startsWith('@ai');
        const isFileGenerationRequest = data.message.toLowerCase().includes('generate') || 
                                        data.message.toLowerCase().includes('create file');

        if (isAiMessage) {
          // Send user's message first
          socket.emit('project-message', {
            ...data,
            timestamp: new Date(),
            isPrivate: true,
            requesterId: socket.decoded.id
          });

          try {
            const prompt = data.message.replace('@ai', '').trim();
            const aiResponse = await generateResult(prompt);
            const parsedResponse = JSON.parse(aiResponse);

            // Update project's fileTree by merging new files instead of replacing
            if (parsedResponse.fileTree && Object.keys(parsedResponse.fileTree).length > 0) {
              const project = await Project.findById(socket.project._id);
              const updatedFileTree = {
                ...(project.fileTree || {}),
                ...parsedResponse.fileTree
              };

              await Project.findByIdAndUpdate(socket.project._id, {
                $set: { fileTree: updatedFileTree }
              });

              // Update the parsedResponse with the complete file tree
              parsedResponse.fileTree = updatedFileTree;
            }

            // Send AI response with isNewFileRequest flag
            socket.emit('project-message', {
              messageId: `ai-${Date.now()}`,
              sender: "ai",
              senderName: "AI",
              message: parsedResponse, // Send as object
              messageString: aiResponse, // Send as string
              timestamp: new Date(),
              isPrivate: true,
              requesterId: socket.decoded.id,
              fileTree: parsedResponse.fileTree || {},
              isNewFileRequest: isFileGenerationRequest
            });
          } catch (aiError) {
            console.error('AI Error:', aiError);
            socket.emit('error', { message: 'AI processing failed' });
          }
        } else {
          io.to(socket.roomId).emit('project-message', {
            ...data,
            timestamp: new Date(),
          });
        }

        // Cleanup old processed messages
        if (processedMessages.size > 1000) {
          const iterator = processedMessages.values();
          for (let i = 0; i < 100; i++) {
            processedMessages.delete(iterator.next().value);
          }
        }
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('leave-room', (data) => {
    if (data.projectId) socket.leave(String(data.projectId));
  });

  socket.on('disconnect', () => {
    socket.leave(socket.roomId);
  });
});

// New Endpoint: Run Python Code
app.post('/run-python', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    const filePath = './temp_code.py';

    // Save the Python code to a temporary file
    fs.writeFileSync(filePath, code);

    // Execute the Python file
    exec(`python3 ${filePath}`, (error, stdout, stderr) => {
      // Clean up: delete the temporary file
      fs.unlinkSync(filePath);

      if (error) {
        return res.status(500).json({ output: stderr || error.message });
      }

      return res.json({ output: stdout || 'No Output' });
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to execute Python code' });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### socket.io
Client-side Socket.IO configuration and connection management.

```javascript
import { io } from 'socket.io-client';

let socket;

export const initiateSocket = (projectId, token) => {
    if (socket) {
        socket.disconnect();
    }
    
    socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
        query: { projectId },
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket', 'polling']
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
            // Server disconnected, try reconnecting
            socket.connect();
        }
    });

    socket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error);
    });
    
    return socket;
};

export const receiveMessage = (event, callback) => {
    if (!socket) return;
    socket.on(event, callback);
};

export const sendMessage = (event, data) => {
    if (!socket) return;
    socket.emit(event, data);
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
    }
};

export const getSocket = () => socket;
```

### app.js
Express application setup and configuration.

```javascript
import app from "./app.js";
import http from "http";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Project from "./models/project.model.js";
import { generateResult } from "./config/Ai.js";
import { exec } from "child_process";
import fs from "fs";

dotenv.config();
connectDB();

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const processedMessages = new Set();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    const projectId = socket.handshake.query.projectId;

    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error('Invalid Project ID'));
    }

    const project = await Project.findById(projectId);
    if (!project) return next(new Error('Project not found'));

    socket.project = project;

    if (!token) return next(new Error('Authentication error'));

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    if (!decoded) return next(new Error('Authentication error'));

    socket.decoded = decoded;
    next();
  } catch (error) {
    next(new Error('Authentication or project retrieval error'));
  }
});

io.on('connection', (socket) => {
  socket.roomId = String(socket.project._id);
  socket.join(socket.roomId);

  socket.on('project-message', async (data) => {
    try {
      if (!data || !data.messageId || !data.message) {
        throw new Error('Invalid message data');
      }

      if (!processedMessages.has(data.messageId)) {
        processedMessages.add(data.messageId);

        const isAiMessage = data.message.startsWith('@ai');
        const isFileGenerationRequest = data.message.toLowerCase().includes('generate') || 
                                        data.message.toLowerCase().includes('create file');

        if (isAiMessage) {
          // Send user's message first
          socket.emit('project-message', {
            ...data,
            timestamp: new Date(),
            isPrivate: true,
            requesterId: socket.decoded.id
          });

          try {
            const prompt = data.message.replace('@ai', '').trim();
            const aiResponse = await generateResult(prompt);
            const parsedResponse = JSON.parse(aiResponse);

            // Update project's fileTree by merging new files instead of replacing
            if (parsedResponse.fileTree && Object.keys(parsedResponse.fileTree).length > 0) {
              const project = await Project.findById(socket.project._id);
              const updatedFileTree = {
                ...(project.fileTree || {}),
                ...parsedResponse.fileTree
              };

              await Project.findByIdAndUpdate(socket.project._id, {
                $set: { fileTree: updatedFileTree }
              });

              // Update the parsedResponse with the complete file tree
              parsedResponse.fileTree = updatedFileTree;
            }

            // Send AI response with isNewFileRequest flag
            socket.emit('project-message', {
              messageId: `ai-${Date.now()}`,
              sender: "ai",
              senderName: "AI",
              message: parsedResponse, // Send as object
              messageString: aiResponse, // Send as string
              timestamp: new Date(),
              isPrivate: true,
              requesterId: socket.decoded.id,
              fileTree: parsedResponse.fileTree || {},
              isNewFileRequest: isFileGenerationRequest
            });
          } catch (aiError) {
            console.error('AI Error:', aiError);
            socket.emit('error', { message: 'AI processing failed' });
          }
        } else {
          io.to(socket.roomId).emit('project-message', {
            ...data,
            timestamp: new Date(),
          });
        }

        // Cleanup old processed messages
        if (processedMessages.size > 1000) {
          const iterator = processedMessages.values();
          for (let i = 0; i < 100; i++) {
            processedMessages.delete(iterator.next().value);
          }
        }
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('leave-room', (data) => {
    if (data.projectId) socket.leave(String(data.projectId));
  });

  socket.on('disconnect', () => {
    socket.leave(socket.roomId);
  });
});

// New Endpoint: Run Python Code
app.post('/run-python', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    const filePath = './temp_code.py';

    // Save the Python code to a temporary file
    fs.writeFileSync(filePath, code);

    // Execute the Python file
    exec(`python3 ${filePath}`, (error, stdout, stderr) => {
      // Clean up: delete the temporary file
      fs.unlinkSync(filePath);

      if (error) {
        return res.status(500).json({ output: stderr || error.message });
      }

      return res.json({ output: stdout || 'No Output' });
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to execute Python code' });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Database Models

### chatSchema.js
Schema definition for chat messages and history.

```javascript
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    edited: {
        type: Boolean,
        default: false
    },
    originalContent: {
        type: String
    },
    // Add new fields
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    replyTo: {
        messageId: String,
        content: String,
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }
});

const chatHistorySchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    messages: [messageSchema]
});

// Compound index for efficient querying
chatHistorySchema.index({ project: 1, date: 1 });

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

export default ChatHistory;
```

### project.model.js
Schema definition for projects.

```javascript
import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    users: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
}, { timestamps: true });

// Check if model exists before creating
const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

export default Project;
```

## Controllers

### chat.controller.js
Chat functionality implementation including message management.

```javascript
import mongoose from 'mongoose';
import ChatHistory from '../models/ChatHistory.model.js';
import Project from '../models/project.model.js';

export const saveMessage = async (req, res) => {
    try {
        const { projectId, content, mentions, replyTo } = req.body;
        const sender = req.user._id;

        // Check if project exists and user is a member
        const project = await Project.findById(projectId);
        if (!project || !project.users.includes(sender)) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Validate mentions
        if (mentions) {
            const invalidMentions = mentions.filter(id => 
                !project.users.includes(id)
            );
            if (invalidMentions.length > 0) {
                return res.status(400).json({ 
                    message: "Some mentioned users are not in the project" 
                });
            }
        }

        // Get today's date without time
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find or create chat history for today
        let chatHistory = await ChatHistory.findOne({
            project: projectId,
            date: today
        });

        if (!chatHistory) {
            chatHistory = new ChatHistory({
                project: projectId,
                date: today,
                messages: []
            });
        }

        // Add new message
        chatHistory.messages.push({
            sender,
            content,
            mentions,
            replyTo,
            timestamp: new Date()
        });

        await chatHistory.save();
        
        return res.status(201).json({ message: "Message saved successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getChatHistory = async (req, res) => {
    try {
        const { projectId, date } = req.params;
        const userId = req.user._id;

        const project = await Project.findById(projectId);
        if (!project || !project.users.includes(userId)) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const queryDate = new Date(date);
        const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

        const chatHistory = await ChatHistory.findOne({
            project: projectId,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).populate('messages.sender', 'name');

        return res.status(200).json({ messages: chatHistory ? chatHistory.messages : [] });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getDatesList = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user._id;

        // Validate projectId
        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ message: "Invalid project ID" });
        }

        // Check if project exists and user is a member
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        
        if (!project.users.includes(userId)) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Get all chat histories for the project
        const chatHistories = await ChatHistory.find({ 
            project: projectId 
        }).select('date').sort({ date: -1 });

        // If no dates found, return today's date
        if (!chatHistories || chatHistories.length === 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return res.status(200).json({ 
                dates: [today]
            });
        }

        // Extract and format dates
        const dates = chatHistories.map(chat => {
            const date = new Date(chat.date);
            date.setHours(0, 0, 0, 0);
            return date;
        });

        return res.status(200).json({ dates });
    } catch (error) {
        console.error('Error in getDatesList:', error);
        return res.status(500).json({ 
            message: "Internal server error",
            error: error.message 
        });
    }
};

export const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content, projectId, timestamp } = req.body;
        const userId = req.user._id;

        // Find the chat history for the day of the message
        const messageDate = new Date(timestamp);
        messageDate.setHours(0, 0, 0, 0);

        const chatHistory = await ChatHistory.findOne({
            project: projectId,
            date: messageDate
        });

        if (!chatHistory) {
            return res.status(404).json({ message: "Chat history not found" });
        }

        // Find the message in the messages array
        const message = chatHistory.messages.find(msg => 
            msg.sender.toString() === userId.toString() && 
            msg.timestamp.getTime() === new Date(timestamp).getTime()
        );

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Check if the user is the message sender
        if (message.sender.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized to edit this message" });
        }

        // Store original content if this is the first edit
        if (!message.edited) {
            message.originalContent = message.content;
        }

        message.content = content;
        message.edited = true;

        await chatHistory.save();

        return res.status(200).json({ 
            message: "Message updated successfully",
            updatedMessage: message 
        });
    } catch (error) {
        console.error('Edit message error:', error);
        return res.status(500).json({ message: error.message });
    }
};
```

## Frontend Components

### project.jsx
React component for project management and chat interface.

```javascript
import mongoose from 'mongoose';
import ChatHistory from '../models/ChatHistory.model.js';
import Project from '../models/project.model.js';

export const saveMessage = async (req, res) => {
    try {
        const { projectId, content, mentions, replyTo } = req.body;
        const sender = req.user._id;

        // Check if project exists and user is a member
        const project = await Project.findById(projectId);
        if (!project || !project.users.includes(sender)) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Validate mentions
        if (mentions) {
            const invalidMentions = mentions.filter(id => 
                !project.users.includes(id)
            );
            if (invalidMentions.length > 0) {
                return res.status(400).json({ 
                    message: "Some mentioned users are not in the project" 
                });
            }
        }

        // Get today's date without time
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find or create chat history for today
        let chatHistory = await ChatHistory.findOne({
            project: projectId,
            date: today
        });

        if (!chatHistory) {
            chatHistory = new ChatHistory({
                project: projectId,
                date: today,
                messages: []
            });
        }

        // Add new message
        chatHistory.messages.push({
            sender,
            content,
            mentions,
            replyTo,
            timestamp: new Date()
        });

        await chatHistory.save();
        
        return res.status(201).json({ message: "Message saved successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getChatHistory = async (req, res) => {
    try {
        const { projectId, date } = req.params;
        const userId = req.user._id;

        const project = await Project.findById(projectId);
        if (!project || !project.users.includes(userId)) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const queryDate = new Date(date);
        const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

        const chatHistory = await ChatHistory.findOne({
            project: projectId,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).populate('messages.sender', 'name');

        return res.status(200).json({ messages: chatHistory ? chatHistory.messages : [] });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getDatesList = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user._id;

        // Validate projectId
        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ message: "Invalid project ID" });
        }

        // Check if project exists and user is a member
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        
        if (!project.users.includes(userId)) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Get all chat histories for the project
        const chatHistories = await ChatHistory.find({ 
            project: projectId 
        }).select('date').sort({ date: -1 });

        // If no dates found, return today's date
        if (!chatHistories || chatHistories.length === 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return res.status(200).json({ 
                dates: [today]
            });
        }

        // Extract and format dates
        const dates = chatHistories.map(chat => {
            const date = new Date(chat.date);
            date.setHours(0, 0, 0, 0);
            return date;
        });

        return res.status(200).json({ dates });
    } catch (error) {
        console.error('Error in getDatesList:', error);
        return res.status(500).json({ 
            message: "Internal server error",
            error: error.message 
        });
    }
};

export const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content, projectId, timestamp } = req.body;
        const userId = req.user._id;

        // Find the chat history for the day of the message
        const messageDate = new Date(timestamp);
        messageDate.setHours(0, 0, 0, 0);

        const chatHistory = await ChatHistory.findOne({
            project: projectId,
            date: messageDate
        });

        if (!chatHistory) {
            return res.status(404).json({ message: "Chat history not found" });
        }

        // Find the message in the messages array
        const message = chatHistory.messages.find(msg => 
            msg.sender.toString() === userId.toString() && 
            msg.timestamp.getTime() === new Date(timestamp).getTime()
        );

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Check if the user is the message sender
        if (message.sender.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized to edit this message" });
        }

        // Store original content if this is the first edit
        if (!message.edited) {
            message.originalContent = message.content;
        }

        message.content = content;
        message.edited = true;

        await chatHistory.save();

        return res.status(200).json({ 
            message: "Message updated successfully",
            updatedMessage: message 
        });
    } catch (error) {
        console.error('Edit message error:', error);
        return res.status(500).json({ message: error.message });
    }
};
```

## Key Features

- Real-time chat using Socket.IO
- AI message processing
- Python code execution endpoint
- Message editing and history tracking
- Project-based chat rooms
- User mentions and reply functionality
- Date-based chat history organization

## Authentication & Security

- JWT-based authentication
- Project-level access control
- Socket connection validation
- Message sender verification

## API Endpoints

### Chat Related
- POST /messages - Save new message
- GET /chat/:projectId/:date - Get chat history
- GET /chat/dates/:projectId - Get available chat dates
- PUT /messages/:messageId - Edit existing message

### Python Code Execution
- POST /run-python - Execute Python code

## WebSocket Events

- project-message: Handle new messages
- leave-room: Handle room departure
- disconnect: Handle connection termination
