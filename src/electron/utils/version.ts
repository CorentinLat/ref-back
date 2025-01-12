import { app, dialog } from 'electron';
import fs from 'fs';

import logger from './logger';
import { workPath } from './path';
import translate from '../translation';

const appConfigFilePath = `${workPath}/version.json`;
type VersionFile = { lastVersion?: string };

export const checkNewVersionInstalled = () => {
    logger.info('Checking new version installed');

    const currentAppVersion = app.getVersion();
    const lastVersionOpened = getLastVersionOpened();

    if (lastVersionOpened !== currentAppVersion) {
        saveLastVersionOpened(currentAppVersion);
        displayNewVersionChangelog(currentAppVersion);
    }
};

const getLastVersionOpened = () => {
    try {
        const versionFile: VersionFile = JSON.parse(fs.readFileSync(appConfigFilePath, 'utf8'));
        return versionFile.lastVersion;
    } catch (e) {
        logger.error('Error reading last version opened', e);
        return null;
    }
};

const saveLastVersionOpened = (version: string) => {
    try {
        const versionFile: VersionFile = { lastVersion: version };
        fs.writeFileSync(appConfigFilePath, JSON.stringify(versionFile), 'utf8');
    } catch (e) {
        logger.error('Error saving last version opened', e);
    }
};

const displayNewVersionChangelog = (currentVersion: string) => dialog.showMessageBoxSync({
    title: translate('DIALOG_APP_UPDATED_TITLE'),
    message: translate(`CHANGELOG_${currentVersion.replaceAll('.', '')}`),
    type: 'none',
    textWidth: 600,
});
