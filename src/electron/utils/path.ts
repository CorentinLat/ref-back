import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import winston from 'winston';

export const downloadPath = app.getPath('downloads');
export const userDataPath = app.getPath('userData');
export const logsPath = path.join(userDataPath, 'logs');
export const workPath = path.join(userDataPath, 'work');

const MANDATORY_FOLDERS = [logsPath, workPath];

export function checkMandatoryFolderExists(logger: winston.Logger) {
    MANDATORY_FOLDERS.forEach(folder => {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
            logger.info(`Mandatory folder created: ${folder}`);
        }
    });
}

export function checkGameFolderExists(gameNumber: string, logger: winston.Logger) {
    const gameFolderPath = path.join(workPath, gameNumber);

    if (fs.existsSync(gameFolderPath)) {
        logger.info(`Game folder already exists: ${gameFolderPath}`);
        return true;
    } else {
        fs.mkdirSync(gameFolderPath, { recursive: true });
        logger.info(`Game folder created: ${gameFolderPath}`);
        return false;
    }
}
