import app from "./app.js";
import dotenv from "dotenv";
import http from "http";
import connectDB from "../Backend/Config/db.js"

dotenv.config();

const startServer = async () => {
    try {
        await connectDB();
        const PORT = process.env.PORT || 3000;
        const server = http.createServer(app);

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        server.on('error', (error) => {
            console.error('Server error:', error);
            process.exit(1);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();