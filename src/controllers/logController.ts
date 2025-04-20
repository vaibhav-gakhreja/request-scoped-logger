import {Router, Request, Response} from 'express';
import { LogService } from '../services/logService';

/**
 * Controller for Log entity endpoints
 */
export class LogController {
    router: Router;
    private logService: LogService;

    constructor() {
        this.router = Router();
        this.logService = new LogService();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get('/:requestId', this.getLogsByRequestId.bind(this));
    }

    /**
     * Get logs by request ID
     * @param req - Express request
     * @param res - Express response
     */
    async getLogsByRequestId(req: Request, res: Response): Promise<void> {
        try {
            const { requestId } = req.params;
            const shouldStream = req.query.stream === 'true';

            req.logger.info(`Retrieving logs for request ID: ${requestId}`, { stream: shouldStream });

            if (shouldStream) {
                this.logService.streamLogsByRequestId(req, res)
            } else {
                this.logService.getLogsByRequestId(req, res);
            }
        } catch (error) {
            req.logger.error(`Error retrieving logs for request ID: ${req.params.requestId}`);
            res.status(500).json({ error: 'Failed to retrieve logs' });
        }
    }
}