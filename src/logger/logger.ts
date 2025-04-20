import fs from 'fs';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import { Readable } from 'stream';
import {Request} from "express";

// Logger configuration
const LOG_FILE_PATH = path.join(__dirname, '../../logs/application_logs.csv');

// Ensure logs directory exists
if (!fs.existsSync(path.dirname(LOG_FILE_PATH))) {
    fs.mkdirSync(path.dirname(LOG_FILE_PATH), { recursive: true });
}

// Initialize CSV Writer
const csvWriter = createObjectCsvWriter({
    path: LOG_FILE_PATH,
    header: [
        { id: 'requestId', title: 'REQUEST_ID' },
        { id: 'endpointPath', title: 'ENDPOINT_PATH' },
        { id: 'logLevel', title: 'LOG_LEVEL' },
        { id: 'timestamp', title: 'TIMESTAMP' },
        { id: 'logContent', title: 'LOG_CONTENT' }
    ],
    append: true
});

// Write CSV headers if file doesn't exist
if (!fs.existsSync(LOG_FILE_PATH)) {
    csvWriter.writeRecords([]);
}

// Define log levels type
export type LogLevel = 'DEBUG' | 'INFO' | 'ACCESS' | 'ERROR';

// Define log data interface
export interface LogData {
    requestId: string;
    endpointPath: string;
    logLevel: LogLevel;
    timestamp: string;
    logContent: string;
}

/**
 * Logger class for request-scoped logging
 */
export class RequestLogger {
    private requestId: string;
    private endpointPath: string;
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
    debug(message: string, metadata: Record<string, any> = {}): void {
        this._log('DEBUG', message, metadata);
    }

    /**
     * Log an info message
     * @param message - Message to log
     * @param metadata - Additional metadata to include
     */
    info(message: string, metadata: Record<string, any> = {}): void {
        this._log('INFO', message, metadata);
    }

    /**
     * Log an access message
     * @param message - Message to log
     * @param metadata - Additional metadata to include
     */
    access(message: string, metadata: Record<string, any> = {}): void {
        this._log('ACCESS', message, metadata);
    }

    /**
     * Log an error message
     * @param message - Message to log
     * @param metadata - Additional metadata or Error object to include
     */
    error(message: string, metadata: Record<string, any> | Error = {}): void {
        // Handle Error objects to avoid losing data during serialization
        if (metadata instanceof Error) {
            metadata = {
                name: metadata.name,
                message: metadata.message,
                stack: metadata.stack
            };
        }
        this._log('ERROR', message, metadata);
    }

    /**
     * Internal method to log messages with consistent format
     * @private
     * @param level - Log level
     * @param message - Message to log
     * @param metadata - Additional metadata
     */
    private _log(level: LogLevel, message: string, metadata: Record<string, any>): void {
        if(this.disableLogging) return;
        const timestamp = new Date().toISOString();
        const logData: LogData = {
            requestId: this.requestId,
            endpointPath: this.endpointPath,
            logLevel: level,
            timestamp,
            logContent: JSON.stringify({
                message,
                ...metadata
            })
        };

        // Write to CSV file
        csvWriter.writeRecords([logData])
            .catch(error => console.error('Error writing log:', error));
    }

    /**
     * Static method to get all logs by request ID
     * @param requestId - Request ID to filter logs
     * @returns Promise<LogData[]> - Array of matching logs
     */
    static async getLogsByRequestId(requestId: string): Promise<LogData[]> {
        // If log file doesn't exist, return empty array
        if (!fs.existsSync(LOG_FILE_PATH)) {
            return [];
        }

        try {
            // Read the entire file into memory
            const fileContent = await fs.promises.readFile(LOG_FILE_PATH, 'utf8');
            const lines = fileContent.split('\n');
            const logs: LogData[] = [];

            for (const rawLine of lines) {
                const line = rawLine.trim();

                // Skip empty lines or header
                if (!line || line.startsWith('REQUEST_ID,')) continue;

                // Parse CSV line into fields
                const [id, path, level, timestamp, content] = this.parseCSVLine(line);

                // If it matches the requestId, add to results
                if (id === requestId) {
                    logs.push({
                        requestId: id,
                        endpointPath: path,
                        logLevel: level as LogLevel,
                        timestamp,
                        logContent: content,
                    });
                }
            }

            return logs;
        } catch (err) {
            // todo handle all exceptions
            throw err;
        }
    }

    /**
     * Parse a CSV line into its components
     * @param line - CSV line to parse
     * @returns Array of parsed values
     * @private
     */
    private static parseCSVLine(line: string): string[] {
        // Simple CSV parsing implementation
        const result: string[] = [];
        let inQuotes = false;
        let currentField = '';

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
                continue;
            }

            if (char === ',' && !inQuotes) {
                result.push(currentField);
                currentField = '';
                continue;
            }

            currentField += char;
        }

        // Add the last field
        result.push(currentField);

        return result;
    }
}

export default RequestLogger;