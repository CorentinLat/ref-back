import ffmpegElectron from 'ffmpeg-static-electron';
import ffprobeElectron from 'ffprobe-static-electron';
import FluentFFMPEG from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

import IpcMainEvent = Electron.IpcMainEvent;

import logger from './logger';
import { workPath } from './path';

FluentFFMPEG.setFfmpegPath(ffmpegElectron.path);
FluentFFMPEG.setFfprobePath(ffprobeElectron.path);

export async function concatVideos(videoPaths: string[], event: IpcMainEvent): Promise<string> {
    logger.info(`Concat videos: ${videoPaths.join(', ')}`);

    const videoName: string = generateVideoName();
    const outputFileName = path.join(workPath, videoName);

    const totalDuration = await computeTotalDurationOfVideos(videoPaths);

    const command = new FluentFFMPEG();
    videoPaths.forEach(videoPath => command.input(videoPath));
    return new Promise((resolve, reject) => {
        command
            .on('progress', (progress: { timemark: string }) => {
                const currentSeconds = extractNumberOfSecondsFromTimeMark(progress.timemark);
                const percentageDone = Math.min(currentSeconds / totalDuration * 100, 100);
                event.reply('process_videos_progress', percentageDone);
            })
            .on('error', (err: Error) => {
                logger.error(`error concatVideos: ${err}`);
                reject(err);
            })
            .on('end', () => {
                logger.info(`Concat videos succeeded: ${outputFileName}`);
                resolve(outputFileName);
            })
            .mergeToFile(outputFileName, workPath);
    });
}

export function copyVideoToUserDataPath(videoPath: string): string {
    const currentVideoExtension = path.extname(videoPath);
    const videoName: string = generateVideoName(currentVideoExtension);
    const outputFileName = path.join(workPath, videoName);

    fs.copyFileSync(videoPath, outputFileName);

    logger.info(`Copy video succeeded: ${outputFileName}`);
    return outputFileName;
}

function generateVideoName(extension: string = '.mp4'): string {
    return `${Date.now().toString(10)}${extension}`;
}

async function computeTotalDurationOfVideos(videoPaths: string[]): Promise<number> {
    const durations = await Promise.all(videoPaths.map(async videoPath =>
        await new Promise<number>((resolve, reject) => {
            FluentFFMPEG.ffprobe(videoPath, function(err: Error, data: { format: { duration: number } }) {
                if (err) {
                    reject(err);
                }

                resolve(data.format.duration);
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
