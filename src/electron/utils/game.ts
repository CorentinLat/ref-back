import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { removeGameFolder } from './path';
import logger from './logger';
import { workPath } from './path';

export type Action = {
    id: string;
    second: number;
    type: 'PLAY_ON' | 'TOUCH' | 'SCRUM' | 'FREE_KICK' | 'PENALTY' | 'RETURNED_PENALTY' | 'PENALTY_TRY' | 'TRY' | 'NO_TRY' | 'RESTART_KICK';
    card?: 'WARNING' | 'RED' | 'YELLOW' | 'WHITE';
    against: 'LOCAL' | 'VISITOR';
    sector: 'SCRUM' | 'FOUL_PLAY' | 'SPACE' | 'RUCK-TACKLE' | 'LINE_OUT-MAUL' | 'ADVANTAGE';
    fault: string;
    precise: 'YES' | 'NO' | 'DOUBT';
    comment?: string;
    clip?: { start: number; end: number };
};
export type NewAction = Omit<Action, 'id'>;

export type GameInformation = {
    gameNumber: string;
    date: string;
    teams: { local: string; visitor: string };
    score: { local: number; visitor: number };
    videoPath: string;
};
export type NewGameInformation = Omit<GameInformation, 'videoPath'> & {
    video: {
        option: 'file' | 'veo';
        videoPaths?: string[];
        veo?: string;
    };
};

export type Game = {
    actions: Action[];
    information: GameInformation;
    gameDescription?: string;
    globalPerformance?: string;
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

export function getGamesInformation(gameNumbers: string[]): GameInformation[] {
    return gameNumbers.reduce<GameInformation[]>((games, gameNumber) => {
        const game = getGame(gameNumber);

        return game ? [...games, game.information] : games;
    }, []);
}

export function updateGameComment(gameNumber: string, comment: string, key: 'gameDescription'|'globalPerformance'): boolean {
    const game = getGame(gameNumber);
    if (!game) { return false; }

    const gameFile = path.join(workPath, gameNumber, 'game.json');
    try {
        game[key] = comment;
        fs.writeFileSync(gameFile, JSON.stringify(game));

        return true;
    } catch (error) {
        logger.error(`error updateGameComment: ${error}`);
        return false;
    }
}

export function removeGame(gameNumber: string): boolean {
    const gameFolderPath = path.join(workPath, gameNumber);
    try {
        removeGameFolder(gameFolderPath);
        return true;
    } catch (error) {
        logger.error(`error removeGame: ${error}`);
        return false;
    }
}

export function addNewActionToGame(gameNumber: string, newAction: NewAction): Action|null {
    const game = getGame(gameNumber);
    if (!game) { return null; }

    const gameFile = path.join(workPath, gameNumber, 'game.json');
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

export function editActionFromGame(gameNumber: string, actionToEdit: Action): Action|null {
    const game = getGame(gameNumber);
    if (!game) { return null; }

    const gameFile = path.join(workPath, gameNumber, 'game.json');
    try {
        game.actions = game.actions.map(action => (action.id === actionToEdit.id ? actionToEdit : action));
        fs.writeFileSync(gameFile, JSON.stringify(game));

        return game.actions.find(({ id }) => id === actionToEdit.id) || null;
    } catch (error) {
        logger.error(`error editActionFromGame: ${error}`);
        return null;
    }
}

export function removeActionFromGame(gameNumber: string, actionId: string): boolean {
    const game = getGame(gameNumber);
    if (!game) { return false; }

    const gameFile = path.join(workPath, gameNumber, 'game.json');
    try {
        game.actions = game.actions.filter(action => action.id !== actionId);
        fs.writeFileSync(gameFile, JSON.stringify(game));

        return true;
    } catch (error) {
        logger.error(`error removeActionFromGame: ${error}`);
        return false;
    }
}

export function getDefaultGameVideoFilename(game: Game): string {
    const {
        date,
        teams: { local, visitor },
    } = game.information;

    return `${date} ${local} - ${visitor}`;
}
