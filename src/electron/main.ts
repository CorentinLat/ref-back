import { BrowserWindow, app, ipcMain, protocol } from 'electron';

import router from './router';
import createWindow from './window';

import logger from './utils/logger';
import { checkMandatoryFolderExists } from './utils/path';
import { checkUpdatesAtStart } from './utils/update';

checkMandatoryFolderExists();
router(ipcMain);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

let window: BrowserWindow | null = null;
try {
    app
        .whenReady()
        .then(() => {
            checkUpdatesAtStart();

            protocol.registerFileProtocol('video', (request, callback) => {
                const path = request.url.replace('video://', '');
                callback({ path });
            });

            setTimeout(() => window = createWindow(), 400);

            app.on('activate', () => {
                if (window === null) {
                    window = createWindow();
                }
            });
        })
        .catch(logger.error);
} catch (e) {}
