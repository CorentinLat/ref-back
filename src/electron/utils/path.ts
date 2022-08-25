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

export function checkGameFolderExists(gameNumber: string, logger: winston.Logger, force?: boolean) {
    const gameFolderPath = path.join(workPath, gameNumber);

    if (fs.existsSync(gameFolderPath)) {
        if (!force) {
            logger.info(`Game folder already exists: ${gameFolderPath}`);
            return true;
        }

        fs.rmSync(gameFolderPath, { recursive: true });
        logger.info(`Game folder forced removed: ${gameFolderPath}`);
    }

    fs.mkdirSync(gameFolderPath, { recursive: true });
    logger.info(`Game folder created: ${gameFolderPath}`);
    return false;
}

export async function getExistingGameFolders(logger: winston.Logger): Promise<string[]> {
    const gameFolders = await new Promise<string[]>(resolve => {
        fs.readdir(workPath, (_, files) => {
            const filteredFiles = files.filter(file => file.endsWith('RCT'));
            resolve(filteredFiles);
        });
    });

    if (gameFolders.length) {
        logger.info(`Game folders existing: ${gameFolders.join(' / ')}`);
    }
    return gameFolders;
}
