import { BrowserWindow, DownloadItem, IpcMainEvent } from 'electron';

import { CancelVideoProcessingError } from '../domain/error/CancelVideoProcessingError';
import { UnexpectedError } from '../domain/error/UnexpectedError';

import logger from './logger';

let currentDownloadItem: DownloadItem | null = null;

export const downloadUrlToPath = async (url: string, destPath: string, electronEvent: IpcMainEvent, label?: string): Promise<void> =>
    new Promise((resolve, reject) => {
        const window = BrowserWindow.getFocusedWindow();
        if (!window) {
            return reject(new UnexpectedError());
        }

        window.webContents.session.on('will-download', (_, item) => {
            currentDownloadItem = item;

            currentDownloadItem.setSavePath(destPath);

            item.on('updated', () => {
                if (currentDownloadItem) {
                    electronEvent.reply('videos_progress', computePercentageAndRemainingTime(label));
                }
            });

            item.on('done', (__, state) => {
                currentDownloadItem = null;

                if (state === 'completed') {
                    logger.info(`File downloaded: ${destPath}`);
                    resolve();
                } else if (state === 'cancelled') {
                    logger.info('Download cancelled');
                    reject(new CancelVideoProcessingError());
                } else {
                    logger.error(`File download failed: ${state}`);
                    reject(new UnexpectedError());
                }
            });
        });

        window.webContents.downloadURL(url);
        logger.info(`Starting download from ${url} to ${destPath}`);
    });

export const cancelCurrentDownload = (): void => currentDownloadItem?.cancel();

const computePercentageAndRemainingTime = (label?: string) => {
    if (!currentDownloadItem) {
        return null;
    }

    const totalSize = currentDownloadItem.getTotalBytes();
    if (totalSize === 0) {
        return null;
    }

    const receivedBytes = currentDownloadItem.getReceivedBytes();
    const percentage = Math.min(receivedBytes / totalSize * 100, 100);

    const startTime = currentDownloadItem.getStartTime() * 1000;
    const elapsedTime = Date.now() - startTime;
    const remaining = Math.round(elapsedTime / percentage * (100 - percentage) / 1000);

    return { percentage, remaining, label };
};
