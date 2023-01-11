/**
 * Express server initialization.
 * Requires "multer" for parsing multipart/form-data
 * 
 * Configure in ./config at webserver entry
 */

import express, { Request, Response, NextFunction } from 'express';
import router from './routes';
import Config from './config/webserver';
import multer from 'multer';
import { DatabaseMigration } from './utils/database-migration';
import { EmblemCacheManager } from './utils/emblem-cache-manager';
import { appendFile } from 'fs/promises';

const upload = multer();
const app = express();

DatabaseMigration.init();
EmblemCacheManager.init();

/**
 * Parse multipart/form-data to routes
 */
app.use("/", upload.any(), (req: Request, res: Response, next: NextFunction) => {
    next();
})

/**
 * API routes
 */
app.use(router);

/**
 * Server setup and listening port
 */
app.listen(Config.server.port, () => {
    console.log(`Webserver running on port ${Config.server.port}`);
});

/**
 * Log any other uncaught exception
 */
process.on('uncaughtException', async (e) => {
    const date = new Date().toISOString();
    const data = `[${date}]\n${e}\n`;
    
    try {
        await appendFile("error.log", data);
        console.error("An error occured. Check error.log for details.");
    } catch (e) {
        console.error("An error occured. Log could not be saved: " + e);
    }
})