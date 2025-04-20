import express, { Express } from 'express';
import { loggerMiddleware } from './middleware/loggerMiddleware';
import { requestIdMiddleware } from './middleware/requestIdMiddleware';
import { UserController } from './controllers/userController';
import { LogController } from './controllers/logController';
import RequestLogger from "./logger/logger";

// Extend the Express 'Request' with logger and request ID properties
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

// Configure express to apply middleware to all requests
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