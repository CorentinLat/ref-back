import IpcMain = Electron.IpcMain;
import IpcMainEvent = Electron.IpcMainEvent;

import { concatVideos, copyVideoToUserDataPath } from './utils/video';

export default function(ipcMain: IpcMain) {
    ipcMain.on('process_videos_imported', onConcatVideosListener);
}

const onConcatVideosListener = async (event: IpcMainEvent, videoPaths: string[]) => {
    if (!videoPaths.length) {
        event.reply('process_videos_failed');
    }

    try {
        let matchVideoPath;
        if (videoPaths.length > 1) {
            matchVideoPath = await concatVideos(videoPaths, event);
        } else {
            matchVideoPath = copyVideoToUserDataPath(videoPaths[0]);
        }

        event.reply('process_videos_succeeded', matchVideoPath);
    } catch (_) {
        event.reply('process_videos_failed');
    }
};
