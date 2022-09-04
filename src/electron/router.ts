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
    ipcMain.on('get_existing_games', onInitAppListener);
    ipcMain.on('create_new_game', onCreateNewGameListener);
    ipcMain.on('get_game', onGetGameListener);
    ipcMain.on('add_action', onAddActionListener);
    ipcMain.on('edit_action', onEditActionListener);
    ipcMain.on('remove_action', onRemoveActionListener);
}

const onInitAppListener = async (event: IpcMainEvent) => {
    logger.debug('OnInitAppListener');

    const gameNumbers = await getExistingGameFolders();

    event.reply('get_existing_games_succeeded', gameNumbers);
};

type OnImportVideosListenerArgs = { force?: boolean; gameNumber: string; videoPaths: string[] };
const onCreateNewGameListener = async (event: IpcMainEvent, { force, gameNumber, videoPaths }: OnImportVideosListenerArgs) => {
    logger.debug('OnCreateNewGameListener');

    if (!videoPaths.length) {
        logger.error('No video to handle');
        event.reply('create_new_game_failed');
    }

    try {
        const alreadyExisting = checkGameFolderExists(gameNumber, force);
        if (alreadyExisting) {
            event.reply('create_new_game_failed', { alreadyExisting: true });
            return;
        }

        let videoPath;
        if (videoPaths.length > 1) {
            videoPath = await concatVideos(gameNumber, videoPaths, event);
        } else {
            videoPath = await copyVideoToUserDataPath(gameNumber, videoPaths[0], event);
        }

        createNewGameFile(gameNumber, videoPath);

        event.reply('create_new_game_succeeded', gameNumber);
    } catch (error) {
        logger.error(`error OnCreateNewGameListener: ${error}`);
        event.reply('create_new_game_failed', error);
    }
};

type OnLoadGameListenerArgs = { gameNumber: string };
const onGetGameListener = async (event: IpcMainEvent, { gameNumber }: OnLoadGameListenerArgs) => {
    logger.debug('OnGetGameListener');

    const game = await getGame(gameNumber);
    if (game) {
        event.reply('get_game_succeeded', game);
    } else {
        event.reply('get_game_failed');
    }
};

type OnAddActionListenerArgs = { newAction: NewAction; gameNumber: string };
const onAddActionListener = (event: IpcMainEvent, { newAction, gameNumber }: OnAddActionListenerArgs) => {
    logger.debug('OnAddActionListener');

    const action = addNewActionToGame(gameNumber, newAction);
    if (action) {
        event.reply('add_action_succeeded', action);
    } else {
        event.reply('add_action_failed');
    }
};

type OnEditActionListenerArgs = { action: Action; gameNumber: string };
const onEditActionListener = (event: IpcMainEvent, { action, gameNumber }: OnEditActionListenerArgs) => {
    logger.debug('OnEditActionListener');

    const isEdited = editActionFromGame(gameNumber, action);
    if (isEdited) {
        event.reply('edit_action_succeeded');
    } else {
        event.reply('edit_action_failed');
    }
};

type OnRemoveActionListenerArgs = { actionId: string; gameNumber: string };
const onRemoveActionListener = (event: IpcMainEvent, { actionId, gameNumber }: OnRemoveActionListenerArgs) => {
    logger.debug('OnRemoveActionListener');

    const isRemoved = removeActionFromGame(gameNumber, actionId);
    if (isRemoved) {
        event.reply('remove_action_succeeded');
    } else {
        event.reply('remove_action_failed');
    }
};
