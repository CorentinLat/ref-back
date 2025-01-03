import fs from 'fs';
import { join } from 'path';
import yazl from 'yazl';

import { Game, GameToExport } from '../../../type/refBack';

import { extractFileExtension, removeFile } from './file';
import logger from './logger';
import { tempPath } from './path';

const GAME_INFORMATION_FILENAME = 'gameInformation.json';
const GAME_VIDEO_FILENAME = 'gameVideo';

export const exportGame = async (game: Game, path: string, withVideo: boolean): Promise<boolean> => {
    const { information: { videoPath, ...informationRest} } = game;
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
