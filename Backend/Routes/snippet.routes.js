import { Router } from "express";
import { body, query } from "express-validator";
import { authMiddleware } from "../middlewares/auth.middleware.js";

import {
    createSnippet,
    updateSnippet,
    deleteSnippet,
    getSnippetById,
    getAllSnippets,
    shareSnippet,
    searchSnippets,
    exportSnippet,
    toggleComments,
    restoreVersion,
    bulkCreateSnippets,
    getSnippetStats,
    getSnippet, // Add this line
    generateShareLink, // Add this line
} from "../controllers/snippet.controller.js";

const snippetRouter = Router();

// Apply auth middleware to all snippet routes
snippetRouter.use(authMiddleware);

// Create snippet
snippetRouter.post("/",
    [
        body("title").trim().isLength({ min: 1 }).withMessage('Title is required'),
        body("content").notEmpty().withMessage('Content is required'),
        body("programmingLanguage").trim().notEmpty().withMessage('Programming language is required'), // Changed from language
        body("tags").isArray().optional(),
        body("visibility").isIn(['public', 'private', 'shared']).optional(),
        body("description").optional()
    ],
    createSnippet
);

// Update snippet
snippetRouter.patch("/:id",
    [
        body("title").trim().isLength({ min: 1 }).optional(),
        body("content").exists().optional(),
        body("language").notEmpty().optional(), // Simplified language validation
        body("tags").isArray().optional(),
        body("visibility").isIn(['public', 'private', 'shared']).optional()
    ],
    updateSnippet
);

// Delete snippet
snippetRouter.delete("/:id", deleteSnippet);

// Get snippet by ID
snippetRouter.get("/:id", getSnippetById);

// Get specific snippet
snippetRouter.get("/get/:id", getSnippet); // Add this line

// Get all snippets (with filters)
snippetRouter.get("/", getAllSnippets);

// Share snippet
snippetRouter.post("/:id/share",
    [
        body("entityId").exists(),
        body("entityType").isIn(['User', 'Group']),
        body("role").isIn(['viewer', 'editor', 'owner'])
    ],
    shareSnippet
);

// Generate share link
snippetRouter.post("/:id/share-link",
    [
        body("expiryDuration").optional(),
        body("visibility").isIn(['private', 'public', 'restricted']).optional(),
        body("allowComments").isBoolean().optional(),
        body("requireLogin").isBoolean().optional()
    ],
    generateShareLink
);

// Search snippets
snippetRouter.get("/search", searchSnippets);

// Export snippet
snippetRouter.get("/:id/export",
    authMiddleware,
    [
        query('format').isIn(['txt', 'json', 'md']).withMessage('Invalid format'),
        query('includeMetadata').optional().isBoolean(),
        query('includeTags').optional().isBoolean()
    ],
    exportSnippet
);

// Toggle comments
snippetRouter.patch("/:id/comments",
    [
        body("enabled").isBoolean()
    ],
    toggleComments
);

// Restore snippet version
snippetRouter.post("/:id/restore/:version",
    authMiddleware,
    restoreVersion
);

// Bulk create snippets
snippetRouter.post("/bulk",
    authMiddleware,
    [
        body("snippets").isArray(),
        body("snippets.*.title").trim().isLength({ min: 1 }),
        body("snippets.*.content").exists(),
        body("snippets.*.programmingLanguage")  // Changed from language
            .trim()
            .notEmpty()
            .withMessage('Programming language is required'),
        body("snippets.*.tags").isArray().optional(),
        body("snippets.*.visibility")
            .isIn(['public', 'private', 'shared'])
            .optional()
            .default('private')
    ],
    bulkCreateSnippets
);

// Get snippet statistics
snippetRouter.get("/:id/stats",
    authMiddleware,
    getSnippetStats
);

export default snippetRouter;
