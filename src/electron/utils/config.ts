import { dialog } from 'electron';

import { readJsonFile, updateJsonFile } from './json';
import logger from './logger';
import { configFilePath } from './path';
import translate from '../translation';

type ConfigFile = { gamesPath?: string };

export const updateGamesPath = () => {
    logger.info('Asking to update games path');

    const result = dialog.showMessageBoxSync({
        title: translate('DIALOG_CONFIRM_UPDATE_GAMES_PATH_TITLE'),
        message: translate('DIALOG_CONFIRM_UPDATE_GAMES_PATH_MESSAGE'),
        type: 'warning',
        buttons: [translate('BUTTON_OK'), translate('BUTTON_CANCEL')],
    });

    if (result === 0) {
        logger.info('User confirmed to update games path');

        const path = dialog.showOpenDialogSync({
            properties: ['openDirectory'],
            title: translate('DIALOG_SELECT_GAMES_PATH_TITLE'),
        });

        if (path && path.length > 0) {
            const newPath = path[0];
            logger.info(`User selected new games path: ${newPath}`);

            updateJsonFile<ConfigFile>(configFilePath, { gamesPath: newPath });
            // TODO: Move all games to the new path
            // TODO: Update all video paths in the game files
        }
    } else {
        logger.info('User cancelled to update games path');
    }
};

export const getConfigGamesPath = (): string|null => {
    const configFileContent = readJsonFile<ConfigFile>(configFilePath);

    return configFileContent?.gamesPath || null;
};
