import { Router, Request, Response } from 'express';
import { LogService } from '../services/logService';
import path from "path";
import fs from "fs";
import csvParser from "csv-parser";

interface CsvRecord {
    [key: string]: string;
}

/**
 * Controller for Log entity endpoints
 */
export class LogController {
    router: Router;
    private logService: LogService;

    /**
     * Create a new LogController instance
     */
    constructor() {
        this.router = Router();
        this.logService = new LogService();
        this.initializeRoutes();
    }

    /**
     * Initialize controller routes
     * @private
     */
    private initializeRoutes(): void {
        this.router.get('/:requestId', this.getLogsByRequestId.bind(this));
    }

    // todo: 1. why is this async?
    // todo: 2. See why browser is buffering those events, and not displaying it as it receives it.
    // todo: 3. read about internal working of these async events. read about promises, prepare get some hands-on examples.
    // todo: 4. add filtering based on requestId to the filtering endpoint
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
                const filePath = path.join(__dirname, '../../logs/application_logs.csv');

                // Set appropriate headers for streaming
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Transfer-Encoding', 'chunked');

                // Start the response with an opening bracket for a JSON array
                res.write('[\n');

                let isFirstRecord = true;
                const recordsPerChunk = parseInt(req.query.chunkSize as string) || 3;
                let chunkBuffer: CsvRecord[] = [];

                // sending chunks in parallel
                const readStream = fs.createReadStream(filePath)
                    .pipe(csvParser())
                    .on('data', (data: CsvRecord) => {
                        console.log(`Received data event from read stream`);
                        // Add record to the current chunk buffer
                        chunkBuffer.push(data);

                        // When buffer reaches the desired size, send the chunk
                        if (chunkBuffer.length >= recordsPerChunk) {
                            sendChunk();
                        }
                    })
                    .on('end', () => {
                        console.log(`Received end event from read stream.`);
                        // Send any remaining records in the buffer
                        if (chunkBuffer.length > 0) {
                            sendChunk();
                        }
                        res.write('\n]');
                        res.end();
                    })
                    .on('error', (error) => {
                        console.log(`Received error event from read stream.`);
                        if (isFirstRecord) {
                            res.write({ success: false, error: 'Failed to stream CSV file' });
                        } else {
                            res.write('\n]');
                        }
                        res.end();
                    });

                let totalRecordsSent = 0;

                // Helper function to send a chunk of records and detect backpressure
                function sendChunk() {
                    const chunk = chunkBuffer.map(record => JSON.stringify(record)).join(',\n');
                    if (!isFirstRecord) {
                        res.write(',\n');
                    } else {
                        isFirstRecord = false;
                    }
                    console.log(`Sending chunk of ${chunkBuffer.length} records`);
                    const canContinue = res.write(chunk);
                    totalRecordsSent += chunkBuffer.length;
                    chunkBuffer = [];
                    if(!canContinue) {
                        console.log('Backpressure detected. Pausing read stream.');
                        readStream.pause();
                        res.once('drain', () => {
                            console.log('Drain event emitted. Resuming read stream.');
                            readStream.resume();
                        });
                    }
                }

                req.on('close', () => {
                    console.log(`Client disconnected. Closing read stream. Sent ${totalRecordsSent} records.`);
                    readStream.destroy();
                });
            } else {
                // wait for the promise to complete
                // todo remove one await if applicable
                const logsPromise = await this.logService.getLogsByRequestId(requestId) as any[];
                const logs = await Promise.all(logsPromise);
                if (logs.length === 0) {
                    req.logger.info(`No logs found for request ID: ${requestId}`);
                    res.status(404).json({ error: 'No logs found for this request ID' });
                } else {
                    req.logger.info(`Retrieved ${logs.length} logs for request ID: ${requestId}`);
                    res.json(logs);
                }
            }
        } catch (error) {
            req.logger.error(`Error retrieving logs for request ID: ${req.params.requestId}`);
            res.status(500).json({ error: 'Failed to retrieve logs' });
        }
    }
}