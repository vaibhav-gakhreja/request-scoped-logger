import { RequestLogger, LogData } from '../logger/logger';

/**
 * Service for Log entity business logic
 */
export class LogService {
    /**
     * Get logs by request ID
     * @param requestId - Request ID to filter logs
     * @returns Promise with logs
     */
    getLogsByRequestId(requestId: string): Promise<LogData[]> {
        return RequestLogger.getLogsByRequestId(requestId);
    }


}