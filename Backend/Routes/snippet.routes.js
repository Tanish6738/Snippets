import { Router } from "express";
import { body } from "express-validator";
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
} from "../controllers/snippet.controller.js";

const snippetRouter = Router();

// Apply auth middleware to all snippet routes
snippetRouter.use(authMiddleware);

// Create snippet
snippetRouter.post("/",
    [
        body("title").trim().isLength({ min: 1 }),
        body("content").exists(),
        body("language").exists().withMessage('Programming language is required'),
        body("tags").isArray().optional(),
        body("visibility").isIn(['public', 'private', 'shared']).optional()
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

// Search snippets
snippetRouter.get("/search", searchSnippets);

// Export snippet
snippetRouter.get("/:id/export", exportSnippet);

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
        body("snippets.*.language")
            .trim()
            .notEmpty(), // Updated language validation
        body("snippets.*.tags").isArray().optional(),
        body("snippets.*.visibility").isIn(['public', 'private', 'shared']).optional()
    ],
    bulkCreateSnippets
);

// Get snippet statistics
snippetRouter.get("/:id/stats",
    authMiddleware,
    getSnippetStats
);

export default snippetRouter;
