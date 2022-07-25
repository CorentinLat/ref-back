import { BrowserWindow, app, ipcMain, protocol } from 'electron';

import logger from './utils/logger';
import { checkMandatoryFolderExists } from './utils/path';
import router from './router';
import createWindow from './window';

checkMandatoryFolderExists(logger);
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
        .catch(console.log);
} catch (e) {}
