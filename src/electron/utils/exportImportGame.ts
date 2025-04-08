import fs from 'fs';
import { join } from 'path';
import yazl from 'yazl';
import yauzl from 'yauzl';

import { Action, Annotation, Game, GameToExport, ImportGameCommandArgs } from '../../../type/refBack';

import { extractFileExtension, removeFile } from './file';
import { addNewAnnotationsToGame, createGameFromImport } from './game';
import logger from './logger';
import { tempPath } from './path';
import { generateNewVideoPath } from './video';

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

export const importGame = async (gameExportPath: string, args: ImportGameCommandArgs): Promise<boolean> => {
    const { isCreatingNewGame, isOverriding, gameNumberToUse } = args;

    try {
        if (isCreatingNewGame) {
            const { game, extension } = await getInformationFromExportedGame(gameExportPath);
            const gameNumberToCreate = gameNumberToUse || game?.information?.gameNumber;

            if (!gameNumberToCreate) {
                logger.error('importGame: gameNumberToCreate is not defined');
                return false;
            }

            const videoPath = generateNewVideoPath(gameNumberToCreate, extension);
            const isCreated = createGameFromImport({
                ...game,
                information: { ...game.information, gameNumber: gameNumberToCreate, videoPath }
            }, isOverriding);

            if (!isCreated) {
                logger.error('importGame: error creating new game');
                return false;
            }

            const isVideoUnzipped = await unzipVideo(gameExportPath, videoPath);
            if (!isVideoUnzipped) {
                logger.error('importGame: error unzipping video');
                return false;
            }

            return true;
        } else {
            if (!gameNumberToUse) {
                logger.error('importGame: gameNumberToUse is not defined');
                return false;
            }

            const annotations = await getAnnotationsInExportedGame(gameExportPath);
            return addNewAnnotationsToGame(gameNumberToUse, annotations, isOverriding);
        }
    } catch (error) {
        logger.error(`error importGame: ${error}`);
        return false;
    }
};

const getInformationFromExportedGame = async (gameExportPath: string): Promise<{ game: GameToExport; extension: string }> =>
    new Promise<{ game: GameToExport; extension: string }>((resolve, reject) =>
        yauzl.open(gameExportPath, { lazyEntries: true }, (openError, zipFile) => {
            if (openError) {
                logger.error(`error getInformationFromExportedGame: ${openError}`);
                return reject();
            }

            zipFile.on('error', error => {
                logger.error(`error getInformationFromExportedGame: ${error}`);
                return reject();
            });

            const entryCount = zipFile.entryCount;
            let game: GameToExport|null = null;
            let extension = '';
            zipFile.on('entry', async entry => {
                if (entry.fileName === GAME_INFORMATION_FILENAME) {
                    game = await new Promise<GameToExport>(resolveRead => {
                        zipFile.openReadStream(entry, (readError, readStream) => {
                            if (readError) {
                                logger.error(`error getInformationFromExportedGame: ${readError}`);
                                return reject();
                            }

                            let data = '';
                            readStream.on('data', chunk => data += chunk.toString());

                            readStream.on('error', error => {
                                logger.error(`error getInformationFromExportedGame: ${error}`);
                                return reject();
                            });

                            readStream.on('end', () => {
                                const gameInformation: GameToExport = JSON.parse(data);
                                resolveRead(gameInformation);
                            });
                        });
                    });
                } else if (entry.fileName.startsWith(GAME_VIDEO_FILENAME)) {
                    extension = extractFileExtension(entry.fileName);
                }

                if (zipFile.entriesRead < entryCount) {
                    zipFile.readEntry();
                } else {
                    if (game && extension) {
                        resolve({ game, extension });
                    } else {
                        reject();
                    }
                }
            });

            zipFile.readEntry();
        })
    );

const unzipVideo = async (gameExportPath: string, videoPath: string): Promise<boolean> =>
    new Promise<boolean>((resolve, reject) =>
        yauzl.open(gameExportPath, { lazyEntries: true }, (openError, zipFile) => {
            if (openError) {
                logger.error(`error unzipVideo: ${openError}`);
                return reject();
            }

            zipFile.on('error', error => {
                logger.error(`error unzipVideo: ${error}`);
                return reject();
            });

            const entryCount = zipFile.entryCount;
            zipFile.on('entry', async entry => {
                if (entry.fileName.startsWith(GAME_VIDEO_FILENAME)) {
                    await new Promise<void>(resolveRead => {
                        zipFile.openReadStream(entry, (readError, readStream) => {
                            if (readError) {
                                logger.error(`error unzipVideo: ${readError}`);
                                return reject();
                            }

                            readStream.pipe(fs.createWriteStream(videoPath))
                                .on('error', error => {
                                    logger.error(`error unzipVideo: ${error}`);
                                    return reject();
                                })
                                .on('finish', () => resolveRead());
                        });
                    });
                }

                if (zipFile.entriesRead < entryCount) {
                    zipFile.readEntry();
                } else {
                    resolve(true);
                }
            });

            zipFile.readEntry();
        })
    );

const getAnnotationsInExportedGame = async (gameExportPath: string): Promise<(Action|Annotation)[]> =>
    new Promise<(Action|Annotation)[]>((resolve, reject) =>
        yauzl.open(gameExportPath, { lazyEntries: true }, (openError, zipFile) => {
            if (openError) {
                logger.error(`error getAnnotationsInExportedGame: ${openError}`);
                return reject();
            }

            zipFile.on('error', error => {
                logger.error(`error getAnnotationsInExportedGame: ${error}`);
                return reject();
            });

            const entryCount = zipFile.entryCount;
            zipFile.on('entry', async entry => {
                if (entry.fileName === GAME_INFORMATION_FILENAME) {
                    const annotations = await new Promise<(Action|Annotation)[]>(resolveRead => {
                        zipFile.openReadStream(entry, (readError, readStream) => {
                            if (readError) {
                                logger.error(`error getAnnotationsInExportedGame: ${readError}`);
                                return reject();
                            }

                            let data = '';
                            readStream.on('data', chunk => data += chunk.toString());

                            readStream.on('error', error => {
                                logger.error(`error getAnnotationsInExportedGame: ${error}`);
                                return reject();
                            });

                            readStream.on('end', () => {
                                const gameInformation: GameToExport = JSON.parse(data);
                                resolveRead(gameInformation.actions);
                            });
                        });
                    });

                    resolve(annotations);
                }

                if (zipFile.entriesRead < entryCount) {
                    zipFile.readEntry();
                } else {
                    reject();
                }
            });

            zipFile.readEntry();
        })
    );
