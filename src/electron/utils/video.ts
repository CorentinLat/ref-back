import ffmpegElectron from 'ffmpeg-static-electron';
import ffprobeElectron from 'ffprobe-static-electron';
import FluentFFMPEG from 'fluent-ffmpeg';
import path from 'path';

import IpcMainEvent = Electron.IpcMainEvent;

import { Game, getDefaultGameVideoFilename } from './game';
import logger from './logger';
import { copyFileToPath, extractFileExtension } from './file';
import { workPath } from './path';

FluentFFMPEG.setFfmpegPath(ffmpegElectron.path);
FluentFFMPEG.setFfprobePath(ffprobeElectron.path);

const SUPPORTED_HTML_VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg'];

export async function concatVideos(gameNumber: string, videoPaths: string[], event: IpcMainEvent): Promise<string> {
    logger.info(`Concat videos: ${videoPaths.join(', ')}`);

    const videoExtensions = new Set<string>();
    videoPaths.forEach(videoPath => videoExtensions.add(extractFileExtension(videoPath)));
    if (videoExtensions.size > 1) {
        throw new Error();
    }

    const videoName: string = generateVideoName();
    const outputFileName = path.join(workPath, gameNumber, videoName);

    const totalDuration = await computeTotalDurationOfVideos(videoPaths);

    const command = FluentFFMPEG();
    videoPaths.forEach(videoPath => command.input(videoPath));
    return new Promise((resolve, reject) => {
        command
            .on('progress', (progress: { timemark: string }) => {
                const currentSeconds = extractNumberOfSecondsFromTimeMark(progress.timemark);
                const percentageDone = Math.min(currentSeconds / totalDuration * 100, 100);
                event.reply('videos_progress', percentageDone);
            })
            .on('error', (err: Error) => {
                logger.error(`error concatVideos: ${err}`);
                reject(err);
            })
            .on('end', () => {
                logger.info(`Concat videos succeeded: ${outputFileName}`);
                resolve(outputFileName);
            })
            .videoBitrate('4600k')
            .mergeToFile(outputFileName);
    });
}

export async function copyVideoToUserDataPath(gameNumber: string, videoPath: string, event: IpcMainEvent): Promise<string> {
    const currentVideoExtension = extractFileExtension(videoPath);

    if (SUPPORTED_HTML_VIDEO_EXTENSIONS.includes(currentVideoExtension)) {
        const videoName: string = generateVideoName(currentVideoExtension);
        const outputFileName = path.join(workPath, gameNumber, videoName);

        copyFileToPath(videoPath, outputFileName);
        logger.info(`Copy video succeeded: ${outputFileName}`);
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
