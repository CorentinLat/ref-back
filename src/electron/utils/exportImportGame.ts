import fs from 'fs';
import { join } from 'path';
import yazl from 'yazl';
import yauzl from 'yauzl';

import { Game, GameToExport } from '../../../type/refBack';

import { extractFileExtension, removeFile } from './file';
import logger from './logger';
import { tempPath } from './path';

const GAME_INFORMATION_FILENAME = 'gameInformation.json';
const GAME_VIDEO_FILENAME = 'gameVideo';

export const exportGame = async (game: Game, path: string, withVideo: boolean): Promise<boolean> => {
    const { information: { videoPath, ...informationRest } } = game;
    const gameToExport: GameToExport = { ...game, information: { ...informationRest } };

    try {
        const gameInformationPath = join(tempPath, GAME_INFORMATION_FILENAME);
        fs.writeFileSync(gameInformationPath, JSON.stringify(gameToExport));

        const zipFile = new yazl.ZipFile();
        zipFile.addFile(gameInformationPath, GAME_INFORMATION_FILENAME);

        if (withVideo) {
            const gameVideoExtension = extractFileExtension(videoPath);
            const gameVideoPathInArchive = `${GAME_VIDEO_FILENAME}.${gameVideoExtension}`;
            zipFile.addFile(videoPath, gameVideoPathInArchive);
        }

        await new Promise<void>((resolve, reject) => {
            zipFile.outputStream
                .pipe(fs.createWriteStream(path))
                .on('data', e => logger.info(`exportGame: ${e}`))
                .on('error', error => {
                    logger.error(`error exportGame: ${error}`);
                    reject();
                })
                .on('close', () => resolve());
            zipFile.end();
        });

        removeFile(gameInformationPath);

        return true;
    } catch (error) {
        logger.error(`error exportGame: ${error}`);
        return false;
    }
};

type VerifiedGameImport = { gameNumber: string; gameTitle: string; hasVideo: boolean };
export const verifyGameImport = async (gameExportPath: string): Promise<VerifiedGameImport> =>
    new Promise<VerifiedGameImport>((resolve, reject) => {
        yauzl.open(gameExportPath, { lazyEntries: true }, (openError, zipFile) => {
            if (openError) {
                logger.error(`error verifyGameImport: ${openError}`);
                return reject();
            }

            zipFile.on('error', error => {
                logger.error(`error verifyGameImport: ${error}`);
                return reject();
            });

            const entryCount = zipFile.entryCount;
            let gameNumber: string|null = null;
            let gameTitle: string|null = null;
            let hasVideo = false;
            zipFile.on('entry', async entry => {
                if (entry.fileName === GAME_INFORMATION_FILENAME) {
                    await new Promise<void>(resolveRead => {
                        zipFile.openReadStream(entry, (readError, readStream) => {
                            if (readError) {
                                logger.error(`error verifyGameImport: ${readError}`);
                                return reject();
                            }

                            let data = '';
                            readStream.on('data', chunk => data += chunk.toString());

                            readStream.on('error', error => {
                                logger.error(`error verifyGameImport: ${error}`);
                                return reject();
                            });

                            readStream.on('end', () => {
                                const gameInformation: GameToExport = JSON.parse(data);

                                gameNumber = gameInformation.information.gameNumber;
                                gameTitle = `${gameInformation.information.teams.local} - ${gameInformation.information.teams.visitor}`;

                                resolveRead();
                            });
                        });
                    });
                } else if (entry.fileName.startsWith(GAME_VIDEO_FILENAME)) {
                    hasVideo = true;
                }

                if (zipFile.entriesRead < entryCount) {
                    zipFile.readEntry();
                } else {
                    if (gameNumber && gameTitle) {
                        resolve({ gameNumber, gameTitle, hasVideo });
                    } else {
                        reject();
                    }
                }
            });

            zipFile.readEntry();
        });
    });
