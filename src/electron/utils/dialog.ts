import { dialog, FileFilter } from 'electron';
import path from 'path';

import { Game } from '../../../type/refBack';

import { extractFileExtension } from './file';
import { getDefaultGameVideoFilename } from './game';
import { downloadPath } from './path';

export function askSaveVideoPath(game: Game): string|null {
    const fileName = getDefaultGameVideoFilename(game);
    const extension = extractFileExtension(game.information.videoPath);
    const defaultPath = path.join(downloadPath, `${fileName}.${extension}`);

    const savePath = dialog.showSaveDialogSync({
        defaultPath,
        filters: [{ name: extension, extensions: [`.${extension}`] }],
    });

    return savePath ? savePath : null;
}

export function askSaveDirectory(): string|null {
    const savePath = dialog.showOpenDialogSync({
        defaultPath: downloadPath,
        properties: ['openDirectory'],
    });

    return savePath ? savePath[0] : null;
}

export function askSaveFile(defaultName: string, extension: string = 'mp4'): string|null {
    const defaultPath = path.join(downloadPath, `${defaultName}.${extension}`);

    const savePath = dialog.showSaveDialogSync({
        defaultPath,
        properties: ['showOverwriteConfirmation'],
        filters: [{ name: extension, extensions: [`.${extension}`] }],
    });

    return savePath ? savePath : null;
}

export function askOpenFile(filters: FileFilter[]): string|null {
    const openPath = dialog.showOpenDialogSync({
        filters,
        defaultPath: downloadPath,
        properties: ['openFile'],
    });

    return openPath ? openPath[0] : null;
}
