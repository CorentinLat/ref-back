import IpcMain = Electron.IpcMain;
import IpcMainEvent = Electron.IpcMainEvent;

import logger from './utils/logger';
import {
    Action,
    NewAction,
    addNewActionToGame,
    createNewGameFile,
    editActionFromGame,
    getGame,
    removeActionFromGame,
} from './utils/game';
import { checkGameFolderExists, getExistingGameFolders } from './utils/path';
import { concatVideos, copyVideoToUserDataPath } from './utils/video';

export default function(ipcMain: IpcMain) {
    ipcMain.on('process_init_app_started', onInitAppStartedListener);
    ipcMain.on('process_videos_imported', onImportVideosListener);
    ipcMain.on('process_videos_load', onLoadGameListener);
    ipcMain.on('process_add_action', onAddActionListener);
    ipcMain.on('process_edit_action', onEditActionListener);
    ipcMain.on('process_remove_action', onRemoveActionListener);
}

const onInitAppStartedListener = async (event: IpcMainEvent) => {
    logger.debug('OnInitAppStartedListener');

    const gameNumbers = await getExistingGameFolders();

    event.reply('process_init_app_succeeded', gameNumbers);
};

type OnImportVideosListenerArgs = { force?: boolean; gameNumber: string; videoPaths: string[] };
const onImportVideosListener = async (event: IpcMainEvent, { force, gameNumber, videoPaths }: OnImportVideosListenerArgs) => {
    logger.debug('OnConcatVideosListener');

    if (!videoPaths.length) {
        logger.error('No video to handle');
        event.reply('process_videos_failed');
    }

    try {
        const alreadyExisting = checkGameFolderExists(gameNumber, force);
        if (alreadyExisting) {
            event.reply('process_videos_failed', { alreadyExisting: true });
            return;
        }

        let videoPath;
        if (videoPaths.length > 1) {
            videoPath = await concatVideos(gameNumber, videoPaths, event);
        } else {
            videoPath = await copyVideoToUserDataPath(gameNumber, videoPaths[0], event);
        }

        createNewGameFile(gameNumber, videoPath);

        event.reply('process_videos_succeeded', gameNumber);
    } catch (error) {
        logger.error(`error onConcatVideosListener: ${error}`);
        event.reply('process_videos_failed', error);
    }
};

type OnLoadGameListenerArgs = { gameNumber: string };
const onLoadGameListener = async (event: IpcMainEvent, { gameNumber }: OnLoadGameListenerArgs) => {
    logger.debug('OnLoadGameListener');

    const game = await getGame(gameNumber);
    if (game) {
        event.reply('process_videos_succeeded', game);
    } else {
        event.reply('process_videos_failed');
    }
};

type OnAddActionListenerArgs = { newAction: NewAction; gameNumber: string };
const onAddActionListener = (event: IpcMainEvent, { newAction, gameNumber }: OnAddActionListenerArgs) => {
    logger.debug('OnAddActionListener');

    const action = addNewActionToGame(gameNumber, newAction);
    if (action) {
        event.reply('process_add_action_succeeded', action);
    } else {
        event.reply('process_add_action_failed');
    }
};

type OnEditActionListenerArgs = { action: Action; gameNumber: string };
const onEditActionListener = (event: IpcMainEvent, { action, gameNumber }: OnEditActionListenerArgs) => {
    logger.debug('OnEditActionListener');

    const isEdited = editActionFromGame(gameNumber, action);
    if (isEdited) {
        event.reply('process_edit_action_succeeded');
    } else {
        event.reply('process_edit_action_failed');
    }
};

type OnRemoveActionListenerArgs = { actionId: string; gameNumber: string };
const onRemoveActionListener = (event: IpcMainEvent, { actionId, gameNumber }: OnRemoveActionListenerArgs) => {
    logger.debug('OnRemoveActionListener');

    const isRemoved = removeActionFromGame(gameNumber, actionId);
    if (isRemoved) {
        event.reply('process_remove_action_succeeded');
    } else {
        event.reply('process_remove_action_failed');
    }
};
