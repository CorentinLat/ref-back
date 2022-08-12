import IpcMain = Electron.IpcMain;
import IpcMainEvent = Electron.IpcMainEvent;

import logger from './utils/logger';
import { checkGameFolderExists } from './utils/path';
import { concatVideos, copyVideoToUserDataPath, getGameVideoPathByGameNumber } from './utils/video';

export default function(ipcMain: IpcMain) {
    ipcMain.on('process_videos_imported', onImportVideosListener);
    ipcMain.on('process_videos_load', onLoadGameListener);
}

type OnImportVideosListenerArgs = { force?: boolean; gameNumber: string; videoPaths: string[] };
const onImportVideosListener = async (event: IpcMainEvent, { force, gameNumber, videoPaths }: OnImportVideosListenerArgs) => {
    logger.debug('OnConcatVideosListener');

    if (!videoPaths.length) {
        logger.error('No video to handle');
        event.reply('process_videos_failed');
    }

    try {
        const alreadyExisting = checkGameFolderExists(gameNumber, logger, force);
        if (alreadyExisting) {
            event.reply('process_videos_failed', { alreadyExisting: true });
            return;
        }

        let matchVideoPath;
        if (videoPaths.length > 1) {
            matchVideoPath = await concatVideos(gameNumber, videoPaths, event);
        } else {
            matchVideoPath = await copyVideoToUserDataPath(gameNumber, videoPaths[0], event);
        }

        event.reply('process_videos_succeeded', matchVideoPath);
    } catch (error) {
        logger.error(`error onConcatVideosListener: ${error}`);
        event.reply('process_videos_failed', error);
    }
};

type OnLoadGameListenerArgs = { gameNumber: string };
const onLoadGameListener = async (event: IpcMainEvent, { gameNumber }: OnLoadGameListenerArgs) => {
    logger.debug('OnLoadGameListener');

    const gameFolderPath = await getGameVideoPathByGameNumber(gameNumber);
    if (gameFolderPath) {
        event.reply('process_videos_succeeded', gameFolderPath);
    } else {
        event.reply('process_videos_failed');
    }
};
