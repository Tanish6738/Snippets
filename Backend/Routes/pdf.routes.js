import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPDF, downloadPDF } from '../controllers/pdf.controller.js';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const tempDir = path.join(__dirname, '../uploads/temp');
        // Ensure directory exists
        fs.mkdirSync(tempDir, { recursive: true });
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB file size limit
        files: 50 // Maximum 50 files
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP and TIFF images are allowed.'));
        }
    }
}).array('images', 50);

const pdfRouter = Router();

// Wrap upload middleware to handle errors
pdfRouter.post('/create', (req, res, next) => {
    upload(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: "File upload error",
                details: err.message
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: "Invalid file",
                details: err.message
            });
        }
        next();
    });
}, createPDF);

pdfRouter.get('/download/:userId/:fileName', (req, res, next) => {
    // Add content type validation
    if (!req.params.fileName.endsWith('.pdf')) {
        return res.status(400).json({ message: "Invalid file format" });
    }
    next();
}, downloadPDF);

// Error handling middleware
pdfRouter.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: "File upload error",
            details: err.message
        });
    }
    next(err);
});

export default pdfRouter;
