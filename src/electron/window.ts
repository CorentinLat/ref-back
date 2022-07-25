import { app, BrowserWindow, screen } from 'electron';
import path from 'path';
import { URL } from 'url';

import MenuBuilder from './menu';

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
const htmlFileName = 'index.html';

export default function createWindow() {
    const RESOURCES_PATH = app.isPackaged
        ? path.join(process.resourcesPath, 'assets')
        : path.join(__dirname, '../../assets');

    const getAssetPath = (...paths: string[]): string => path.join(RESOURCES_PATH, ...paths);

    const MARGIN = 50;
    const size = screen.getPrimaryDisplay().workAreaSize;
    let window: BrowserWindow|null = new BrowserWindow({
        show: false,
        x: MARGIN,
        y: MARGIN,
        width: size.width - 2 * MARGIN,
        height: size.height - 2 * MARGIN,
        icon: getAssetPath('icon.png'),
        webPreferences: {
            devTools: isDebug,
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    if (isDebug) {
        require('electron-debug')();

        const port = process.env.PORT || 4200;
        const url = new URL(`http://localhost:${ port }`);
        url.pathname = htmlFileName;
        window.loadURL(url.href);
    } else {
        window.loadURL(`file://${ path.resolve(__dirname, '../angular/', htmlFileName) }`);
    }

    window.on('ready-to-show', () => {
        if (!window) {
            throw new Error('"mainWindow" is not defined');
        }

        process.env.START_MINIMIZED ? window.minimize() : window.show();
    });

    window.on('closed', () => {
        window = null;
    });

    const menuBuilder = new MenuBuilder(window);
    menuBuilder.buildMenu();

    return window;
}
