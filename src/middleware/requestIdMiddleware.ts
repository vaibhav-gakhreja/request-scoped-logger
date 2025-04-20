import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {

    // Generate a new request ID
    const requestId = uuidv4();

    // Attach request ID to request object
    req.requestId = requestId;

    // Set request ID in the response header for easy testing
    res.setHeader('X-Request-ID', requestId);

    next();
}