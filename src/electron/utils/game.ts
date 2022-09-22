import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import logger from './logger';
import { workPath } from './path';

export type Action = {
    id: string;
    second: number;
    type: 'PLAY_ON' | 'TOUCH' | 'SCRUM' | 'FREE_KICK' | 'PENALTY' | 'PENALTY_TRY' | 'TRY' | 'NO_TRY';
    card?: 'WARNING' | 'RED' | 'YELLOW' | 'WHITE';
    against: 'LOCAL' | 'VISITOR';
    sector: 'SCRUM' | 'FOUL_PLAY' | 'SPACE' | 'RUCK-TACKLE' | 'LINE_OUT-MAUL' | 'ADVANTAGE';
    fault: string;
    precise: 'YES' | 'NO' | 'DOUBT';
    comment?: string;
};
export type NewAction = Omit<Action, 'id'>;

export type GameInformation = {
    gameNumber: string;
    date: string;
    teams: { local: string; visitor: string };
    score: { local: number; visitor: number };
    videoPath: string;
};
export type NewGameInformation = Omit<GameInformation, 'videoPath'>;

export type Game = {
    actions: Action[];
    information: GameInformation;
};

export function createNewGameFile(gameInformation: GameInformation): void {
    const gameFile = path.join(workPath, gameInformation.gameNumber, 'game.json');

    const game: Game = {
        actions: [],
        information: gameInformation,
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
