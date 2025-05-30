import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

// Import routes 
import userRouter from './Routes/user.routes.js';
import snippetRouter from './Routes/snippet.routes.js';
import groupRouter from './Routes/groups.routes.js';
import directoryRouter from './Routes/directory.routes.js';
import activityRouter from './Routes/activity.routes.js'; 
import aiRouter from './Routes/Ai.routes.js';
import blogRouter from './Routes/Blog/Blog.routes.js';
import blogInteractionRouter from './Routes/Blog/LikeAndCommet.routes.js';
import publicRouter from './Routes/public.routes.js';
import runCodeRouter from './Routes/run-code.routes.js'; 
import scrapeRouter from './Routes/scraper.routes.js';  
import pdfRouter from './Routes/pdf.routes.js';   
import projectRouter from './Routes/project.routes.js';
import taskRouter from './Routes/task.routes.js';
import timeTrackingRouter from './Routes/time-tracking.routes.js';

dotenv.config();

// Initialize express
const app = express();
 
// Update CORS configuration
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'https://snippets-frontend-pearl.vercel.app',
             process.env.CLOUD_FLARED,
            'http://localhost:3000',
            'http://localhost:5173'
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-CSRF-Token',
        'X-Requested-With',
        'Accept',
        'Accept-Version',
        'Content-Length',
        'Content-MD5',
        'Date',
        'X-Api-Version',
        'Origin',
        'Cache-Control',
        'Pragma'
    ]
}));
  
// Logging middleware
app.use(morgan('dev'));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

// Health check endpoints
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

app.get('/health/detailed', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        node_version: process.version,
        env: process.env.NODE_ENV
    });
});

// API Routes with versioning
app.use('/api/users', userRouter);
app.use('/api/snippets', snippetRouter);
app.use('/api/groups', groupRouter);
app.use('/api/directories', directoryRouter);
app.use('/api/activities', activityRouter); 
app.use('/api/ai', aiRouter);
app.use('/api/blogs', blogRouter);
app.use('/api/blog-interactions', blogInteractionRouter);
app.use('/api/public', publicRouter);  // Add public routes
app.use('/api/run-code', runCodeRouter); // Add this line with the other route declarations
app.use('/api/scraper', scrapeRouter);  // Add scraper routes
app.use('/api/pdf', pdfRouter);         // Add PDF routes
app.use('/api/projects', projectRouter);
app.use('/api', taskRouter); // <-- changed from '/api/tasks' to '/api'
app.use('/api', timeTrackingRouter);    // Add time tracking routes

// Base route
app.get('/', (req, res) => {
    res.json({
        message: 'Snippets API is running',
        version: '1.0.0',
        documentation: '/api/docs',
        health: '/health'
    });
});

// API Documentation route
app.get('/api/docs', (req, res) => {
    res.json({
        version: '1.0.0',
        endpoints: {
            users: '/api/v1/users',
            snippets: '/api/v1/snippets',
            groups: '/api/v1/groups',
            directories: '/api/v1/directories',
            activities: '/api/v1/activities', // Add activities endpoint
            blogs: '/api/v1/blogs',
            blogInteractions: '/api/v1/blog-interactions',
            public: '/api/public', // Add public endpoints
            scraper: '/api/scraper',     // Add scraper documentation
            pdf: '/api/pdf',              // Add PDF documentation
            projects: '/api/projects',
            tasks: '/api/tasks',
            timeTracking: '/api/tasks/:taskId/time' // Add time tracking documentation
        },
        documentation: 'https://github.com/yourusername/snippets/wiki'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        documentation: '/api/docs'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Handle different types of errors
    switch (err.name) {
        case 'MongoError':
        case 'MongoServerError':
            if (err.code === 11000) {
                return res.status(400).json({
                    status: 'error',
                    error: 'Duplicate Error',
                    message: 'This record already exists',
                    field: Object.keys(err.keyPattern)[0]
                });
            }
            break;

        case 'ValidationError':
            return res.status(400).json({
                status: 'error',
                error: 'Validation Error',
                message: err.message,
                details: Object.values(err.errors).map(e => ({
                    field: e.path,
                    message: e.message
                }))
            });

        case 'JsonWebTokenError':
        case 'TokenExpiredError':
            return res.status(401).json({
                status: 'error',
                error: 'Authentication Error',
                message: 'Invalid or expired token'
            });

        case 'MulterError':
            return res.status(400).json({
                status: 'error',
                error: 'File Upload Error',
                message: err.message
            });
    }

    // Default error response
    res.status(err.status || 500).json({
        status: 'error',
        error: err.name || 'Internal Server Error',
        message: err.message || 'Something went wrong',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Export app
export default app;