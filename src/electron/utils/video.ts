import FluentFFMPEG from 'fluent-ffmpeg';
import path from 'path';

import IpcMainEvent = Electron.IpcMainEvent;

import { CancelVideoProcessingError } from '../domain/error/CancelVideoProcessingError';
import { NoVideoError } from '../domain/error/NoVideoError';
import { UnexpectedError } from '../domain/error/UnexpectedError';

import { cancelCurrentDownload, downloadUrlToPath } from './download';
import { copyFileToPath, extractFileExtension } from './file';
import { Game, getDefaultGameVideoFilename, NewGameInformation } from './game';
import logger from './logger';
import { ffmpegElectronPath, ffprobeElectronPath, workPath } from './path';
import throwIfNotEnoughRemainingSpaceForFilePaths from './storage';
import { getVideoUrlFromVeo } from './veo';

import translate from '../translation';

FluentFFMPEG.setFfmpegPath(ffmpegElectronPath);
FluentFFMPEG.setFfprobePath(ffprobeElectronPath);

const SUPPORTED_HTML_VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg'];

let currentCommands: FluentFFMPEG.FfmpegCommand[] = [];

export async function handleVideoImport(gameInformation: NewGameInformation, event: IpcMainEvent): Promise<string> {
    const { gameNumber, video: { option, videoPaths, veo } } = gameInformation;

    let videoPath;
    if (option === 'file' && videoPaths?.length) {
        await throwIfNotEnoughRemainingSpaceForFilePaths(videoPaths);

        if (videoPaths.length > 1) {
            videoPath = await concatVideos(gameNumber, videoPaths, event);
        } else {
            videoPath = await copyVideoToUserDataPath(gameNumber, videoPaths[0], event);
        }
    } else if (option === 'veo' && veo) {
        const videoUrl = await getVideoUrlFromVeo(veo);
        videoPath = await downloadVideoUrlToUserDataPath(gameNumber, videoUrl, event);
    } else {
        throw new NoVideoError();
    }

    return videoPath;
}

export async function concatVideos(gameNumber: string, videoPaths: string[], event: IpcMainEvent): Promise<string> {
    logger.info(`Concat videos: ${videoPaths.join(', ')}`);

    const videoExtensions = new Set<string>();
    videoPaths.forEach(videoPath => videoExtensions.add(extractFileExtension(videoPath)));
    if (videoExtensions.size > 1) {
        throw new UnexpectedError();
    }

    const videoName: string = generateVideoName();
    const outputFileName = path.join(workPath, gameNumber, videoName);

    const totalDuration = await computeTotalDurationOfVideos(videoPaths);

    const command = FluentFFMPEG().videoBitrate('4600k');
    currentCommands.push(command);
    const startTime = Date.now();

    videoPaths.forEach(videoPath => command.input(videoPath));
    return new Promise((resolve, reject) => {
        command
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
                    return reject(new CancelVideoProcessingError());
                }

                logger.error(`error concatVideos: ${err}`);
                reject(err);
            })
            .on('end', () => {
                logger.info(`Concat videos succeeded: ${outputFileName}`);

                currentCommands = [];
                resolve(outputFileName);
            })
            .mergeToFile(outputFileName);
    });
}

export function cancelCurrentVideoCommands(): void {
    currentCommands.forEach(command => command.kill('SIGKILL'));
    currentCommands = [];

    cancelCurrentDownload();
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

export async function downloadVideoUrlToUserDataPath(gameNumber: string, url: string, event: IpcMainEvent): Promise<string> {
    const videoName: string = generateVideoName();
    const outputFileName = path.join(workPath, gameNumber, videoName);

    await downloadUrlToPath(url, outputFileName, event);

    return outputFileName;
}

export async function downloadAllVideosGame(game: Game, destDirectory: string, event: IpcMainEvent): Promise<void> {
    const videoName = getDefaultGameVideoFilename(game);
    const extension = extractFileExtension(game.information.videoPath);
    const gameVideoPath = path.join(destDirectory, `${videoName}.${extension}`);
    copyGameVideoToPath(game, gameVideoPath);

    await generateGameClips(game, destDirectory, event);
}

export function copyGameVideoToPath(game: Game, destVideoPath: string): void {
    const currentVideoPath = game.information.videoPath;

    copyFileToPath(currentVideoPath, destVideoPath);
}

export async function generateGameClips(game: Game, destClipsDirectory: string, event: IpcMainEvent): Promise<void> {
    const { videoPath } = game.information;
    const videoExtension = extractFileExtension(videoPath);

    await Promise.all(game.actions.map((action, index) => {
        const { fault, clip } = action;
        if (!clip) {
            return Promise.resolve();
        }

        const clipName = `#${index + 1} ${translate(fault)}.${videoExtension}`;
        const clipPath = path.join(destClipsDirectory, clipName);
        const clipDuration = clip.end - clip.start;

        const command = FluentFFMPEG(videoPath)
            .setStartTime(clip.start)
            .setDuration(clipDuration);
        currentCommands.push(command);
        const startTime = Date.now();

        return new Promise<void>((resolve, reject) => {
            command
                .on('progress', (progress: any) => {
                    const currentSeconds = extractNumberOfSecondsFromTimeMark(progress.timemark);
                    const percentageDone = Math.round(currentSeconds / clipDuration * 100);

                    const elapsedTime = Date.now() - startTime;
                    const remainingTime = Math.round(elapsedTime / percentageDone * (100 - percentageDone) / 1000);

                    event.reply('clip_progress', { clip: index, percentage: percentageDone, remaining: remainingTime });
                })
                .on('error', (err: Error) => {
                    if (err.message.includes('SIGKILL')) {
                        logger.info(`Generate clip cancelled: ${clipName}`);
                        return reject(new CancelVideoProcessingError());
                    }

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

function generateVideoName(extension: string = 'mp4'): string {
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
        }),
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
