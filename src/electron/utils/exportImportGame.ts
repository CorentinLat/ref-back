import fs from 'fs';

import { Game, GameToExport } from '../../../type/refBack';

import logger from './logger';

export const exportGame = async (game: Game, path: string, withVideo: boolean): Promise<boolean> => {
    const { information: { videoPath, ...informationRest} } = game;
    const gameToExport: GameToExport = { ...game, information: { ...informationRest } };

    try {
        logger.debug(`exportVideo: ${withVideo}`);
        fs.writeFileSync(path, JSON.stringify(gameToExport));

        return true;
    } catch (error) {
        logger.error(`error exportGame: ${error}`);
        return false;
    }
};
