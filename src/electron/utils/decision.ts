import { Decision } from '../../../type/refBack';

import { getGame } from './game';

export const getDecisionsForGames = (gameNumbers: string[]): Decision[] =>
    gameNumbers.map(gameNumber => getDecisionsForGame(gameNumber)).flat();

const getDecisionsForGame = (gameNumber: string): Decision[] => {
    const game = getGame(gameNumber);
    if (!game) { return []; }

    const videoPath = game.information.videoPath;

    return game.actions.map(action => ({
        gameNumber,
        videoPath,
        second: action.second,
        sector: action.sector,
        fault: action.fault,
        precise: action.precise,
        type: action.type,
        card: action.card,
        comment: action.comment,
    }));
};
