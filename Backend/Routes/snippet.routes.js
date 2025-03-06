import { Router } from "express";
import { body, query } from "express-validator";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { checkGroupPermission } from "../middlewares/groupPermissions.middleware.js";

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
    getSnippet,
    generateShareLink,
    getUserSnippets
} from "../controllers/snippet.controller.js";

const snippetRouter = Router();

// Apply auth middleware to all snippet routes
snippetRouter.use(authMiddleware);

// Create snippet
snippetRouter.post("/",
    [
        authMiddleware,
        checkGroupPermission('create_snippet'),
        body("title").trim().isLength({ min: 1 }).withMessage('Title is required'),
        body("content").notEmpty().withMessage('Content is required'),
        body("programmingLanguage").trim().notEmpty().withMessage('Programming language is required'),
        body("tags").isArray().optional(),
        body("visibility").isIn(['public', 'private', 'shared']).optional(),
        body("description").optional(),
        body("directoryId").optional(),
        body("groupId").optional()
    ],
    createSnippet
);

// Update snippet
snippetRouter.patch("/:id",
    [
        body("title").trim().isLength({ min: 1 }).optional(),
        body("content").optional(),
        body("programmingLanguage").trim().notEmpty().optional(),
        body("tags").isArray().optional(),
        body("visibility").isIn(['public', 'private', 'shared']).optional(),
        body("directoryId").optional(),
        body("commentsEnabled").isBoolean().optional(),
        body("description").optional()
    ],
    updateSnippet
);

// Delete snippet
snippetRouter.delete("/:id", deleteSnippet);

// Get snippet by ID
snippetRouter.get("/:id", getSnippetById);

// Get specific snippet
snippetRouter.get("/get/:id", getSnippet);

// Get all snippets (with filters)
snippetRouter.get("/", getAllSnippets);

// Get all snippets created by the current user
snippetRouter.get("/user/snippets", [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sort').optional().isString(),
    query('language').optional().isString(),
    query('search').optional().isString()
], getUserSnippets);

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
