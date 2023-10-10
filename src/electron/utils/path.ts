import { app } from 'electron';
import fs from 'fs';
import path from 'path';

import ffmpegElectron from 'ffmpeg-static-electron';
import ffprobeElectron from 'ffprobe-static-electron';

import logger from './logger';

export const downloadPath = app.getPath('downloads');
export const userDataPath = app.getPath('userData');
export const logsPath = path.join(userDataPath, 'logs');
export const workPath = path.join(userDataPath, app.isPackaged ? 'work' : 'work-dev');

export const ffmpegElectronPath = app.isPackaged
    ? ffmpegElectron.path.replace('app.asar', 'app.asar.unpacked')
    : ffmpegElectron.path;
export const ffprobeElectronPath = app.isPackaged
    ? ffprobeElectron.path.replace('app.asar', 'app.asar.unpacked')
    : ffprobeElectron.path;

const MANDATORY_FOLDERS = [logsPath, workPath];

export function checkMandatoryFolderExists() {
    MANDATORY_FOLDERS.forEach(folder => {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
            logger.info(`Mandatory folder created: ${folder}`);
        }
    });
}

export function checkGameFolderExists(gameNumber: string, force?: boolean) {
    const gameFolderPath = path.join(workPath, gameNumber);

    if (fs.existsSync(gameFolderPath)) {
        if (!force) {
            logger.info(`Game folder already exists: ${gameFolderPath}`);
            return true;
        }

        removeGameFolder(gameFolderPath);
    }

    fs.mkdirSync(gameFolderPath, { recursive: true });
    logger.info(`Game folder created: ${gameFolderPath}`);
    return false;
}

export function removeGameFolder(gameFolderPath: string): void {
    if (fs.existsSync(gameFolderPath)) {
        fs.rmSync(gameFolderPath, { recursive: true });
        logger.info(`Game folder removed: ${gameFolderPath}`);
    }
}

export async function getExistingGameFolders(): Promise<string[]> {
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
