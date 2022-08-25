import fs from 'fs';
import path from 'path';

import { workPath } from './path';

type Action = { id: string; time: number; type: string };
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

export function addNewActionToGame(gameNumber: string, action: Action): Action[]|null {
    const gameFile = path.join(workPath, gameNumber, 'game.json');

    const game = getGame(gameNumber);
    if (!game) { return null; }

    game.actions.push(action);
    fs.writeFileSync(gameFile, JSON.stringify(game));
    return game.actions;
}

export function removeActionFromGame(gameNumber: string, actionId: string): Action[]|null {
    const gameFile = path.join(workPath, gameNumber, 'game.json');

    const game = getGame(gameNumber);
    if (!game) { return null; }

    game.actions = game.actions.filter(action => action.id !== actionId);
    fs.writeFileSync(gameFile, JSON.stringify(game));
    return game.actions;
}

export function getGame(gameNumber: string): Game|null {
    const gameFile = path.join(workPath, gameNumber, 'game.json');

    try {
        const game = fs.readFileSync(gameFile, 'utf8');
        return JSON.parse(game);
    } catch (_) {
        return null;
    }
}
