import express, { Express, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { loggerMiddleware } from './middleware/loggerMiddleware';
import { requestIdMiddleware } from './middleware/requestIdMiddleware';
import { UserController } from './controllers/userController';
import { LogController } from './controllers/logController';
import RequestLogger from "./logger/logger";

// Define the global namespace for Express request with logger
declare global {
    namespace Express {
        interface Request {
            requestId: string;
            logger: RequestLogger;
        }
    }
}


// Initialize the Express application
const app: Express = express();

app.use(express.json());

// Constants
const PORT: number = parseInt(process.env.PORT || '3000');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Apply middleware to all requests
app.use(requestIdMiddleware);
app.use(loggerMiddleware);

// Initialize controllers
const userController = new UserController();
const logController = new LogController();

// Register routes
app.use('/api/users', userController.router);
app.use('/api/logs', logController.router);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});