import FluentFFMPEG from 'fluent-ffmpeg';
import path from 'path';

import IpcMainEvent = Electron.IpcMainEvent;

import { Game, NewGameInformation } from '../../../type/refBack';

import { CancelVideoProcessingError } from '../domain/error/CancelVideoProcessingError';
import { NoVideoError } from '../domain/error/NoVideoError';
import { UnexpectedError } from '../domain/error/UnexpectedError';

import { cancelCurrentDownload, downloadUrlToPath } from './download';
import { copyFileToPath, extractFileExtension, removeFile } from './file';
import { getDefaultGameVideoFilename } from './game';
import logger from './logger';
import { ffmpegElectronPath, ffprobeElectronPath, tempPath, workPath } from './path';
import throwIfNotEnoughRemainingSpaceForFilePaths from './storage';
import { getVideoUrlFromVeo } from './veo';

import translate from '../translation';

FluentFFMPEG.setFfmpegPath(ffmpegElectronPath);
FluentFFMPEG.setFfprobePath(ffprobeElectronPath);

const SUPPORTED_HTML_VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg'];

let currentFfmpegExecutions: { command: FluentFFMPEG.FfmpegCommand; outputPath: string }[] = [];

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
    const outputFileName = generateNewVideoPath(gameNumber, videoName);

    const totalDuration = await computeTotalDurationOfVideos(videoPaths);
    const startTime = Date.now();

    const command = FluentFFMPEG().videoBitrate('4600k');
    currentFfmpegExecutions.push({ command, outputPath: outputFileName });
    videoPaths.forEach(videoPath => command.input(videoPath));
    command
        .on('progress', (progress: any) => {
            const currentSeconds = extractNumberOfSecondsFromTimeMark(progress.timemark);
            const percentageDone = Math.round(currentSeconds / totalDuration * 100);

            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.round(elapsedTime / percentageDone * (100 - percentageDone) / 1000);

            event.reply('videos_progress', { percentage: percentageDone, remaining: remainingTime });
        })
        .mergeToFile(outputFileName, tempPath);
    await promisifyFfmpegCommand(command);
    currentFfmpegExecutions = [];

    return outputFileName;
}

export async function cancelCurrentVideoCommands(): Promise<void> {
    await Promise.all(currentFfmpegExecutions.map(async ({ command, outputPath }) => {
        command.kill('SIGKILL');

        // Waiting to ensure process is killed
        await new Promise(resolve => setTimeout(resolve, 1000));
        removeFile(outputPath);
    }));
    currentFfmpegExecutions = [];

    cancelCurrentDownload();
}

export async function copyVideoToUserDataPath(gameNumber: string, videoPath: string, event: IpcMainEvent): Promise<string> {
    const currentVideoExtension = extractFileExtension(videoPath);

    if (SUPPORTED_HTML_VIDEO_EXTENSIONS.includes(currentVideoExtension)) {
        const videoName: string = generateVideoName(currentVideoExtension);
        const outputFileName = generateNewVideoPath(gameNumber, videoName);

        copyFileToPath(videoPath, outputFileName);
        return Promise.resolve(outputFileName);
    } else {
        logger.info(`Format not supported: ${currentVideoExtension}. Converting to mp4...`);
        return await concatVideos(gameNumber, [videoPath], event);
    }
}

export async function downloadVideoUrlToUserDataPath(gameNumber: string, url: string, event: IpcMainEvent): Promise<string> {
    const videoName = generateVideoName();
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
        const startTime = Date.now();

        const command = FluentFFMPEG(videoPath)
            .setStartTime(clip.start)
            .setDuration(clipDuration)
            .on('progress', (progress: any) => {
                const currentSeconds = extractNumberOfSecondsFromTimeMark(progress.timemark);
                const percentageDone = Math.round(currentSeconds / clipDuration * 100);

                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.round(elapsedTime / percentageDone * (100 - percentageDone) / 1000);

                event.reply('clip_progress', { clip: index, percentage: percentageDone, remaining: remainingTime });
            })
            .save(clipPath);

        currentFfmpegExecutions.push({ command, outputPath: clipPath });

        return promisifyFfmpegCommand(command);
    }));

    currentFfmpegExecutions = [];
}

export async function createClipFromVideoGame(event: IpcMainEvent, videoPath: string, begin: number, end: number, outputPath: string): Promise<void> {
    const clipDuration = end - begin;
    const startTime = Date.now();

    const command = FluentFFMPEG(videoPath)
        .setStartTime(begin)
        .setDuration(clipDuration)
        .on('progress', (progress: any) => {
            const currentSeconds = extractNumberOfSecondsFromTimeMark(progress.timemark);
            const percentageDone = Math.round(currentSeconds / clipDuration * 100);

            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.round(elapsedTime / percentageDone * (100 - percentageDone) / 1000);

            event.reply('videos_progress', { percentage: percentageDone, remaining: remainingTime });
        })
        .save(outputPath);

    currentFfmpegExecutions.push({ command, outputPath });
    await promisifyFfmpegCommand(command);
    currentFfmpegExecutions = [];
}

export async function cutVideoGame(event: IpcMainEvent, videoPath: string, cuts: number[][]): Promise<string> {
    const newVideoPath = generateNewVideoPathInSameDirectory(videoPath);

    const startTime = Date.now();
    const totalDuration = cuts.reduce((acc, [begin, end]) => acc + (end - begin), 0) * 2;
    const secondsByCommand = Array(cuts.length + 1).fill(0);

    const clipsPath = await Promise.all(cuts.map(async ([begin, end], index) => {
        const clipDuration = end - begin;
        const clipPath = path.join(tempPath, `${path.basename(videoPath)}-${index}.mp4`);

        const command = FluentFFMPEG(videoPath)
            .setStartTime(begin)
            .setDuration(clipDuration)
            .on('progress', (progress: any) => {
                secondsByCommand[index] = extractNumberOfSecondsFromTimeMark(progress.timemark);
                const totalSeconds = secondsByCommand.reduce((acc, val) => acc + val, 0);
                const percentageDone = Math.round(totalSeconds / totalDuration * 100);

                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.round(elapsedTime / percentageDone * (100 - percentageDone) / 1000);

                event.reply('videos_progress', { percentage: percentageDone, remaining: remainingTime });
            })
            .save(clipPath);
        currentFfmpegExecutions.push({ command, outputPath: clipPath });
        await promisifyFfmpegCommand(command);

        return clipPath;
    }));

    const mergeCommand = FluentFFMPEG();
    currentFfmpegExecutions.push({ command: mergeCommand, outputPath: newVideoPath });
    clipsPath.forEach(clipPath => mergeCommand.mergeAdd(clipPath));
    mergeCommand
        .on('progress', (progress: any) => {
            secondsByCommand[cuts.length] = extractNumberOfSecondsFromTimeMark(progress.timemark);
            const totalSeconds = secondsByCommand.reduce((acc, val) => acc + val, 0);
            const percentageDone = Math.round(totalSeconds / totalDuration * 100);

            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.round(elapsedTime / percentageDone * (100 - percentageDone) / 1000);

            event.reply('videos_progress', { percentage: percentageDone, remaining: remainingTime });
        })
        .mergeToFile(newVideoPath, tempPath);
    await promisifyFfmpegCommand(mergeCommand);

    clipsPath.forEach(clipPath => removeFile(clipPath));
    removeFile(videoPath);
    currentFfmpegExecutions = [];

    return newVideoPath;
}

const generateNewVideoPathInSameDirectory = (videoPath: string): string =>
    path.join(path.dirname(videoPath), generateVideoName(extractFileExtension(videoPath)));

const generateNewVideoPath = (gameNumber: string, videoName: string): string =>
    path.join(workPath, gameNumber, videoName);

const generateVideoName = (extension: string = 'mp4'): string =>
    `${Date.now().toString(10)}.${extension}`;

const promisifyFfmpegCommand = (command: FluentFFMPEG.FfmpegCommand): Promise<void> =>
    new Promise((resolve, reject) => {
        command
            .on('error', (err: Error) => {
                if (err.message.includes('SIGKILL')) {
                    logger.info(`Video processing cancelled`);
                    return reject(new CancelVideoProcessingError());
                }

                logger.error(`Error on video processing: ${err}`);
                reject(err);
            })
            .on('end', () => {
                logger.info(`Video processing succeeded`);
                resolve();
            });
    });

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
