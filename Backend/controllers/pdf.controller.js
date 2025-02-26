import { PDFDocument, rgb } from 'pdf-lib';
import sharp from 'sharp';
import fs from 'fs/promises';  // Using promises version of fs
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const initializeDirectories = async () => {
    const dirs = [
        path.join(__dirname, '../uploads'),
        path.join(__dirname, '../uploads/temp')
    ];
    
    for (const dir of dirs) {
        await fs.mkdir(dir, { recursive: true }).catch(() => {});
    }
};

const processImage = async (file, image, fitMode) => {
    let sharpInstance = sharp(file.path);
    
    try {
        const metadata = await sharpInstance.metadata();
        
        // Ensure image is not corrupted
        if (!metadata) {
            throw new Error('Invalid image metadata');
        }

        // Create a white background canvas first
        let resizeOptions = {
            width: Math.round(image.size.width * 2),
            height: Math.round(image.size.height * 2),
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
        };

        switch (fitMode) {
            case 'contain':
                resizeOptions.fit = 'contain';
                break;
            case 'cover':
                resizeOptions.fit = 'cover';
                break;
            case 'stretch':
                resizeOptions.fit = 'fill';
                break;
            default:
                resizeOptions.fit = 'contain';
        }

        // Process image with white background and error handling
        return await sharpInstance
            .flatten({ background: '#FFFFFF' })
            .resize(resizeOptions)
            .jpeg({ 
                quality: 100,
                progressive: true,
                chromaSubsampling: '4:4:4',
                background: '#FFFFFF'
            })
            .toBuffer();
    } catch (error) {
        throw new Error(`Image processing failed: ${error.message}`);
    }
};

export const createPDF = async (req, res) => {
    try {
        await initializeDirectories();

        // Validate request
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: "No images uploaded" 
            });
        }

        // Add request timeout handler
        req.setTimeout(300000); // 5 minutes timeout

        const pdfDoc = await PDFDocument.create();
        
        try {
            let pages = [];
            try {
                pages = req.body.pages ? JSON.parse(req.body.pages) : [{ id: 1, images: [] }];
            } catch (parseError) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid pages data format",
                    details: parseError.message
                });
            }

            for (const page of pages) {
                const pdfPage = pdfDoc.addPage([595, 842]); // A4 size
                
                // Fill the entire page with white background
                pdfPage.drawRectangle({
                    x: 0,
                    y: 0,
                    width: pdfPage.getWidth(),
                    height: pdfPage.getHeight(),
                    color: rgb(1, 1, 1), // White
                    opacity: 1
                });

                // Skip if no images array or empty array (allowing empty pages)
                if (!page.images || !Array.isArray(page.images)) {
                    continue;
                }

                // Sort images by cell hierarchy (parent cells first)
                const sortedImages = [...page.images].sort((a, b) => {
                    const aDepth = (a.cellId || '').split('-').length;
                    const bDepth = (b.cellId || '').split('-').length;
                    return aDepth - bDepth;
                });
                
                for (const image of sortedImages) {
                    try {
                        const file = req.files.find((f, index) => index === image.id);
                        if (!file) {
                            console.warn(`File not found for image ID ${image.id}`);
                            continue;
                        }

                        // Process image with white background
                        const imageBuffer = await processImage(file, image, image.fitMode || 'contain');
                        const img = await pdfDoc.embedJpg(imageBuffer);
                        
                        // Draw white rectangle as background for image area
                        pdfPage.drawRectangle({
                            x: image.position.x,
                            y: pdfPage.getHeight() - image.position.y - image.size.height,
                            width: image.size.width,
                            height: image.size.height,
                            color: rgb(1, 1, 1), // White
                            opacity: 1
                        });

                        // Draw image
                        pdfPage.drawImage(img, {
                            x: image.position.x,
                            y: pdfPage.getHeight() - image.position.y - image.size.height,
                            width: image.size.width,
                            height: image.size.height,
                            opacity: 1
                        });
                    } catch (imageError) {
                        console.error('Error processing image:', imageError);
                        continue; // Continue with next image even if one fails
                    }
                }
            }

            const pdfBytes = await pdfDoc.save();
            
            if (pdfBytes.length === 0) {
                throw new Error('Generated PDF is empty');
            }

            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Length', pdfBytes.length);
            res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
            
            // Set CORS headers explicitly
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:5173');
            
            res.status(200).send(Buffer.from(pdfBytes));

        } finally {
            // Cleanup temporary files
            await Promise.all(req.files.map(file => 
                fs.unlink(file.path).catch(console.error)
            ));
        }
    } catch (error) {
        // Set CORS headers for error responses too
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:5173');
        
        console.error('PDF creation error:', error);
        
        // Clean up any temporary files
        if (req.files) {
            await Promise.all(req.files.map(file => 
                fs.unlink(file.path).catch(console.error)
            ));
        }

        res.status(500).json({ 
            success: false,
            message: "Error creating PDF", 
            details: error.message 
        });
    }
};

export const downloadPDF = async (req, res) => {
    try {
        const { userId, fileName } = req.params;
        
        // Validate file name and extension
        if (!fileName.match(/^document_\d+\.pdf$/)) {
            return res.status(400).json({ message: "Invalid file format or name" });
        }

        const filePath = path.join(__dirname, '../uploads', userId, fileName);
        
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ message: "PDF not found" });
        }

        const fileStats = await fs.stat(filePath);
        if (fileStats.size === 0) {
            return res.status(400).json({ message: "PDF file is empty" });
        }

        // Set proper headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', fileStats.size);

        // Stream the file instead of using res.download
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ message: "Error downloading PDF" });
    }
};
