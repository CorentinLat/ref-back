import { app, BrowserWindow, dialog } from 'electron';
import fs from 'fs';

import logger from './logger';
import { workPath } from './path';
import translate from '../translation';

const appConfigFilePath = `${workPath}/version.json`;
type VersionFile = { lastVersion?: string };

const VERSIONS = ['4.1.0'];

export const checkNewVersionInstalled = (window: BrowserWindow) => {
    logger.info('Checking new version installed');

    const currentAppVersion = app.getVersion();
    const lastVersionOpened = getLastVersionOpened();

    if (lastVersionOpened !== currentAppVersion) {
        saveLastVersionOpened(currentAppVersion);
        displayNewVersionChangelog(lastVersionOpened, window);
    }
};

const getLastVersionOpened = () => {
    try {
        const versionFile: VersionFile = JSON.parse(fs.readFileSync(appConfigFilePath, 'utf8'));
        return versionFile.lastVersion || null;
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

const displayNewVersionChangelog = (lastVersion: string|null, window: BrowserWindow) => {
    let lastVersionIndex = 0;
    if (lastVersion) {
        lastVersionIndex = VERSIONS.indexOf(lastVersion) + 1;
        if (lastVersionIndex === 0) return;
    }

    const message = VERSIONS
        .slice(lastVersionIndex)
        .map(version => translate(`CHANGELOG_${version.replaceAll('.', '')}`))
        .join('\n\n');

    dialog.showMessageBoxSync(window, {
        title: translate('DIALOG_APP_UPDATED_TITLE'),
        message,
        type: 'none',
        textWidth: 600,
    });
};
