import {LOG_FILE_PATH, LogData} from '../logger/logger';
import {Request, Response} from "express";
import fs from "fs";
import csvParser from "csv-parser";

/**
 * Service for Log entity business logic
 */
export class LogService {
    /**
     * Get logs by request ID and sends it to the client using res.json() method.
     * @param req - Express request
     * @param res - Express response
     */
    getLogsByRequestId(req: Request, res: Response): void {
        const requestId: string = req.params.requestId.toString()
        if (!fs.existsSync(LOG_FILE_PATH)) {
            res.json({});
            return;
        }

        const logs: LogData[] = [];
        fs.createReadStream(LOG_FILE_PATH)
            .pipe(csvParser())
            .on('data', (data: LogData) => {
                if (data.requestId === requestId) {
                    logs.push(data);
                }
            })
            .on('end', () => {
                req.logger.info(`Retrieved ${logs.length} logs for request ID: ${requestId}`);
                res.json(logs);
            })
            .on('error', (err) => {
                req.logger.error(`Error occurred while reading logs. Retrieved ${logs.length} logs for request ID: ${requestId}`);
                res.json(logs);
            });
    }

    /**
     * Streams logs by request ID and sends it to the client through the res.write() method.
     * @param req - Express request
     * @param res - Express response
     */
    streamLogsByRequestId(req: Request, res: Response): void {
        const requestId = req.params.requestId.toString();
        console.log(`Streaming logs for request ID: ${requestId}`);

        // Set appropriate headers for streaming
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Transfer-Encoding', 'chunked');

        // Start the response with an opening bracket for a JSON array
        res.write('[\n');

        let isFirstRecord = true;
        const recordsPerChunk = parseInt(req.query.chunkSize as string) || 3;
        let chunkBuffer: LogData[] = [];

        const readStream = fs.createReadStream(LOG_FILE_PATH)
            .pipe(csvParser())
            .on('data', (data) => {
                console.log(`Received data event from read stream`);
                // if record's request id equals supplied request id add it to the chunk buffer
                if(data.requestId === requestId) {
                    chunkBuffer.push(data);
                }

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
    }
}