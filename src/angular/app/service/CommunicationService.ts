import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Action, Game, NewAction } from '../domain/game';

import { ElectronService } from './ElectronService';

@Injectable({ providedIn: 'root' })
export default class CommunicationService {
    constructor(private readonly electron: ElectronService) {}

    createNewGame(force: boolean, gameNumber: string, videoPaths: string[]): Promise<string> {
        return new Promise((resolve, reject) => {
            this.electron.ipcRenderer?.once('process_videos_succeeded', (_, createdGameNumber: string) => resolve(createdGameNumber));
            this.electron.ipcRenderer?.once('process_videos_failed', (_, error: any) => reject(error));

            this.electron.ipcRenderer?.send('process_videos_imported', { force, gameNumber, videoPaths });
        });
    }

    getExistingGameNumbers(): Promise<string[]> {
        return new Promise(resolve => {
            this.electron.ipcRenderer?.once('process_init_app_succeeded', (_, gameNumbers: string[]) => resolve(gameNumbers));

            this.electron.ipcRenderer?.send('process_init_app_started');
        });
    }

    getGameByNumber(gameNumber: string): Promise<Game> {
        return new Promise((resolve, reject) => {
            this.electron.ipcRenderer?.once('process_videos_succeeded', (_, game: Game) => resolve(game));
            this.electron.ipcRenderer?.once('process_videos_failed', () => reject());

            this.electron.ipcRenderer?.send('process_videos_load', { gameNumber });
        });
    }

    getProcessVideoProgress(): Observable<number> {
        return new Observable(observer => {
            if (this.electron.ipcRenderer?.listeners('process_videos_progress').length === 0) {
                this.electron.ipcRenderer?.on('process_videos_progress', (_, progress: number) => observer.next(progress));
            }
        });
    }

    addActionToGame(newAction: NewAction, gameNumber: string): Promise<Action> {
        return new Promise<Action>((resolve, reject) => {
            this.electron.ipcRenderer?.once('process_add_action_succeeded', (_, action: Action) => resolve(action));
            this.electron.ipcRenderer?.once('process_add_action_failed', () => reject());

            this.electron.ipcRenderer?.send('process_add_action', { newAction, gameNumber });
        });
    }

    editActionFromGame(action: Action, gameNumber: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.electron.ipcRenderer?.once('process_edit_action_succeeded', () => resolve());
            this.electron.ipcRenderer?.once('process_edit_action_failed', () => reject());

            this.electron.ipcRenderer?.send('process_edit_action', { action, gameNumber });
        });
    }

    removeActionFromGame(actionId: string, gameNumber: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.electron.ipcRenderer?.once('process_remove_action_succeeded', () => resolve());
            this.electron.ipcRenderer?.once('process_remove_action_failed', () => reject());

            this.electron.ipcRenderer?.send('process_remove_action', { actionId, gameNumber });
        });
    }
}
