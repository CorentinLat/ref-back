import { Notification, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';

import logger from './logger';
import translate from '../translation';

export function checkUpdatesAtStart() {
    autoUpdater.on('checking-for-update', () => logger.info('Checking for update...'));
    autoUpdater.on('update-available', () => {
        if (Notification.isSupported()) {
            new Notification({
                title: translate('NOTIFICATION_UPDATE_AVAILABLE_TITLE'),
                body: translate('NOTIFICATION_UPDATE_AVAILABLE_BODY'),
            }).show();
        }
    });
    autoUpdater.on('update-downloaded', ({ releaseName }) => {
        const dialogOpts = {
            type: 'info',
            buttons: [
                translate('DIALOG_UPDATE_BUTTON_RESTART'),
                translate('DIALOG_UPDATE_BUTTON_LATER')
            ],
            title: `${translate('DIALOG_UPDATE_TITLE')} ${releaseName}`,
            message: translate('DIALOG_UPDATE_MESSAGE'),
        };

        dialog.showMessageBox(dialogOpts)
            .then((returnValue) => {
                if (returnValue.response === 0) {
                    autoUpdater.quitAndInstall();
                }
            });
    });

    checkUpdates();
}

export function checkUpdates(manual = false) {
    if (manual) {
        autoUpdater.once('update-not-available', () => {
            if (Notification.isSupported()) {
                new Notification({ title: translate('NOTIFICATION_UPDATE_NOT_AVAILABLE_TITLE') }).show();
            }
        });
    }

    autoUpdater
        .checkForUpdates()
        .catch((err) => logger.error(err));
}
