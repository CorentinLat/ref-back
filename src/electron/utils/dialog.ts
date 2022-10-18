import { dialog } from 'electron';
import path from 'path';

import { extractFileExtension } from './file';
import { Game, getDefaultGameVideoFilename } from './game';
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
