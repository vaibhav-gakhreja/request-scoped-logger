import fs from 'fs';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';

export const LOG_FILE_PATH = path.join(__dirname, '../../logs/application_logs.csv');
const logDir = path.dirname(LOG_FILE_PATH);
const logFileExists = fs.existsSync(logDir);
if (!logFileExists) {
    fs.mkdirSync(logDir, { recursive: true });
}

const csvWriter = createObjectCsvWriter({
    path: LOG_FILE_PATH,
    header: [
        { id: 'requestId', title: 'requestId' },
        { id: 'endpointPath', title: 'endpointPath' },
        { id: 'logLevel', title: 'logLevel' },
        { id: 'timestamp', title: 'timestamp' },
        { id: 'logContent', title: 'logContent' }
    ],
    append: logFileExists
});

// Define log levels type
export type LogLevel = 'DEBUG' | 'INFO' | 'ACCESS' | 'ERROR';

// Define log structure
export interface LogData {
    requestId: string;
    endpointPath: string;
    logLevel: LogLevel;
    timestamp: string;
    logContent: string;
}

/**
 * Ensuring that the log content is in correct JSON format
 * this will avoid losing data during serialization.
 */
type JsonSerializable =
    | string
    | number
    | boolean
    | null
    | JsonSerializable[]
    | { [key: string]: JsonSerializable };

/**
 * Logger class for request-scoped logging
 */
export class RequestLogger {
    private readonly requestId: string;
    private readonly endpointPath: string;
    private disableLogging: boolean;

    /**
     * Create a new logger instance
     * @param requestId - Unique identifier for the request
     * @param endpointPath - API endpoint path
     */
    constructor(requestId: string, endpointPath: string) {
        this.requestId = requestId;
        this.endpointPath = endpointPath;
        this.disableLogging = false;
    }

    /**
     * Set the disableLogging flag
     * @param disableLogging - Whether to disable logging
     */
    setDisableLogging(disableLogging: boolean): void {
        this.disableLogging = disableLogging;
    }

    /**
     * Log a debug message
     * @param message - Message to log
     * @param metadata - Additional metadata to include
     */
    debug(message: string, metadata: JsonSerializable = {}): void {
        this._log('DEBUG', message, metadata);
    }

    /**
     * Log an info message
     * @param message - Message to log
     * @param metadata - Additional metadata to include
     */
    info(message: string, metadata: JsonSerializable = {}): void {
        this._log('INFO', message, metadata);
    }

    /**
     * Log an access message
     * @param message - Message to log
     * @param metadata - Additional metadata to include
     */
    access(message: string, metadata: JsonSerializable = {}): void {
        this._log('ACCESS', message, metadata);
    }

    /**
     * Log an error message
     * @param message - Message to log
     * @param metadata - Additional metadata or Error object to include
     */
    error(message: string, metadata: JsonSerializable | Error = {}): void {
        // Handle Error objects to avoid losing data during serialization
        if (metadata instanceof Error) {
            metadata = {
                name: metadata.name,
                message: metadata.message,
                stack: metadata.stack
            };
        }
        this._log('ERROR', message, metadata as JsonSerializable);
    }

    /**
     * Internal method to log messages with consistent format
     * @private
     * @param level - Log level
     * @param message - Message to log
     * @param metadata - Additional metadata
     */
    private _log(level: LogLevel, message: string, metadata: JsonSerializable): void {
        if(this.disableLogging) return;
        const timestamp = new Date().toISOString();
        const logData: LogData = {
            requestId: this.requestId,
            endpointPath: this.endpointPath,
            logLevel: level,
            timestamp,
            logContent: JSON.stringify({
                message,
                metadata
            })
        };

        // Write to CSV file
        csvWriter.writeRecords([logData])
            .catch(error => console.error('Error writing log:', error));
    }
}

export default RequestLogger;