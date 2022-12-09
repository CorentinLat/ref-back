import { Injectable } from '@angular/core';
import { ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { Observable } from 'rxjs';

import { Action, Game, GameInformation, NewAction, NewGameInformation } from '../domain/game';

type InitAppPayload = { appVersion: string; games: GameInformation[] };

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

    createNewGame(force: boolean, gameInformation: NewGameInformation, videoPaths: string[]): Promise<string> {
        return new Promise((resolve, reject) => {
            this.ipcRenderer?.once('create_new_game_succeeded', (_, createdGameNumber: string) => {
                this.ipcRenderer?.removeAllListeners('create_new_game_failed');
                resolve(createdGameNumber);
            });
            this.ipcRenderer?.once('create_new_game_failed', (_, error: any) => {
                this.ipcRenderer?.removeAllListeners('create_new_game_succeeded');
                reject(error);
            });

            this.ipcRenderer?.send('create_new_game', { force, gameInformation, videoPaths });
        });
    }

    initApp(): Promise<InitAppPayload> {
        return new Promise(resolve => {
            this.ipcRenderer?.once(
                'init_app_succeeded',
                (_, { appVersion, games }: InitAppPayload) => resolve({ appVersion, games })
            );

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

    getProcessVideoProgress(): Observable<number> {
        return new Observable(observer => {
            if (this.ipcRenderer?.listeners('videos_progress').length === 0) {
                this.ipcRenderer?.on('videos_progress', (_, progress: number) => {
                    observer.next(progress);
                });
            }
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

    addActionToGame(newAction: NewAction, gameNumber: string): Promise<Action> {
        return new Promise<Action>((resolve, reject) => {
            this.ipcRenderer?.once('add_action_succeeded', (_, action: Action) => {
                this.ipcRenderer?.removeAllListeners('add_action_failed');
                resolve(action);
            });
            this.ipcRenderer?.once('add_action_failed', () => {
                this.ipcRenderer?.removeAllListeners('add_action_succeeded');
                reject();
            });

            this.ipcRenderer?.send('add_action', { newAction, gameNumber });
        });
    }

    editActionFromGame(actionToEdit: Action, gameNumber: string): Promise<Action> {
        return new Promise<Action>((resolve, reject) => {
            this.ipcRenderer?.once('edit_action_succeeded', (_, action: Action) => {
                this.ipcRenderer?.removeAllListeners('edit_action_failed');
                resolve(action);
            });
            this.ipcRenderer?.once('edit_action_failed', () => {
                this.ipcRenderer?.removeAllListeners('edit_action_succeeded');
                reject();
            });

            this.ipcRenderer?.send('edit_action', { actionToEdit, gameNumber });
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

    downloadPdfSummary(gameNumber: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.ipcRenderer?.once('download_pdf_summary_succeeded', () => {
                this.ipcRenderer?.removeAllListeners('download_pdf_summary_failed');
                resolve();
            });
            this.ipcRenderer?.once('download_pdf_summary_failed', (_, error: any) => {
                this.ipcRenderer?.removeAllListeners('download_pdf_summary_succeeded');
                reject(error);
            });

            this.ipcRenderer?.send('download_pdf_summary', { gameNumber });
        });
    }

    openUrlInBrowser(url: string): void {
        this.ipcRenderer?.send('open_url_in_browser', { url });
    }
}
