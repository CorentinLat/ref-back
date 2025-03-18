import { app, shell, IpcMain, IpcMainEvent } from 'electron';

import {
    Action,
    AllEditableGameComment,
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
import { checkNewVersionInstalled } from './utils/version';
import {
    cancelCurrentVideoCommands,
    copyGameVideoToPath,
    createClipFromVideoGame,
    cutVideoGame,
    downloadAllVideosGame,
    generateGameClips,
    handleVideoImport,
} from './utils/video';

type OnCreateNewGameListenerArgs = { force?: boolean; gameInformation: NewGameInformation };
type OnGetGameListenerArgs = { gameNumber: string };
type OnUpdateGameCommentListenerArgs = { gameNumber: string; comment: string; key: AllEditableGameComment };
type OnRemoveGameListenerArgs = { gameNumber: string };
type OnAddAnnotationListenerArgs = { annotationToCreate: NewAction|NewAnnotation; gameNumber: string };
type OnEditAnnotationListenerArgs = { annotationToEdit: Action|Annotation; gameNumber: string };
type OnRemoveActionListenerArgs = { actionId: string; gameNumber: string };
type OnDownloadVideoGameListenerArgs = { gameNumber: string };
type OnDownloadVideoClipsListenerArgs = { gameNumber: string };
type OnDownloadAllVideosListenerArgs = { gameNumber: string };
type DownloadSummaryListenerArgs = { exportType: SummaryExportType; gameNumber: string };
type OnOpenUrlInBrowserListenerArgs = { url: string };
type OnCutVideoListenerArgs = { videoPath: string; cuts: number[][]; editGame: boolean };
type OnExportGameListenerArgs = { gameNumber: string; withVideo: boolean };

export default class Router {
    private isFirstLaunch = true;

    private exportedGamePathAtOpen: string|null = null;
    private lastGameExportedPathOpened: string|null = null;

    constructor(private readonly ipcMain: IpcMain) {
        this.initRouter();
    }

    private initRouter = () => {
        this.ipcMain.on('init_app', this.onInitAppListener);
        this.ipcMain.on('create_new_game', this.onCreateNewGameListener);
        this.ipcMain.on('cancel_video_process', this.onCancelVideoProcessListener);
        this.ipcMain.on('get_game', this.onGetGameListener);
        this.ipcMain.on('update_game_comment', this.onUpdateGameCommentListener);
        this.ipcMain.on('remove_game', this.onRemoveGameListener);
        this.ipcMain.on('add_annotation', this.onAddAnnotationListener);
        this.ipcMain.on('edit_annotation', this.onEditAnnotationListener);
        this.ipcMain.on('remove_action', this.onRemoveActionListener);
        this.ipcMain.on('download_video_game', this.onDownloadVideoGameListener);
        this.ipcMain.on('download_video_clips', this.onDownloadVideoClipsListener);
        this.ipcMain.on('download_all_videos', this.onDownloadAllVideosListener);
        this.ipcMain.on('download_summary', this.onDownloadSummaryListener);
        this.ipcMain.on('open_url_in_browser', this.onOpenUrlInBrowserListener);
        this.ipcMain.on('get_decisions', this.onGetDecisionsListener);
        this.ipcMain.on('cut_video', this.onCutVideoListener);
        this.ipcMain.on('export_game', this.onExportGameListener);
        this.ipcMain.on('import_game_init', this.onImportGameInitListener);
        this.ipcMain.on('import_game', this.onImportGameListener);
    };

    private onInitAppListener = async (event: IpcMainEvent) => {
        logger.debug('OnInitAppListener');

        const appVersion = app.getVersion();

        const gameNumbers = await getExistingGameFolders();
        const games = getGamesInformation(gameNumbers);

        let isOpenedFromExportedGame = false;
        if (this.isFirstLaunch) {
            this.exportedGamePathAtOpen = process.argv.reduce<string|null>(
                (path, arg) => !path && arg.endsWith('.ref') ? arg : path,
                null
            );

            isOpenedFromExportedGame = !!this.exportedGamePathAtOpen;
            this.isFirstLaunch = false;
        }

        setTimeout(checkNewVersionInstalled, 2000);

        event.reply('init_app_succeeded', { appVersion, games, isOpenedFromExportedGame });
    };

    private onCreateNewGameListener = async (event: IpcMainEvent, { force, gameInformation }: OnCreateNewGameListenerArgs) => {
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

    private onCancelVideoProcessListener = (): Promise<void> => {
        logger.debug('OnCancelVideoProcessListener');

        return cancelCurrentVideoCommands();
    };

    private onGetGameListener = (event: IpcMainEvent, { gameNumber }: OnGetGameListenerArgs) => {
        logger.debug('OnGetGameListener');

        const game = getGame(gameNumber);
        if (game) {
            event.reply('get_game_succeeded', game);
        } else {
            event.reply('get_game_failed');
        }
    };

    private onUpdateGameCommentListener = (event: IpcMainEvent, { gameNumber, comment, key }: OnUpdateGameCommentListenerArgs) => {
        logger.debug('OnUpdateGameCommentListener');

        const isUpdated = updateGameComment(gameNumber, comment, key);
        if (isUpdated) {
            event.reply('update_game_comment_succeeded');
        } else {
            event.reply('update_game_comment_failed');
        }
    };

    private onRemoveGameListener = (event: IpcMainEvent, { gameNumber }: OnRemoveGameListenerArgs) => {
        logger.debug('OnRemoveGameListener');

        const gameRemoved = removeGame(gameNumber);
        if (gameRemoved) {
            event.reply('remove_game_succeeded');
        } else {
            event.reply('remove_game_failed');
        }
    };

    private onAddAnnotationListener = (event: IpcMainEvent, { annotationToCreate, gameNumber }: OnAddAnnotationListenerArgs) => {
        logger.debug('OnAddAnnotationListener');

        const annotationAdded = addNewAnnotationToGame(gameNumber, annotationToCreate);
        if (annotationAdded) {
            event.reply('add_annotation_succeeded', annotationAdded);
        } else {
            event.reply('add_annotation_failed');
        }
    };

    private onEditAnnotationListener = (event: IpcMainEvent, { annotationToEdit, gameNumber }: OnEditAnnotationListenerArgs) => {
        logger.debug('OnEditAnnotationListener');

        const annotationEdited = editAnnotationFromGame(gameNumber, annotationToEdit);
        if (annotationEdited) {
            event.reply('edit_annotation_succeeded', annotationEdited);
        } else {
            event.reply('edit_annotation_failed');
        }
    };

    private onRemoveActionListener = (event: IpcMainEvent, { actionId, gameNumber }: OnRemoveActionListenerArgs) => {
        logger.debug('OnRemoveActionListener');

        const isRemoved = removeAnnotationFromGame(gameNumber, actionId);
        if (isRemoved) {
            event.reply('remove_action_succeeded');
        } else {
            event.reply('remove_action_failed');
        }
    };

    private onDownloadVideoGameListener = (event: IpcMainEvent, { gameNumber }: OnDownloadVideoGameListenerArgs) => {
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

    private onDownloadVideoClipsListener = async (event: IpcMainEvent, { gameNumber }: OnDownloadVideoClipsListenerArgs) => {
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

    private onDownloadAllVideosListener = async (event: IpcMainEvent, { gameNumber }: OnDownloadAllVideosListenerArgs) => {
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

    private onDownloadSummaryListener = (event: IpcMainEvent, { exportType, gameNumber }: DownloadSummaryListenerArgs) => {
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

    private onOpenUrlInBrowserListener = (event: IpcMainEvent, { url }: OnOpenUrlInBrowserListenerArgs) => {
        logger.debug('OnOpenUrlInBrowserListener');

        shell
            .openExternal(url)
            .then(() => event.reply('open_url_in_browser_succeeded'))
            .catch(() => event.reply('open_url_in_browser_failed'));
    };

    private onGetDecisionsListener = async (event: IpcMainEvent) => {
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

    private onCutVideoListener = async (event: IpcMainEvent, { videoPath, cuts, editGame }: OnCutVideoListenerArgs) => {
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

    private onExportGameListener = async (event: IpcMainEvent, { gameNumber, withVideo }: OnExportGameListenerArgs)=> {
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

    private onImportGameInitListener = async (event: IpcMainEvent)=> {
        logger.debug('OnImportGameInitListener');

        let gameExportedPath: string|null = this.exportedGamePathAtOpen || null;
        if (!gameExportedPath) {
            gameExportedPath = askOpenFile([{ name: 'RefBack Game Export', extensions: ['ref'] }]);
            logger.debug(`Game path : ${gameExportedPath}`);

            if (!gameExportedPath) {
                logger.debug(`Select game closed`);
                event.reply('import_game_init_failed', { closed: true });
                return;
            }
        }
        this.exportedGamePathAtOpen = null;

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

            this.lastGameExportedPathOpened = gameExportedPath;
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

    private onImportGameListener = async (event: IpcMainEvent, args: ImportGameCommandArgs)=> {
        logger.debug('OnImportGameListener');

        if (!this.lastGameExportedPathOpened) {
            logger.error('No game path to import');
            event.reply('import_game_failed');
            return;
        }

        const isImported = await importGame(this.lastGameExportedPathOpened, args);
        if (isImported) {
            event.reply('import_game_succeeded');
        } else {
            event.reply('import_game_failed');
        }

        this.lastGameExportedPathOpened = null;
    };
}
