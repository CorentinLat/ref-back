import { app, dialog } from 'electron';

import { readJsonFile, updateJsonFile } from './json';
import logger from './logger';
import { versionFilePath } from './path';
import translate from '../translation';

type VersionFile = { lastVersion?: string };

const VERSIONS = ['4.1.0', '4.1.1', '4.2.0', '4.2.1', '4.2.2'];

export const checkNewVersionInstalled = () => {
    logger.info('Checking new version installed');

    const currentAppVersion = app.getVersion();
    const lastVersionOpened = getLastVersionOpened();

    if (lastVersionOpened !== currentAppVersion) {
        saveLastVersionOpened(currentAppVersion);
        displayNewVersionChangelog(lastVersionOpened);
    }
};

const getLastVersionOpened = (): string|null => {
    const versionFileContent = readJsonFile<VersionFile>(versionFilePath);

    return versionFileContent?.lastVersion || null;
};

const saveLastVersionOpened = (version: string): void =>
    updateJsonFile<VersionFile>(versionFilePath, { lastVersion: version });

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
