import { Request, Response, NextFunction } from 'express';
import RequestLogger from '../logger/logger';

/**
 * Middleware that attaches a logger instance to each request
 */
export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void {

    // Create and attach logger instance to request
    req.logger = new RequestLogger(req.requestId, req.path);

    // Store request start time
    const startTime = Date.now();

    // Log response completion
    res.on('finish', () => {
        if (req.logger) {
            req.logger.access(`Request completed with status ${res.statusCode}`, {
                statusCode: res.statusCode,
                responseTime: Date.now() - startTime
            });
        }
    });
    next();
}
