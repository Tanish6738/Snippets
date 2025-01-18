import User from "../Models/user.model.js";
import bcrypt from "bcrypt";
import { validationResult } from "express-validator";

// User Registration
export const createUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ 
                error: "User already exists",
                message: userExists.email === email ? 
                    "Email already registered" : 
                    "Username already taken"
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password,
            preferences: {
                defaultSnippetVisibility: 'private',
                theme: 'light',
                emailNotifications: true
            }
        });

        const token = await user.generateAuthToken();
        
        // Remove password from response
        const userObject = user.toObject();
        delete userObject.password;

        res.status(201).json({ 
            message: "User registered successfully",
            user: userObject,
            token 
        });
    } catch (error) {
        res.status(500).json({ 
            error: "Registration failed",
            message: error.message 
        });
    }
};

// User Login
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email })
            .select('+password')
            .populate('favoriteSnippets');
        
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ 
                error: "Authentication failed",
                message: "Invalid email or password" 
            });
        }

        // Generate token
        const token = await user.generateAuthToken();
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Remove password from response
        const userObject = user.toObject();
        delete userObject.password;
        
        res.json({ 
            message: "Login successful",
            user: userObject,
            token 
        });
    } catch (error) {
        res.status(500).json({ 
            error: "Login failed",
            message: error.message 
        });
    }
};

// Get User Profile
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('favoriteSnippets');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update User Profile
export const updateProfile = async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['username', 'bio', 'avatar', 'preferences'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).json({ error: "Invalid updates" });
    }

    try {
        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();
        res.json(req.user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Change Password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = req.user;

        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }

        user.password = newPassword;
        await user.save();
        res.json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete Account
export const deleteAccount = async (req, res) => {
    try {
        await req.user.remove();
        res.json({ message: "Account deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Admin: Get All Users
export const getAllUsers = async (req, res) => {
    try {
        if (!req.user.roles.includes('admin')) {
            return res.status(403).json({ error: "Access denied" });
        }
        
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Admin: Update User Roles
export const updateUserRoles = async (req, res) => {
    try {
        if (!req.user.roles.includes('admin')) {
            return res.status(403).json({ error: "Access denied" });
        }

        const { userId, roles } = req.body;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.roles = roles;
        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// User Logout
export const logoutUser = async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
        await req.user.save();
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get User by ID
export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
