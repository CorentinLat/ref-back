import { dialog } from 'electron';
import path from 'path';

import { extractFileExtension } from './file';
import { Game } from './game';
import { downloadPath } from './path';

export function askSaveVideoPath(game: Game): string|null {
    const fileName = game.information.gameNumber;
    const extension = extractFileExtension(game.information.videoPath);
    const defaultPath = path.join(downloadPath, `${fileName}.${extension}`);

    const savePath = dialog.showSaveDialogSync({
        defaultPath,
        filters: [{ name: extension, extensions: [`.${extension}`] }],
    });

    return savePath ? savePath : null;
}
