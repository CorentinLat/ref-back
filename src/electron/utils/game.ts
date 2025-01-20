import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import {
    Action,
    AllEditableGameComment,
    Annotation,
    Game,
    GameInformation,
    NewAction,
    NewAnnotation,
} from '../../../type/refBack';

import logger from './logger';
import { createGameFolder, removeGameFolder, workPath } from './path';

export function createNewGameFile(gameInformation: GameInformation): void {
    const gameFile = path.join(workPath, gameInformation.gameNumber, 'game.json');

    const game: Game = {
        actions: [],
        information: gameInformation,
    };

    fs.writeFileSync(gameFile, JSON.stringify(game));
}

export function createGameFromImport(game: Game, isOverriding?: boolean): boolean {
    const gameNumber = game.information.gameNumber;

    if (isOverriding) {
        const isRemoved = removeGame(gameNumber);
        if (!isRemoved) {
            logger.error('createGameFromImport: error removing existing game');
            return false;
        }
    }

    createGameFolder(gameNumber);

    const gameFile = path.join(workPath, game.information.gameNumber, 'game.json');

    fs.writeFileSync(gameFile, JSON.stringify(game));

    return true;
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
    }, [])
        .sort((a, b) => b.date.localeCompare(a.date));
}

export function updateGameComment(gameNumber: string, comment: string, key: AllEditableGameComment): boolean {
    const game = getGame(gameNumber);
    if (!game) { return false; }

    const gameFile = path.join(workPath, gameNumber, 'game.json');
    try {
        game[key] = comment.trim();
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

export function addNewAnnotationToGame(gameNumber: string, newAnnotation: NewAction|NewAnnotation): Action|Annotation|null {
    const game = getGame(gameNumber);
    if (!game) { return null; }

    const gameFile = path.join(workPath, gameNumber, 'game.json');
    try {
        const action: Action|Annotation = { ...newAnnotation, id: uuidv4() };
        game.actions.push(action);
        fs.writeFileSync(gameFile, JSON.stringify(game));

        return action;
    } catch (error) {
        logger.error(`error addNewAnnotationToGame: ${error}`);
        return null;
    }
}

export function editAnnotationFromGame(gameNumber: string, annotationToEdit: Action|Annotation): Action|Annotation|null {
    const game = getGame(gameNumber);
    if (!game) { return null; }

    const gameFile = path.join(workPath, gameNumber, 'game.json');
    try {
        game.actions = game.actions.map(action => (action.id === annotationToEdit.id ? annotationToEdit : action));
        fs.writeFileSync(gameFile, JSON.stringify(game));

        return game.actions.find(({ id }) => id === annotationToEdit.id) || null;
    } catch (error) {
        logger.error(`error editAnnotationFromGame: ${error}`);
        return null;
    }
}

export function addNewAnnotationsToGame(gameNumber: string, annotations: (Action|Annotation)[], overrides?: boolean): boolean {
    const game = getGame(gameNumber);
    if (!game) return false;

    const gameFile = path.join(workPath, gameNumber, 'game.json');
    try {
        game.actions = overrides ? [...annotations] : [...game.actions, ...annotations];

        fs.writeFileSync(gameFile, JSON.stringify(game));
        return true;
    } catch (error) {
        logger.error(`error addNewAnnotationsToGame: ${error}`);
        return false;
    }
}

export function editGameVideoPath(videoPath: string) {
    const gameNumber = path.basename(path.dirname(videoPath));
    const game = getGame(gameNumber);
    if (!game) return false;

    const gameFile = path.join(workPath, gameNumber, 'game.json');
    try {
        game.information.videoPath = videoPath;
        fs.writeFileSync(gameFile, JSON.stringify(game));

        return true;
    } catch (error) {
        logger.error(`error editGameVideoPath: ${error}`);
        return false;
    }
}

export function removeAnnotationFromGame(gameNumber: string, annotationId: string): boolean {
    const game = getGame(gameNumber);
    if (!game) { return false; }

    const gameFile = path.join(workPath, gameNumber, 'game.json');
    try {
        game.actions = game.actions.filter(annotation => annotation.id !== annotationId);
        fs.writeFileSync(gameFile, JSON.stringify(game));

        return true;
    } catch (error) {
        logger.error(`error removeAnnotationFromGame: ${error}`);
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
