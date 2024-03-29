import { app, shell } from 'electron';
import IpcMain = Electron.IpcMain;
import IpcMainEvent = Electron.IpcMainEvent;

import { askSaveDirectory, askSaveVideoPath } from './utils/dialog';
import {
    Action,
    NewAction,
    NewGameInformation,
    addNewActionToGame,
    createNewGameFile,
    editActionFromGame,
    getGame,
    getGamesInformation,
    removeActionFromGame,
    removeGame,
    updateGameComment,
} from './utils/game';
import logger from './utils/logger';
import { checkGameFolderExists, getExistingGameFolders } from './utils/path';
import { generatePdfSummary } from './utils/pdf';
import hasEnoughRemainingSpaceForFilePaths from './utils/storage';
import {
    cancelCurrentVideoCommands,
    concatVideos,
    copyGameVideoToPath,
    copyVideoToUserDataPath,
    downloadAllVideosGame,
    generateGameClips,
} from './utils/video';

export default function(ipcMain: IpcMain) {
    ipcMain.on('init_app', onInitAppListener);
    ipcMain.on('create_new_game', onCreateNewGameListener);
    ipcMain.on('cancel_video_process', onCancelVideoProcessListener);
    ipcMain.on('get_game', onGetGameListener);
    ipcMain.on('update_game_comment', onUpdateGameCommentListener);
    ipcMain.on('remove_game', onRemoveGameListener);
    ipcMain.on('add_action', onAddActionListener);
    ipcMain.on('edit_action', onEditActionListener);
    ipcMain.on('remove_action', onRemoveActionListener);
    ipcMain.on('download_video_game', onDownloadVideoGameListener);
    ipcMain.on('download_video_clips', onDownloadVideoClipsListener);
    ipcMain.on('download_all_videos', onDownloadAllVideosListener);
    ipcMain.on('download_pdf_summary', onDownloadPdfSummaryListener);
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
        logger.error('error OnCreateNewGameListener: No video to handle');
        event.reply('create_new_game_failed');
        return;
    }

    const { gameNumber } = gameInformation;
    try {
        const hasEnoughSpace = await hasEnoughRemainingSpaceForFilePaths(videoPaths);
        if (!hasEnoughSpace) {
            logger.error('error OnCreateNewGameListener: Not enough space');
            event.reply('create_new_game_failed', { notEnoughSpace: true });
            return;
        }

        const alreadyExisting = checkGameFolderExists(gameNumber, force);
        if (alreadyExisting) {
            logger.error('error OnCreateNewGameListener: Game already existing');
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
    } catch (error: any) {
        removeGame(gameNumber);

        if (error.cancelled) {
            logger.info('error OnCreateNewGameListener: Create new game cancelled');
            event.reply('create_new_game_failed', { cancelled: true });
            return;
        }

        logger.error(`error OnCreateNewGameListener: ${error}`);
        event.reply('create_new_game_failed', error);
    }
};

const onCancelVideoProcessListener = async () => {
    logger.debug('OnCancelVideoProcessListener');

    cancelCurrentVideoCommands();
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

type OnUpdateGameCommentListenerArgs = { gameNumber: string; comment: string; key: 'gameDescription'|'globalPerformance' };
const onUpdateGameCommentListener = (event: IpcMainEvent, { gameNumber, comment, key }: OnUpdateGameCommentListenerArgs) => {
    logger.debug('OnUpdateGameCommentListener');

    const isUpdated = updateGameComment(gameNumber, comment, key);
    if (isUpdated) {
        event.reply('update_game_comment_succeeded');
    } else {
        event.reply('update_game_comment_failed');
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

type OnEditActionListenerArgs = { actionToEdit: Action; gameNumber: string };
const onEditActionListener = (event: IpcMainEvent, { actionToEdit, gameNumber }: OnEditActionListenerArgs) => {
    logger.debug('OnEditActionListener');

    const action = editActionFromGame(gameNumber, actionToEdit);
    if (action) {
        event.reply('edit_action_succeeded', action);
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

type OnDownloadVideoClipsListenerArgs = { gameNumber: string };
const onDownloadVideoClipsListener = async (event: IpcMainEvent, { gameNumber }: OnDownloadVideoClipsListenerArgs) => {
    logger.debug('OnDownloadVideoClipsListener');

    const game = getGame(gameNumber);
    if (!game) {
        logger.debug('Game not found.');
        event.reply('download_video_clips_failed');
        return;
    }

    const saveDirectory = askSaveDirectory();
    logger.debug(`Clips save directory : ${saveDirectory}`);
    if (!saveDirectory) {
        logger.debug('Download clips game closed');
        event.reply('download_video_clips_failed', { closed: true });
        return;
    }

    try {
        await generateGameClips(game, saveDirectory, event);
        event.reply('download_video_clips_succeeded');
    } catch (error: any) {
        if (error.cancelled) {
            logger.info('error OnDownloadVideoClipsListener: Create clips cancelled');
            event.reply('download_video_clips_failed', { cancelled: true });
            return;
        }

        logger.error(`error OnDownloadVideoClipsListener: ${error}`);
        event.reply('download_video_clips_failed', error);
    }
};

type OnDownloadAllVideosListenerArgs = { gameNumber: string };
const onDownloadAllVideosListener = async (event: IpcMainEvent, { gameNumber }: OnDownloadAllVideosListenerArgs) => {
    logger.debug('OnDownloadAllVideosListener');

    const game = getGame(gameNumber);
    if (!game) {
        logger.debug('Game not found.');
        event.reply('download_all_videos_failed');
        return;
    }

    const saveDirectory = askSaveDirectory();
    logger.debug(`All videos save directory : ${saveDirectory}`);
    if (!saveDirectory) {
        logger.debug('Download all videos closed');
        event.reply('download_all_videos_failed', { closed: true });
        return;
    }

    try {
        await downloadAllVideosGame(game, saveDirectory, event);
        event.reply('download_all_videos_succeeded');
    } catch (error: any) {
        if (error.cancelled) {
            logger.info('error OnDownloadAllVideosListener: Create clips cancelled');
            event.reply('download_all_videos_failed', { cancelled: true });
            return;
        }

        logger.error(`error OnDownloadAllVideosListener: ${error}`);
        event.reply('download_all_videos_failed', error);
    }
};

type DownloadSummaryListenerArgs = { gameNumber: string };
const onDownloadPdfSummaryListener = async (event: IpcMainEvent, { gameNumber }: DownloadSummaryListenerArgs) => {
    logger.debug('OnDownloadPdfSummaryListener');

    const game = getGame(gameNumber);
    if (!game) {
        logger.debug('Game not found.');
        event.reply('download_pdf_summary_failed');
        return;
    }

    const saveDirectory = askSaveDirectory();
    logger.debug(`Summary save directory : ${saveDirectory}`);
    if (!saveDirectory) {
        logger.debug('Download PDF summary closed');
        event.reply('download_pdf_summary_failed', { closed: true });
        return;
    }

    try {
        generatePdfSummary(game, saveDirectory);
        event.reply('download_pdf_summary_succeeded');
    } catch (error) {
        logger.error(`Error on download pdf summary: ${error}`);
        event.reply('download_pdf_summary_failed');
    }
};

type OnOpenUrlInBrowserListenerArgs = { url: string };
const onOpenUrlInBrowserListener = (event: IpcMainEvent, { url }: OnOpenUrlInBrowserListenerArgs) => {
    logger.debug('OnOpenUrlInBrowserListener');

    shell
        .openExternal(url)
        .then(() => event.reply('open_url_in_browser_succeeded'))
        .catch(() => event.reply('open_url_in_browser_failed'));
};
