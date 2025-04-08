import { app } from 'electron';
import fs from 'fs';
import path from 'path';

import ffmpegElectron from 'ffmpeg-static-electron';
import ffprobeElectron from 'ffprobe-static-electron';

import { GameAlreadyExistsError } from '../domain/error/GameAlreadyExistsError';

import { getConfigGamesPath } from './config';
import logger from './logger';

const GAME_FILE = 'game.json';

export const assetsPath = path.join(__dirname, '..', '..', '..', 'assets');
export const downloadPath = app.getPath('downloads');
export const tempPath = app.getPath('temp');
export const userDataPath = app.getPath('userData');
export const logsPath = path.join(userDataPath, 'logs');
const workFolder = app.isPackaged ? 'work' : 'work-dev';
const workPath = path.join(userDataPath, workFolder);

export const configFilePath = path.join(workPath, 'config.json');
export const versionFilePath = path.join(workPath, 'version.json');

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

    const gamesPath = getGamesPath();
    if (gamesPath !== workPath) {
        if (!fs.existsSync(gamesPath)) {
            fs.mkdirSync(gamesPath, { recursive: true });
            logger.info(`Games folder created: ${gamesPath}`);
        }
    }
}

export function throwIfGameFolderExists(gameNumber: string, force?: boolean) {
    const gameFolderPath = getGamePath(gameNumber);

    if (fs.existsSync(gameFolderPath)) {
        if (!force) {
            logger.info(`Game folder already exists: ${gameFolderPath}`);
            throw new GameAlreadyExistsError();
        }

        removeGameFolder(gameFolderPath);
    }
}

export function createGameFolder(gameNumber: string): void {
    const gameFolderPath = getGamePath(gameNumber);

    fs.mkdirSync(gameFolderPath, { recursive: true });
    logger.info(`Game folder created: ${gameFolderPath}`);
}

export function removeGameFolder(gameFolderPath: string): void {
    if (fs.existsSync(gameFolderPath)) {
        fs.rmSync(gameFolderPath, { recursive: true });
        logger.info(`Game folder removed: ${gameFolderPath}`);
    }
}

export async function getExistingGameFolders(): Promise<string[]> {
    const gameFolders = await new Promise<string[]>(resolve => {
        fs.readdir(getGamesPath(), (_, files) => {
            const filteredFiles = files.filter(file => file.endsWith('RCT'));
            resolve(filteredFiles);
        });
    });

    if (gameFolders.length) {
        logger.info(`Game folders existing: ${gameFolders.join(' / ')}`);
    }
    return gameFolders;
}

export const getGameFile = (gameNumber: string): string => path.join(getGamePath(gameNumber), GAME_FILE);
export const getGamePath = (gameNumber: string): string => path.join(getGamesPath(), gameNumber);

export const getGamesPath = (): string => {
    const configGamesPath = getConfigGamesPath();

    return configGamesPath ? path.join(configGamesPath, workFolder) : workPath;
};
