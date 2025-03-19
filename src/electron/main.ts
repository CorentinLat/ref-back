import { BrowserWindow, app, ipcMain, protocol } from 'electron';

import Router from './router';
import createWindow from './window';

import logger from './utils/logger';
import { checkMandatoryFolderExists } from './utils/path';
import { checkUpdatesAtStart } from './utils/update';

checkMandatoryFolderExists();

const router = new Router(ipcMain);

app.on('open-file', (event, path) => {
    event.preventDefault();

    router.updateExportedGamePathAtOpen(path);
});

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
