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
    getUser // Add this line
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
userRouter.post("/register", registerValidation, createUser);
userRouter.post("/login", loginValidation, loginUser);

// Protected routes (require authentication)
userRouter.use(authMiddleware);

// Profile routes
userRouter.get("/profile", getProfile);
userRouter.patch("/profile", updateProfile);
userRouter.post("/change-password", changePassword);
userRouter.delete("/account", deleteAccount);
userRouter.post("/logout", logoutUser);
userRouter.get("/:id", getUser); // Add this line

// Admin routes
userRouter.get("/all", getAllUsers);
userRouter.patch("/roles", updateUserRoles);

export default userRouter;