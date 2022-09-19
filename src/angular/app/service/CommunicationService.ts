import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Action, Game, NewAction } from '../domain/game';

import { ElectronService } from './ElectronService';

type InitAppPayload = { appVersion: string; gameNumbers: string[] };

@Injectable({ providedIn: 'root' })
export default class CommunicationService {
    constructor(private readonly electron: ElectronService) {}

    createNewGame(force: boolean, gameNumber: string, videoPaths: string[]): Promise<string> {
        return new Promise((resolve, reject) => {
            this.electron.ipcRenderer?.once('create_new_game_succeeded', (_, createdGameNumber: string) => {
                this.electron.ipcRenderer?.removeAllListeners('create_new_game_failed');
                resolve(createdGameNumber);
            });
            this.electron.ipcRenderer?.once('create_new_game_failed', (_, error: any) => {
                this.electron.ipcRenderer?.removeAllListeners('create_new_game_succeeded');
                reject(error);
            });

            this.electron.ipcRenderer?.send('create_new_game', { force, gameNumber, videoPaths });
        });
    }

    initApp(): Promise<InitAppPayload> {
        return new Promise(resolve => {
            this.electron.ipcRenderer?.once(
                'init_app_succeeded',
                (_, { appVersion, gameNumbers }: InitAppPayload) => resolve({ appVersion, gameNumbers })
            );

            this.electron.ipcRenderer?.send('init_app');
        });
    }

    getGameByNumber(gameNumber: string): Promise<Game> {
        return new Promise((resolve, reject) => {
            this.electron.ipcRenderer?.once('get_game_succeeded', (_, game: Game) => {
                this.electron.ipcRenderer?.removeAllListeners('get_game_failed');
                resolve(game);
            });
            this.electron.ipcRenderer?.once('get_game_failed', () => {
                this.electron.ipcRenderer?.removeAllListeners('get_game_succeeded');
                reject();
            });

            this.electron.ipcRenderer?.send('get_game', { gameNumber });
        });
    }

    getProcessVideoProgress(): Observable<number> {
        return new Observable(observer => {
            if (this.electron.ipcRenderer?.listeners('videos_progress').length === 0) {
                this.electron.ipcRenderer?.on('videos_progress', (_, progress: number) => {
                    observer.next(progress);
                });
            }
        });
    }

    removeGame(gameNumber: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.electron.ipcRenderer?.once('remove_game_succeeded', () => {
                this.electron.ipcRenderer?.removeAllListeners('remove_game_failed');
                resolve();
            });
            this.electron.ipcRenderer?.once('remove_game_failed', () => {
                this.electron.ipcRenderer?.removeAllListeners('remove_game_succeeded');
                reject();
            });

            this.electron.ipcRenderer?.send('remove_game', { gameNumber });
        });
    }

    addActionToGame(newAction: NewAction, gameNumber: string): Promise<Action> {
        return new Promise<Action>((resolve, reject) => {
            this.electron.ipcRenderer?.once('add_action_succeeded', (_, action: Action) => {
                this.electron.ipcRenderer?.removeAllListeners('add_action_failed');
                resolve(action);
            });
            this.electron.ipcRenderer?.once('add_action_failed', () => {
                this.electron.ipcRenderer?.removeAllListeners('add_action_succeeded');
                reject();
            });

            this.electron.ipcRenderer?.send('add_action', { newAction, gameNumber });
        });
    }

    removeActionFromGame(actionId: string, gameNumber: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.electron.ipcRenderer?.once('remove_action_succeeded', () => {
                this.electron.ipcRenderer?.removeAllListeners('remove_action_failed');
                resolve();
            });
            this.electron.ipcRenderer?.once('remove_action_failed', () => {
                this.electron.ipcRenderer?.removeAllListeners('remove_action_succeeded');
                reject();
            });

            this.electron.ipcRenderer?.send('remove_action', { actionId, gameNumber });
        });
    }

    downloadVideoGame(gameNumber: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.electron.ipcRenderer?.once('download_video_game_succeeded', () => {
                this.electron.ipcRenderer?.removeAllListeners('download_video_game_failed');
                resolve();
            });
            this.electron.ipcRenderer?.once('download_video_game_failed', (_, error: any) => {
                this.electron.ipcRenderer?.removeAllListeners('download_video_game_succeeded');
                reject(error);
            });

            this.electron.ipcRenderer?.send('download_video_game', { gameNumber });
        });
    }

    openUrlInBrowser(url: string): void {
        this.electron.ipcRenderer?.send('open_url_in_browser', { url });
    }
}
