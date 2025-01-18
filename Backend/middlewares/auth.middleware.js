import User from "../Models/user.model.js";
import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('No token provided or invalid format');
        }

        const token = authHeader.replace('Bearer ', '');
        if (!token) {
            throw new Error('Authentication token missing');
        }

        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const user = await User.findOne({ _id: decoded._id });

        if (!user) {
            throw new Error('User not found');
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        res.status(401).json({ 
            error: "Please authenticate",
            details: error.message 
        });
    }
};