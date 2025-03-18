import { IpcMainEvent } from 'electron';
import FluentFFMPEG from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

import { Game, isAction, NewGameInformation } from '../../../type/refBack';

import { CancelVideoProcessingError } from '../domain/error/CancelVideoProcessingError';
import { NoVideoError } from '../domain/error/NoVideoError';
import { UnexpectedError } from '../domain/error/UnexpectedError';

import { cancelCurrentDownload, downloadUrlToPath } from './download';
import { copyFileToPath, extractFileExtension, removeFile } from './file';
import { getDefaultGameVideoFilename } from './game';
import logger from './logger';
import { ffmpegElectronPath, ffprobeElectronPath, tempPath, workPath } from './path';
import throwIfNotEnoughRemainingSpaceForFilePaths from './storage';
import { getVideoUrlsFromVeoLinks } from './veo';

import translate from '../translation';

FluentFFMPEG.setFfmpegPath(ffmpegElectronPath);
FluentFFMPEG.setFfprobePath(ffprobeElectronPath);

const SUPPORTED_HTML_VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg'];

let currentFfmpegExecutions: { command: FluentFFMPEG.FfmpegCommand; outputPath: string }[] = [];

export async function handleVideoImport(gameInformation: NewGameInformation, event: IpcMainEvent): Promise<string> {
    const { gameNumber, video: { option, videoPaths, veoLinks } } = gameInformation;

    if (option === 'file' && videoPaths?.length) {
        await throwIfNotEnoughRemainingSpaceForFilePaths(videoPaths);

        if (videoPaths.length > 1) {
            return concatVideos(gameNumber, videoPaths, event);
        } else {
            return copyVideoToUserDataPath(gameNumber, videoPaths[0], event);
        }
    } else if (option === 'veo' && veoLinks?.length) {
        const videoUrls = await getVideoUrlsFromVeoLinks(veoLinks);

        return downloadVideoUrlsToUserDataPath(gameNumber, videoUrls, event);
    }

    throw new NoVideoError();
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

    await concatVideoPathsToNewPath(videoPaths, outputFileName, (progress: any) => {
        const currentSeconds = extractNumberOfSecondsFromTimeMark(progress.timemark);
        const percentageDone = Math.round(currentSeconds / totalDuration * 100);

        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.round(elapsedTime / percentageDone * (100 - percentageDone) / 1000);

        event.reply('videos_progress', { label: 'POST_PROCESSING', percentage: percentageDone, remaining: remainingTime });
    });

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

export async function downloadVideoUrlsToUserDataPath(gameNumber: string, urls: string[], event: IpcMainEvent): Promise<string> {
    if (!urls.length) {
        throw new NoVideoError();
    }

    if (urls.length === 1) {
        const videoName = generateVideoName();
        const downloadVideoPath = path.join(workPath, gameNumber, videoName);

        await downloadUrlToPath(urls[0], downloadVideoPath, event, 'DOWNLOAD_VEO_GAME');

        return downloadVideoPath;
    } else {
        const downloadedPaths: string[] = [];
        for (let halfTimeIndex = 0; halfTimeIndex < 2; halfTimeIndex++) {
            const videoName = `${halfTimeIndex + 1}_${generateVideoName()}`;
            const halfDownloadVideoPath = path.join(tempPath, gameNumber, videoName);
            await downloadUrlToPath(urls[halfTimeIndex], halfDownloadVideoPath, event, `DOWNLOAD_VEO_${halfTimeIndex + 1}_HALF`);

            downloadedPaths.push(halfDownloadVideoPath);
        }

        const downloadVideoPath = await concatVideos(gameNumber, downloadedPaths, event);

        downloadedPaths.forEach(downloadedPath => removeFile(downloadedPath));

        return downloadVideoPath;
    }
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
        const { clip } = action;
        if (!clip) {
            return Promise.resolve();
        }

        const clipName = isAction(action)
            ? `#${index + 1} ${translate(action.fault)}.${videoExtension}`
            : `#${index + 1} ${(action.comment || action.commentFromAdviser || '').slice(0, 20)}.${videoExtension}`;
        const clipPath = path.join(destClipsDirectory, clipName);
        const clipDuration = clip.end - clip.start;
        const startTime = Date.now();

        return cutVideoPathToNewPath(videoPath, clipPath, clip.start, clip.end, (progress: any) => {
            const currentSeconds = extractNumberOfSecondsFromTimeMark(progress.timemark);
            const percentageDone = Math.round(currentSeconds / clipDuration * 100);

            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.round(elapsedTime / percentageDone * (100 - percentageDone) / 1000);

            event.reply('clip_progress', { clip: index, percentage: percentageDone, remaining: remainingTime });
        });
    }));

    currentFfmpegExecutions = [];
}

export async function createClipFromVideoGame(event: IpcMainEvent, videoPath: string, begin: number, end: number, outputPath: string): Promise<void> {
    const clipDuration = end - begin;
    const startTime = Date.now();

    await cutVideoPathToNewPath(videoPath, outputPath, begin, end, (progress: any) => {
        const currentSeconds = extractNumberOfSecondsFromTimeMark(progress.timemark);
        const percentageDone = Math.round(currentSeconds / clipDuration * 100);

        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.round(elapsedTime / percentageDone * (100 - percentageDone) / 1000);

        event.reply('videos_progress', { percentage: percentageDone, remaining: remainingTime });
    });

    currentFfmpegExecutions = [];
}

export async function cutVideoGame(event: IpcMainEvent, videoPath: string, cuts: number[][]): Promise<string> {
    const newVideoPath = generateNewVideoPathInSameDirectory(videoPath);

    const startTime = Date.now();
    const totalDuration = cuts.reduce((acc, [begin, end]) => acc + (end - begin), 0) * 2;
    const secondsByCommand = Array(cuts.length + 1).fill(0);

    const clipsPath = await Promise.all(cuts.map(async ([begin, end], index) => {
        const clipPath = path.join(tempPath, `${path.basename(videoPath)}-${index}.mp4`);

        await cutVideoPathToNewPath(videoPath, clipPath, begin, end, (progress: any) => {
            secondsByCommand[index] = extractNumberOfSecondsFromTimeMark(progress.timemark);
            const totalSeconds = secondsByCommand.reduce((acc, val) => acc + val, 0);
            const percentageDone = Math.round(totalSeconds / totalDuration * 100);

            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.round(elapsedTime / percentageDone * (100 - percentageDone) / 1000);

            event.reply('videos_progress', { percentage: percentageDone, remaining: remainingTime });
        });

        return clipPath;
    }));

    await concatVideoPathsToNewPath(clipsPath, newVideoPath, (progress: any) => {
        secondsByCommand[cuts.length] = extractNumberOfSecondsFromTimeMark(progress.timemark);
        const totalSeconds = secondsByCommand.reduce((acc, val) => acc + val, 0);
        const percentageDone = Math.round(totalSeconds / totalDuration * 100);

        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.round(elapsedTime / percentageDone * (100 - percentageDone) / 1000);

        event.reply('videos_progress', { percentage: percentageDone, remaining: remainingTime });
    });

    clipsPath.forEach(clipPath => removeFile(clipPath));
    removeFile(videoPath);
    currentFfmpegExecutions = [];

    return newVideoPath;
}

const cutVideoPathToNewPath = async (videoPath: string, outputPath: string, begin: number, end: number, onProgress: (progress: any) => void): Promise<void> => {
    const clipDuration = end - begin;

    const command = FluentFFMPEG(videoPath)
        .setStartTime(begin).setDuration(clipDuration)
        .outputOptions('-c', 'copy')
        .on('progress', onProgress)
        .save(outputPath);

    currentFfmpegExecutions.push({ command, outputPath });
    await promisifyFfmpegCommand(command);
};

const concatVideoPathsToNewPath = async (videoPaths: string[], outputPath: string, onProgress: (progress: any) => void): Promise<void> => {
    const concatFileContent = videoPaths.map(videoPath => `file '${videoPath}'`).join('\n');
    const concatFilePath = path.join(tempPath, `${path.basename(outputPath)}-concat.txt`);
    fs.writeFileSync(concatFilePath, concatFileContent);

    const command = FluentFFMPEG()
        .input(concatFilePath).inputFormat('concat').inputOptions('-safe', '0')
        .audioCodec('copy').videoCodec('copy')
        .on('progress', onProgress)
        .save(outputPath);

    currentFfmpegExecutions.push({ command, outputPath });
    await promisifyFfmpegCommand(command);

    removeFile(concatFilePath);
};

export const generateNewVideoPath = (gameNumber: string, videoName: string): string =>
    path.join(workPath, gameNumber, videoName);

export const generateVideoName = (extension: string = 'mp4'): string =>
    `${Date.now().toString(10)}.${extension}`;

const generateNewVideoPathInSameDirectory = (videoPath: string): string =>
    path.join(path.dirname(videoPath), generateVideoName(extractFileExtension(videoPath)));

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
