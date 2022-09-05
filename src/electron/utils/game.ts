import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import logger from './logger';
import { workPath } from './path';

export type Action = {
    id: string;
    second: number;
    type: 'PLAY_ON' | 'TOUCH' | 'SCRUM' | 'FREE_KICK' | 'PENALTY' | 'PENALTY_TRY';
    card?: 'RED' | 'YELLOW' | 'WHITE';
    against: 'LOCAL' | 'VISITOR';
    sector: 'RUCK' | 'SCRUM' | 'LINE_OUT';
    fault: string;
    precise: 'YES' | 'NO' | 'DOUBT';
    comment?: string;
};
export type NewAction = Omit<Action, 'id'>;
export type Game = {
    actions: Action[];
    information: {
        gameNumber: string;
        videoPath: string;
    };
};

export function createNewGameFile(gameNumber: string, videoPath: string): void {
    const gameFile = path.join(workPath, gameNumber, 'game.json');

    const game: Game = {
        actions: [],
        information: {
            gameNumber,
            videoPath,
        },
    };

    fs.writeFileSync(gameFile, JSON.stringify(game));
}

export function getGame(gameNumber: string): Game|null {
    const gameFile = path.join(workPath, gameNumber, 'game.json');

    try {
        const game = fs.readFileSync(gameFile, 'utf8');
        return JSON.parse(game);
    } catch (error) {
        logger.error(`error getGame: ${error}`);
        return null;
    }
}

export function removeGame(gameNumber: string): boolean {
    const gameFolderPath = path.join(workPath, gameNumber);

    try {
        fs.rmSync(gameFolderPath, { recursive: true });
        return true;
    } catch (error) {
        logger.error(`error removeGame: ${error}`);
        return false;
    }
}

export function addNewActionToGame(gameNumber: string, newAction: NewAction): Action|null {
    const gameFile = path.join(workPath, gameNumber, 'game.json');

    const game = getGame(gameNumber);
    if (!game) { return null; }

    try {
        const action: Action = { ...newAction, id: uuidv4() };
        game.actions.push(action);
        fs.writeFileSync(gameFile, JSON.stringify(game));

        return action;
    } catch (error) {
        logger.error(`error addNewActionToGame: ${error}`);
        return null;
    }
}

export function removeActionFromGame(gameNumber: string, actionId: string): boolean {
    const gameFile = path.join(workPath, gameNumber, 'game.json');

    const game = getGame(gameNumber);
    if (!game) { return false; }

    try {
        game.actions = game.actions.filter(action => action.id !== actionId);
        fs.writeFileSync(gameFile, JSON.stringify(game));

        return true;
    } catch (error) {
        logger.error(`error removeActionFromGame: ${error}`);
        return false;
    }
}
