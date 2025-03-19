import { app, dialog } from 'electron';
import fs from 'fs';

import logger from './logger';
import { workPath } from './path';
import translate from '../translation';

const appConfigFilePath = `${workPath}/version.json`;
type VersionFile = { lastVersion?: string };

const VERSIONS = ['4.1.0', '4.1.1', '4.2.0'];

export const checkNewVersionInstalled = () => {
    logger.info('Checking new version installed');

    const currentAppVersion = app.getVersion();
    const lastVersionOpened = getLastVersionOpened();

    if (lastVersionOpened !== currentAppVersion) {
        saveLastVersionOpened(currentAppVersion);
        displayNewVersionChangelog(lastVersionOpened);
    }
};

const getLastVersionOpened = () => {
    try {
        const versionFile: VersionFile = JSON.parse(fs.readFileSync(appConfigFilePath, 'utf8'));
        return versionFile.lastVersion || null;
    } catch {
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

const displayNewVersionChangelog = (lastVersion: string|null) => {
    let lastVersionIndex = 0;
    if (lastVersion) {
        lastVersionIndex = VERSIONS.indexOf(lastVersion) + 1;
        if (lastVersionIndex === 0) return;
    }

    const message = VERSIONS
        .slice(lastVersionIndex)
        .map(version => translate(`CHANGELOG_${version.replaceAll('.', '')}`))
        .join('\n\n');

    dialog.showMessageBoxSync({
        title: translate('DIALOG_APP_UPDATED_TITLE'),
        message,
        type: 'none',
        textWidth: 600,
    });
};
