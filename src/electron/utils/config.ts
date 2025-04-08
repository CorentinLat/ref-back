import { app, dialog } from 'electron';

import { readJsonFile, updateJsonFile } from './json';
import logger from './logger';
import { configFilePath } from './path';
import translate from '../translation';

type ConfigFile = { gamesPath?: string };

export const updateGamesPath = () => {
    logger.info('Confirming to update games path');

    const buttons = [translate('BUTTON_CANCEL'), translate('BUTTON_OK')];
    let message = translate('DIALOG_CONFIRM_UPDATE_GAMES_PATH_MESSAGE');
    const currentGamesPath = getConfigGamesPath();
    if (currentGamesPath) {
        buttons.push(translate('BUTTON_RESET'));
        message += translate('DIALOG_RESET_GAMES_PATH_MESSAGE');
    }

    const result = dialog.showMessageBoxSync({
        title: translate('DIALOG_CONFIRM_UPDATE_GAMES_PATH_TITLE'),
        message,
        type: 'warning',
        buttons,
        defaultId: 1,
    });

    if (result === 1) {
        logger.info('User confirmed to update games path');

        const path = dialog.showOpenDialogSync({
            properties: ['openDirectory'],
            title: translate('DIALOG_SELECT_GAMES_PATH_TITLE'),
        });

        if (path && path.length > 0) {
            const newPath = path[0];
            logger.info(`User selected new games path: ${newPath}`);

            setConfigGamesPath(newPath);
        }
    } else if (result === 2) {
        logger.info('User confirmed to reset games path');

        setConfigGamesPath();
    }
};

export const getConfigGamesPath = (): string|null => {
    const configFileContent = readJsonFile<ConfigFile>(configFilePath);

    return configFileContent?.gamesPath || null;
};

const setConfigGamesPath = (gamesPath?: string) => {
    updateJsonFile<ConfigFile>(configFilePath, { gamesPath });

    app.relaunch();
    app.exit();
};
