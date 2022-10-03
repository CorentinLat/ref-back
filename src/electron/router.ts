import { app, shell } from 'electron';
import IpcMain = Electron.IpcMain;
import IpcMainEvent = Electron.IpcMainEvent;

import { askSaveVideoPath } from './utils/dialog';
import {
    NewAction,
    NewGameInformation,
    addNewActionToGame,
    createNewGameFile,
    getGame,
    getGamesInformation,
    removeActionFromGame,
    removeGame,
} from './utils/game';
import logger from './utils/logger';
import { checkGameFolderExists, getExistingGameFolders } from './utils/path';
import { concatVideos, copyGameVideoToPath, copyVideoToUserDataPath } from './utils/video';

export default function(ipcMain: IpcMain) {
    ipcMain.on('init_app', onInitAppListener);
    ipcMain.on('create_new_game', onCreateNewGameListener);
    ipcMain.on('get_game', onGetGameListener);
    ipcMain.on('remove_game', onRemoveGameListener);
    ipcMain.on('add_action', onAddActionListener);
    ipcMain.on('remove_action', onRemoveActionListener);
    ipcMain.on('download_video_game', onDownloadVideoGameListener);
    ipcMain.on('open_url_in_browser', onOpenUrlInBrowserListener);
}

const onInitAppListener = async (event: IpcMainEvent) => {
    logger.debug('OnInitAppListener');

    const appVersion = app.getVersion();
    const gameNumbers = await getExistingGameFolders();
    const games = getGamesInformation(gameNumbers);

    event.reply('init_app_succeeded', { appVersion, games });
};

type OnCreateNewGameListenerArgs = { force?: boolean; gameInformation: NewGameInformation; videoPaths: string[] };
const onCreateNewGameListener = async (event: IpcMainEvent, { force, gameInformation, videoPaths }: OnCreateNewGameListenerArgs) => {
    logger.debug('OnCreateNewGameListener');

    if (!videoPaths.length) {
        logger.error('No video to handle');
        event.reply('create_new_game_failed');
    }

    try {
        const { gameNumber } = gameInformation;
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

        createNewGameFile({ ...gameInformation, videoPath });

        event.reply('create_new_game_succeeded', gameNumber);
    } catch (error) {
        logger.error(`error OnCreateNewGameListener: ${error}`);
        event.reply('create_new_game_failed', error);
    }
};

type OnGetGameListenerArgs = { gameNumber: string };
const onGetGameListener = (event: IpcMainEvent, { gameNumber }: OnGetGameListenerArgs) => {
    logger.debug('OnGetGameListener');

    const game = getGame(gameNumber);
    if (game) {
        event.reply('get_game_succeeded', game);
    } else {
        event.reply('get_game_failed');
    }
};

type OnRemoveGameListenerArgs = { gameNumber: string };
const onRemoveGameListener = (event: IpcMainEvent, { gameNumber }: OnRemoveGameListenerArgs) => {
    logger.debug('OnRemoveGameListener');

    const gameRemoved = removeGame(gameNumber);
    if (gameRemoved) {
        event.reply('remove_game_succeeded');
    } else {
        event.reply('remove_game_failed');
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

type OnDownloadVideoGameListenerArgs = { gameNumber: string };
const onDownloadVideoGameListener = (event: IpcMainEvent, { gameNumber }: OnDownloadVideoGameListenerArgs) => {
    logger.debug('OnDownloadVideoGameListener');

    const game = getGame(gameNumber);
    if (!game) {
        logger.debug('Game not found.');
        event.reply('download_video_game_failed');
        return;
    }

    const savePath = askSaveVideoPath(game);
    logger.debug(`Video save path : ${savePath}`);
    if (!savePath) {
        logger.debug('Download video game closed');
        event.reply('download_video_game_failed', { closed: true });
        return;
    }

    copyGameVideoToPath(game, savePath);
    event.reply('download_video_game_succeeded');
};

type OnOpenUrlInBrowserListenerArgs = { url: string };
const onOpenUrlInBrowserListener = (event: IpcMainEvent, { url }: OnOpenUrlInBrowserListenerArgs) => {
    logger.debug('OnOpenUrlInBrowserListener');

    shell
        .openExternal(url)
        .then(() => event.reply('open_url_in_browser_succeeded'))
        .catch(() => event.reply('open_url_in_browser_failed'));
};
