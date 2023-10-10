import FluentFFMPEG from 'fluent-ffmpeg';
import path from 'path';

import IpcMainEvent = Electron.IpcMainEvent;

import { Game, getDefaultGameVideoFilename } from './game';
import logger from './logger';
import { copyFileToPath, extractFileExtension } from './file';
import { ffmpegElectronPath, ffprobeElectronPath, workPath } from './path';

logger.info(`ffmpegElectronPath: ${ffmpegElectronPath}`);

FluentFFMPEG.setFfmpegPath(ffmpegElectronPath);
FluentFFMPEG.setFfprobePath(ffprobeElectronPath);

const SUPPORTED_HTML_VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg'];

let currentCommand: FluentFFMPEG.FfmpegCommand | null = null;

export async function concatVideos(gameNumber: string, videoPaths: string[], event: IpcMainEvent): Promise<string> {
    logger.info(`Concat videos: ${videoPaths.join(', ')}`);

    const videoExtensions = new Set<string>();
    videoPaths.forEach(videoPath => videoExtensions.add(extractFileExtension(videoPath)));
    if (videoExtensions.size > 1) { throw new Error(); }

    const videoName: string = generateVideoName();
    const outputFileName = path.join(workPath, gameNumber, videoName);

    const totalDuration = await computeTotalDurationOfVideos(videoPaths);

    currentCommand = FluentFFMPEG();
    const startTime = Date.now();

    // @ts-ignore
    videoPaths.forEach(videoPath => currentCommand.input(videoPath));
    return new Promise((resolve, reject) => {
        // @ts-ignore
        currentCommand
            .on('progress', (progress: { timemark: string }) => {
                const currentSeconds = extractNumberOfSecondsFromTimeMark(progress.timemark);
                const percentageDone = Math.min(currentSeconds / totalDuration * 100, 100);

                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.round(elapsedTime / percentageDone * (100 - percentageDone) / 1000);

                event.reply('videos_progress', { percentage: percentageDone, remaining: remainingTime });
            })
            .on('error', (err: Error) => {
                if (err.message.includes('SIGKILL')) {
                    logger.info(`Concat videos cancelled: ${outputFileName}`);
                    return reject({ cancelled: true });
                }

                logger.error(`error concatVideos: ${err}`);
                reject(err);
            })
            .on('end', () => {
                logger.info(`Concat videos succeeded: ${outputFileName}`);

                currentCommand = null;
                resolve(outputFileName);
            })
            .videoBitrate('4600k')
            .mergeToFile(outputFileName);
    });
}

export function cancelCurrentVideoCommand(): void {
    if (currentCommand) {
        currentCommand.kill('SIGKILL');
        currentCommand = null;
    }
}

export async function copyVideoToUserDataPath(gameNumber: string, videoPath: string, event: IpcMainEvent): Promise<string> {
    const currentVideoExtension = extractFileExtension(videoPath);

    if (SUPPORTED_HTML_VIDEO_EXTENSIONS.includes(currentVideoExtension)) {
        const videoName: string = generateVideoName(currentVideoExtension);
        const outputFileName = path.join(workPath, gameNumber, videoName);

        copyFileToPath(videoPath, outputFileName);
        return Promise.resolve(outputFileName);
    } else {
        logger.info(`Format not supported: ${currentVideoExtension}. Converting to mp4...`);
        return await concatVideos(gameNumber, [videoPath], event);
    }
}

export async function downloadAllVideosGame(game: Game, destDirectory: string): Promise<void> {
    const videoName = getDefaultGameVideoFilename(game);
    const extension = extractFileExtension(game.information.videoPath);
    const gameVideoPath = path.join(destDirectory, `${videoName}.${extension}`);
    copyGameVideoToPath(game, gameVideoPath);

    await generateGameClips(game, destDirectory);
}

export function copyGameVideoToPath(game: Game, destVideoPath: string): void {
    const currentVideoPath = game.information.videoPath;

    copyFileToPath(currentVideoPath, destVideoPath);
}

export async function generateGameClips(game: Game, destClipsDirectory: string): Promise<void> {
    const { videoPath } = game.information;
    const videoExtension = extractFileExtension(videoPath);

    let clipsIndex = 0;
    await Promise.all(game.actions.map(action => {
        const { fault, clip } = action;
        if (!clip) {
            return Promise.resolve();
        }

        clipsIndex++;
        const clipName = `#${clipsIndex} ${fault}.${videoExtension}`;
        const clipPath = path.join(destClipsDirectory, clipName);

        return new Promise<void>((resolve, reject) => {
            FluentFFMPEG(videoPath)
                .setStartTime(clip.start)
                .setDuration(clip.end - clip.start)
                .on('error', (err: Error) => {
                    logger.error(`error generateGameClips: ${err}`);
                    reject(err);
                })
                .on('end', () => {
                    logger.info(`Generate clip succeeded: ${clipPath}`);
                    resolve();
                })
                .save(clipPath);
        });
    }));
}

function generateVideoName(extension: string = 'webm'): string {
    return `${Date.now().toString(10)}.${extension}`;
}

async function computeTotalDurationOfVideos(videoPaths: string[]): Promise<number> {
    const durations = await Promise.all(videoPaths.map(videoPath =>
        new Promise<number>((resolve, reject) => {
            FluentFFMPEG.ffprobe(videoPath, function(err: Error, data: { format: { duration?: number } }) {
                if (err) {
                    reject(err);
                }

                resolve(data.format.duration ?? 0);
            });
        })
    ));

    return durations.reduce<number>((acc, val) => acc + val, 0);
}

function extractNumberOfSecondsFromTimeMark(timeMark: string): number {
    const regex = /^(?<HH>\d{2}):(?<MM>\d{2}):(?<SS>\d{2})\.(?<MS>\d{2})$/;
    const regexResult = regex.exec(timeMark);

    const HH = Number.parseInt(regexResult?.groups?.HH || '0', 10);
    const MM = Number.parseInt(regexResult?.groups?.MM || '0', 10);
    const SS = Number.parseInt(regexResult?.groups?.SS || '0', 10);
    const MS = Number.parseInt(regexResult?.groups?.MS || '0', 10);

    return HH * 3600 + MM * 60 + SS + MS / 100;
}
