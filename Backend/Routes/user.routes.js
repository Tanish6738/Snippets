import { Router } from "express";
import { body } from "express-validator";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
    createUser,
    loginUser,
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
    getAllUsers,
    updateUserRoles,
    logoutUser,
    getUser,
    toggleFavorite, // Add this line
    getUserDirectoryTree, // Add this line
    getAvailableUsersForGroup // Add the import at the top
} from "../controllers/user.controller.js";

const userRouter = Router();

// Register validation
const registerValidation = [
    body("username")
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage("Username must be between 3 and 30 characters")
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage("Username can only contain letters, numbers, underscores and hyphens"),
    body("email")
        .isEmail()
        .withMessage("Please provide a valid email")
        .normalizeEmail(),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long")
        .matches(/\d/)
        .withMessage("Password must contain at least one number")
];

// Login validation
const loginValidation = [
    body("email")
        .isEmail()
        .withMessage("Please provide a valid email")
        .normalizeEmail(),
    body("password")
        .exists()
        .withMessage("Password is required")
];

// Auth routes (public)
userRouter.post("/register", registerValidation, (req, res, next) => {
    console.log('Register route hit'); // Add logging
    next();
}, createUser);

userRouter.post("/login", loginValidation, (req, res, next) => {
    console.log('Login route hit'); // Add logging
    next();
}, loginUser);

// Protected routes (require authentication)
userRouter.use(authMiddleware);

// Profile routes
userRouter.get("/profile", (req, res, next) => {
    console.log('Get profile route hit'); // Add logging
    next();
}, getProfile);

// Update profile validation
const profileUpdateValidation = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .matches(/^[a-zA-Z0-9_-]+$/),
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 200 }),
    body('preferences')
        .optional()
        .isObject()
];

userRouter.patch("/profile", profileUpdateValidation, updateProfile);

// Password change validation
const passwordChangeValidation = [
    body('currentPassword').exists(),
    body('newPassword')
        .isLength({ min: 6 })
        .matches(/\d/)
];

userRouter.post("/change-password", passwordChangeValidation, changePassword);

userRouter.delete("/account", deleteAccount);
userRouter.post("/logout", logoutUser);
userRouter.get("/:id", getUser);

// Add favorites routes
userRouter.post('/favorites/:snippetId', authMiddleware, toggleFavorite);

// Add directory tree route
userRouter.get('/directory-tree', authMiddleware, getUserDirectoryTree);

// Add this line with your other routes
userRouter.get("/available-for-group/:groupId", authMiddleware, async (req, res, next) => {
    console.log('Getting available users for group:', req.params.groupId);
    next();
}, getAvailableUsersForGroup);

// Admin routes
userRouter.get("/all", (req, res, next) => {
    console.log('Get all users route hit'); // Add logging
    next();
}, getAllUsers);

userRouter.patch("/roles", (req, res, next) => {
    console.log('Update user roles route hit'); // Add logging
    next();
}, updateUserRoles);

export default userRouter;