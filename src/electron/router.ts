import { app, shell } from 'electron';
import IpcMain = Electron.IpcMain;
import IpcMainEvent = Electron.IpcMainEvent;

import {
    Action,
    Annotation,
    extensionByExportType,
    ImportGameCommandArgs,
    NewAction,
    NewAnnotation,
    NewGameInformation,
    SummaryExportType,
} from '../../type/refBack';

import { getDecisionsForGames } from './utils/decision';
import { askOpenFile, askSaveDirectory, askSaveFile, askSaveVideoPath } from './utils/dialog';
import { exportGame, importGame, verifyGameImport } from './utils/exportImportGame';
import { extractFileExtension } from './utils/file';
import {
    addNewAnnotationToGame,
    createNewGameFile,
    editAnnotationFromGame,
    editGameVideoPath,
    getGame,
    getGamesInformation,
    removeAnnotationFromGame,
    removeGame,
    updateGameComment,
} from './utils/game';
import logger from './utils/logger';
import { throwIfGameFolderExists, getExistingGameFolders, createGameFolder } from './utils/path';
import { generateSummary } from './utils/summaryGenerator';
import {
    cancelCurrentVideoCommands,
    copyGameVideoToPath,
    createClipFromVideoGame,
    cutVideoGame,
    downloadAllVideosGame,
    generateGameClips,
    handleVideoImport,
} from './utils/video';

export default function(ipcMain: IpcMain) {
    ipcMain.on('init_app', onInitAppListener);
    ipcMain.on('create_new_game', onCreateNewGameListener);
    ipcMain.on('cancel_video_process', onCancelVideoProcessListener);
    ipcMain.on('get_game', onGetGameListener);
    ipcMain.on('update_game_comment', onUpdateGameCommentListener);
    ipcMain.on('remove_game', onRemoveGameListener);
    ipcMain.on('add_annotation', onAddAnnotationListener);
    ipcMain.on('edit_annotation', onEditAnnotationListener);
    ipcMain.on('remove_action', onRemoveActionListener);
    ipcMain.on('download_video_game', onDownloadVideoGameListener);
    ipcMain.on('download_video_clips', onDownloadVideoClipsListener);
    ipcMain.on('download_all_videos', onDownloadAllVideosListener);
    ipcMain.on('download_summary', onDownloadSummaryListener);
    ipcMain.on('open_url_in_browser', onOpenUrlInBrowserListener);
    ipcMain.on('get_decisions', onGetDecisionsListener);
    ipcMain.on('cut_video', onCutVideoListener);
    ipcMain.on('export_game', onExportGameListener);
    ipcMain.on('import_game_init', onImportGameInitListener);
    ipcMain.on('import_game', onImportGameListener);
}

const onInitAppListener = async (event: IpcMainEvent) => {
    logger.debug('OnInitAppListener');

    const appVersion = app.getVersion();
    const gameNumbers = await getExistingGameFolders();
    const games = getGamesInformation(gameNumbers);

    event.reply('init_app_succeeded', { appVersion, games });
};

type OnCreateNewGameListenerArgs = { force?: boolean; gameInformation: NewGameInformation };
const onCreateNewGameListener = async (event: IpcMainEvent, { force, gameInformation }: OnCreateNewGameListenerArgs) => {
    logger.debug('OnCreateNewGameListener');

    const { gameNumber } = gameInformation;
    try {
        throwIfGameFolderExists(gameNumber, force);
        createGameFolder(gameNumber);

        const videoPath = await handleVideoImport(gameInformation, event);
        const { video, ...rest } = gameInformation;
        createNewGameFile({ ...rest, videoPath });

        event.reply('create_new_game_succeeded', gameNumber);
    } catch (error: any) {
        if (error?.type === 'BaseError') {
            logger.error(`error OnCreateNewGameListener: ${error.message}`);
            event.reply('create_new_game_failed', error.body);
        } else {
            removeGame(gameNumber);

            logger.error(`error OnCreateNewGameListener: ${error}`);
            event.reply('create_new_game_failed', error);
        }
    }
};

const onCancelVideoProcessListener = (): Promise<void> => {
    logger.debug('OnCancelVideoProcessListener');

    return cancelCurrentVideoCommands();
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

type OnAddAnnotationListenerArgs = { annotationToCreate: NewAction|NewAnnotation; gameNumber: string };
const onAddAnnotationListener = (event: IpcMainEvent, { annotationToCreate, gameNumber }: OnAddAnnotationListenerArgs) => {
    logger.debug('OnAddAnnotationListener');

    const annotationAdded = addNewAnnotationToGame(gameNumber, annotationToCreate);
    if (annotationAdded) {
        event.reply('add_annotation_succeeded', annotationAdded);
    } else {
        event.reply('add_annotation_failed');
    }
};

type OnEditAnnotationListenerArgs = { annotationToEdit: Action|Annotation; gameNumber: string };
const onEditAnnotationListener = (event: IpcMainEvent, { annotationToEdit, gameNumber }: OnEditAnnotationListenerArgs) => {
    logger.debug('OnEditAnnotationListener');

    const annotationEdited = editAnnotationFromGame(gameNumber, annotationToEdit);
    if (annotationEdited) {
        event.reply('edit_annotation_succeeded', annotationEdited);
    } else {
        event.reply('edit_annotation_failed');
    }
};

type OnRemoveActionListenerArgs = { actionId: string; gameNumber: string };
const onRemoveActionListener = (event: IpcMainEvent, { actionId, gameNumber }: OnRemoveActionListenerArgs) => {
    logger.debug('OnRemoveActionListener');

    const isRemoved = removeAnnotationFromGame(gameNumber, actionId);
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
        if (error?.type === 'BaseError') {
            logger.error(`error OnCreateNewGameListener: ${error.message}`);
            event.reply('create_new_game_failed', error.body);
        } else {
            logger.error(`error OnDownloadVideoClipsListener: ${error}`);
            event.reply('download_video_clips_failed', error);
        }
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
        if (error?.type === 'BaseError') {
            logger.error(`error OnCreateNewGameListener: ${error.message}`);
            event.reply('create_new_game_failed', error.body);
        } else {
            logger.error(`error OnDownloadAllVideosListener: ${error}`);
            event.reply('download_all_videos_failed', error);
        }
    }
};

type DownloadSummaryListenerArgs = { exportType: SummaryExportType; gameNumber: string };
const onDownloadSummaryListener = async (event: IpcMainEvent, { exportType, gameNumber }: DownloadSummaryListenerArgs) => {
    logger.debug('OnDownloadSummaryListener');

    const game = getGame(gameNumber);
    if (!game) {
        logger.debug('Game not found.');
        event.reply('download_summary_failed');
        return;
    }

    const extension = extensionByExportType[exportType];
    const savePath = askSaveFile(gameNumber, extension);
    logger.debug(`Summary save path : ${savePath}`);
    if (!savePath) {
        logger.debug(`Download ${exportType.toUpperCase()} summary closed`);
        event.reply('download_summary_failed', { closed: true });
        return;
    }

    try {
        generateSummary(game, savePath, exportType);
        event.reply('download_summary_succeeded');
    } catch (error) {
        logger.error(`Error on download ${exportType} summary: ${error}`);
        event.reply('download_summary_failed');
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

const onGetDecisionsListener = async (event: IpcMainEvent) => {
    logger.debug('OnGetDecisionsListener');

    try {
        const gameNumbers = await getExistingGameFolders();
        const allDecisions = getDecisionsForGames(gameNumbers);

        event.reply('get_decisions_succeeded', allDecisions);
    } catch (error: any) {
        logger.error(`error onGetDecisionsListener: ${error}`);
        event.reply('get_decisions_failed');
    }
};

type OnCutVideoListenerArgs = { videoPath: string; cuts: number[][]; editGame: boolean };
const onCutVideoListener = async (event: IpcMainEvent, { videoPath, cuts, editGame }: OnCutVideoListenerArgs) => {
    logger.debug('OnCutVideoListener');

    if (
        !cuts.length
        || cuts.some(([begin, end]) => begin >= end)
        || cuts.some(([begin]) => begin < 0)
        || cuts.some(times => times.length !== 2)
    ) {
        logger.debug('No cuts to apply');
        event.reply('cut_video_failed');
        return;
    }

    try {
        if (editGame) {
            const newVideoPath = await cutVideoGame(event, videoPath, cuts);
            editGameVideoPath(newVideoPath);

            event.reply('cut_video_succeeded', newVideoPath);
        } else {
            const savePath = askSaveFile('Clip', extractFileExtension(videoPath));

            if (!savePath) {
                logger.debug('Cut video save path closed');
                event.reply('cut_video_failed', { closed: true });
                return;
            }

            await createClipFromVideoGame(event, videoPath, cuts[0][0], cuts[0][1], savePath);
            event.reply('cut_video_succeeded', savePath);
        }
    } catch (error: any) {
        if (error?.type === 'BaseError') {
            logger.error(`error onCutVideoListener: ${error.message}`);
            event.reply('cut_video_failed', error.body);
        } else {
            logger.error(`error onCutVideoListener: ${error}`);
            event.reply('cut_video_failed');
        }
    }
};

type OnExportGameListenerArgs = { gameNumber: string; withVideo: boolean };
const onExportGameListener = async (event: IpcMainEvent, { gameNumber, withVideo }: OnExportGameListenerArgs)=> {
    logger.debug('OnExportGameListener');

    const game = getGame(gameNumber);
    if (!game) {
        logger.debug('Game not found.');
        event.reply('export_game_failed');
        return;
    }

    const savePath = askSaveFile(gameNumber, 'ref');
    logger.debug(`Export save path : ${savePath}`);
    if (!savePath) {
        logger.debug(`Export game ${gameNumber} closed`);
        event.reply('export_game_failed', { closed: true });
        return;
    }

    const isExported = await exportGame(game, savePath, withVideo);
    if (isExported) {
        event.reply('export_game_succeeded');
    } else {
        event.reply('export_game_failed');
    }
};

let lastGameExportedPathOpened: string|null = null;
const onImportGameInitListener = async (event: IpcMainEvent)=> {
    logger.debug('OnImportGameInitListener');

    const gameExportedPath = askOpenFile([{ name: 'RefBack Game Export', extensions: ['ref'] }]);
    logger.debug(`Game path : ${gameExportedPath}`);
    if (!gameExportedPath) {
        logger.debug(`Select game closed`);
        event.reply('import_game_init_failed', { closed: true });
        return;
    }

    const verifiedGameImport = await verifyGameImport(gameExportedPath);
    if (verifiedGameImport) {
        let gameNumberAlreadyExists = false;
        try {
            throwIfGameFolderExists(verifiedGameImport.gameNumber);
        } catch (_) {
            gameNumberAlreadyExists = true;
        }

        const gameNumbers = await getExistingGameFolders();
        const hasOtherGames = gameNumbers.length > 0;

        lastGameExportedPathOpened = gameExportedPath;
        event.reply('import_game_init_succeeded', {
            gameTitle: verifiedGameImport.gameTitle,
            hasVideo: verifiedGameImport.hasVideo,
            gameNumberAlreadyExists,
            hasOtherGames,
        });
    } else {
        event.reply('import_game_init_failed');
    }
};

const onImportGameListener = async (event: IpcMainEvent, args: ImportGameCommandArgs)=> {
    logger.debug('OnImportGameListener');

    if (!lastGameExportedPathOpened) {
        logger.error('No game path to import');
        event.reply('import_game_failed');
        return;
    }

    const isImported = await importGame(lastGameExportedPathOpened, args);
    if (isImported) {
        event.reply('import_game_succeeded');
    } else {
        event.reply('import_game_failed');
    }
};
