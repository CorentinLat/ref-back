import { Notification, app, autoUpdater, dialog } from 'electron';

import logger from './logger';
import translate from '../translation';

export default function checkUpdates() {
    const server = 'https://perf-arbitres-plus-plus-release-server.vercel.app';
    const url = `${server}/update/${process.platform}/${app.getVersion()}`;

    autoUpdater.setFeedURL({ url });

    autoUpdater.on('error', (err) => logger.error(err));
    autoUpdater.on('checking-for-update', () => logger.info('Checking for update...'));
    autoUpdater.on('update-available', () => {
        if (Notification.isSupported()) {
            new Notification({
                title: translate('NOTIFICATION_UPDATE_AVAILABLE_TITLE'),
                body: translate('NOTIFICATION_UPDATE_AVAILABLE_BODY'),
            }).show();
        }
    });
    autoUpdater.on('update-downloaded', (_e, _r, releaseName) => {
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

    autoUpdater.checkForUpdates();
}
