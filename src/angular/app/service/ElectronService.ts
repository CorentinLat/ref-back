import { Injectable } from '@angular/core';
import { ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { Observable } from 'rxjs';

import {
    Annotation,
    Decision,
    Game,
    InitAppListenerCommandOutput,
    ImportGameCommandArgs,
    ImportGameInitCommandOutput,
    NewGameInformation,
    SummaryExportType,
} from '../../../../type/refBack';

@Injectable({ providedIn: 'root' })
export class ElectronService {
    ipcRenderer: (typeof ipcRenderer) | null = null;
    webFrame: (typeof webFrame) | null = null;
    childProcess: (typeof childProcess) | null = null;
    fs: (typeof fs) | null = null;

    constructor() {
        if (this.isElectron) {
            this.ipcRenderer = window.require('electron').ipcRenderer;
            this.webFrame = window.require('electron').webFrame;

            this.childProcess = window.require('child_process');
            this.fs = window.require('fs');
        }
    }

    get isElectron(): boolean {
        return !!(window && window.process && window.process.type);
    }

    createNewGame(force: boolean, gameInformation: NewGameInformation): Promise<string> {
        return new Promise((resolve, reject) => {
            this.ipcRenderer?.once('create_new_game_succeeded', (_, createdGameNumber: string) => {
                this.ipcRenderer?.removeAllListeners('create_new_game_failed');
                resolve(createdGameNumber);
            });
            this.ipcRenderer?.once('create_new_game_failed', (_, error: any) => {
                this.ipcRenderer?.removeAllListeners('create_new_game_succeeded');
                reject(error);
            });

            this.ipcRenderer?.send('create_new_game', { force, gameInformation });
        });
    }

    cancelVideoProcess(): void {
        this.ipcRenderer?.send('cancel_video_process');
    }

    initApp(): Promise<InitAppListenerCommandOutput> {
        return new Promise(resolve => {
            this.ipcRenderer?.once('init_app_succeeded', (_, output: InitAppListenerCommandOutput) => resolve(output));

            this.ipcRenderer?.send('init_app');
        });
    }

    getGameByNumber(gameNumber: string): Promise<Game> {
        return new Promise((resolve, reject) => {
            this.ipcRenderer?.once('get_game_succeeded', (_, game: Game) => {
                this.ipcRenderer?.removeAllListeners('get_game_failed');
                resolve(game);
            });
            this.ipcRenderer?.once('get_game_failed', () => {
                this.ipcRenderer?.removeAllListeners('get_game_succeeded');
                reject();
            });

            this.ipcRenderer?.send('get_game', { gameNumber });
        });
    }

    getProcessVideoProgress(): Observable<{ percentage: number; remaining: number; label?: string }> {
        return new Observable(observer => {
            this.ipcRenderer?.removeAllListeners('videos_progress');

            this.ipcRenderer?.on('videos_progress', (_, progress: any) => {
                observer.next(progress);
            });
        });
    }

    getProcessClipProgress(): Observable<{ clip: number; percentage: number; remaining: number }> {
        return new Observable(observer => {
            this.ipcRenderer?.removeAllListeners('clip_progress');

            this.ipcRenderer?.on('clip_progress', (_, progress: any) => {
                observer.next(progress);
            });
        });
    }

    updateGameComment(gameNumber: string, comment: string, key: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.ipcRenderer?.once('update_game_comment_succeeded', () => {
                this.ipcRenderer?.removeAllListeners('update_game_comment_failed');
                resolve();
            });
            this.ipcRenderer?.once('update_game_comment_failed', () => {
                this.ipcRenderer?.removeAllListeners('update_game_comment_succeeded');
                reject();
            });

            this.ipcRenderer?.send('update_game_comment', { gameNumber, comment, key });
        });
    }

    removeGame(gameNumber: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.ipcRenderer?.once('remove_game_succeeded', () => {
                this.ipcRenderer?.removeAllListeners('remove_game_failed');
                resolve();
            });
            this.ipcRenderer?.once('remove_game_failed', () => {
                this.ipcRenderer?.removeAllListeners('remove_game_succeeded');
                reject();
            });

            this.ipcRenderer?.send('remove_game', { gameNumber });
        });
    }

    addAnnotationToGame<T extends Annotation>(annotationToCreate: Omit<T, 'id'>, gameNumber: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.ipcRenderer?.once('add_annotation_succeeded', (_, annotation: T) => {
                this.ipcRenderer?.removeAllListeners('add_annotation_failed');
                resolve(annotation);
            });
            this.ipcRenderer?.once('add_annotation_failed', () => {
                this.ipcRenderer?.removeAllListeners('add_annotation_succeeded');
                reject();
            });

            this.ipcRenderer?.send('add_annotation', { annotationToCreate, gameNumber });
        });
    }

    editAnnotationFromGame<T extends Annotation>(annotationToEdit: T, gameNumber: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.ipcRenderer?.once('edit_annotation_succeeded', (_, annotation: T) => {
                this.ipcRenderer?.removeAllListeners('edit_annotation_failed');
                resolve(annotation);
            });
            this.ipcRenderer?.once('edit_annotation_failed', () => {
                this.ipcRenderer?.removeAllListeners('edit_annotation_succeeded');
                reject();
            });

            this.ipcRenderer?.send('edit_annotation', { annotationToEdit, gameNumber });
        });
    }

    removeActionFromGame(actionId: string, gameNumber: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.ipcRenderer?.once('remove_action_succeeded', () => {
                this.ipcRenderer?.removeAllListeners('remove_action_failed');
                resolve();
            });
            this.ipcRenderer?.once('remove_action_failed', () => {
                this.ipcRenderer?.removeAllListeners('remove_action_succeeded');
                reject();
            });

            this.ipcRenderer?.send('remove_action', { actionId, gameNumber });
        });
    }

    downloadVideoGame(gameNumber: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.ipcRenderer?.once('download_video_game_succeeded', () => {
                this.ipcRenderer?.removeAllListeners('download_video_game_failed');
                resolve();
            });
            this.ipcRenderer?.once('download_video_game_failed', (_, error: any) => {
                this.ipcRenderer?.removeAllListeners('download_video_game_succeeded');
                reject(error);
            });

            this.ipcRenderer?.send('download_video_game', { gameNumber });
        });
    }

    downloadVideoClips(gameNumber: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.ipcRenderer?.once('download_video_clips_succeeded', () => {
                this.ipcRenderer?.removeAllListeners('download_video_clips_failed');
                resolve();
            });
            this.ipcRenderer?.once('download_video_clips_failed', (_, error: any) => {
                this.ipcRenderer?.removeAllListeners('download_video_clips_succeeded');
                reject(error);
            });

            this.ipcRenderer?.send('download_video_clips', { gameNumber });
        });
    }

    downloadAllVideos(gameNumber: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.ipcRenderer?.once('download_all_videos_succeeded', () => {
                this.ipcRenderer?.removeAllListeners('download_all_videos_failed');
                resolve();
            });
            this.ipcRenderer?.once('download_all_videos_failed', (_, error: any) => {
                this.ipcRenderer?.removeAllListeners('download_all_videos_succeeded');
                reject(error);
            });

            this.ipcRenderer?.send('download_all_videos', { gameNumber });
        });
    }

    downloadSummary(gameNumber: string, exportType: SummaryExportType): Promise<void> {
        return new Promise((resolve, reject) => {
            this.ipcRenderer?.once('download_summary_succeeded', () => {
                this.ipcRenderer?.removeAllListeners('download_summary_failed');
                resolve();
            });
            this.ipcRenderer?.once('download_summary_failed', (_, error: any) => {
                this.ipcRenderer?.removeAllListeners('download_summary_succeeded');
                reject(error);
            });

            this.ipcRenderer?.send('download_summary', { exportType, gameNumber });
        });
    }

    openUrlInBrowser(url: string): void {
        this.ipcRenderer?.send('open_url_in_browser', { url });
    }

    getDecisions(): Promise<Decision[]> {
        return new Promise<Decision[]>((resolve, reject) => {
            this.ipcRenderer?.once('get_decisions_succeeded', (_, decisions: Decision[]) => {
                this.ipcRenderer?.removeAllListeners('get_decisions_failed');
                resolve(decisions);
            });
            this.ipcRenderer?.once('get_decisions_failed', () => {
                this.ipcRenderer?.removeAllListeners('get_decisions_succeeded');
                reject();
            });

            this.ipcRenderer?.send('get_decisions');
        });
    }

    cutVideo(videoPath: string, cuts: number[][], editGame: boolean = false): Promise<string> {
        return new Promise((resolve, reject) => {
            this.ipcRenderer?.once('cut_video_succeeded', (_, newVideoPath: string) => {
                this.ipcRenderer?.removeAllListeners('cut_video_failed');
                resolve(newVideoPath);
            });
            this.ipcRenderer?.once('cut_video_failed', (_, error: any) => {
                this.ipcRenderer?.removeAllListeners('cut_video_succeeded');
                reject(error);
            });

            this.ipcRenderer?.send('cut_video', { videoPath, cuts, editGame });
        });
    }

    exportGame(gameNumber: string, withVideo: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            this.ipcRenderer?.once('export_game_succeeded', () => {
                this.ipcRenderer?.removeAllListeners('export_game_failed');
                resolve();
            });
            this.ipcRenderer?.once('export_game_failed', (_, error: any) => {
                this.ipcRenderer?.removeAllListeners('export_game_succeeded');
                reject(error);
            });

            this.ipcRenderer?.send('export_game', { gameNumber, withVideo });
        });
    }

    importGameInit(): Promise<ImportGameInitCommandOutput> {
        return new Promise<ImportGameInitCommandOutput>((resolve, reject) => {
            this.ipcRenderer?.once('import_game_init_succeeded', (_, output: ImportGameInitCommandOutput) => {
                this.ipcRenderer?.removeAllListeners('import_game_init_failed');
                resolve(output);
            });
            this.ipcRenderer?.once('import_game_init_failed', (_, error: any) => {
                this.ipcRenderer?.removeAllListeners('import_game_init_succeeded');
                reject(error);
            });

            this.ipcRenderer?.send('import_game_init');
        });
    }

    importGame(args: ImportGameCommandArgs): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.ipcRenderer?.once('import_game_succeeded', () => {
                this.ipcRenderer?.removeAllListeners('import_game_failed');
                resolve();
            });
            this.ipcRenderer?.once('import_game_failed', (_, error: any) => {
                this.ipcRenderer?.removeAllListeners('import_game_succeeded');
                reject(error);
            });

            this.ipcRenderer?.send('import_game', args);
        });
    }
}
