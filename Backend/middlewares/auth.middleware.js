import User from "../Models/user.model.js";
import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: "Authentication required",
                details: "No token provided or invalid format"
            });
        }

        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                error: "Authentication required",
                details: "Token is missing"
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_KEY);
            const user = await User.findOne({ _id: decoded._id });

            if (!user) {
                return res.status(401).json({
                    error: "Authentication failed",
                    details: "User not found"
                });
            }

            req.token = token;
            req.user = user;
            next();
        } catch (jwtError) {
            return res.status(401).json({
                error: "Invalid token",
                details: "Token validation failed"
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        res.status(500).json({ 
            error: "Authentication error",
            details: "Internal server error during authentication"
        });
    }
};