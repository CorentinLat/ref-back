import checkDiskSpace from 'check-disk-space';
import fs from 'fs';

import { NotEnoughSpaceError } from '../domain/error/NotEnoughSpaceError';

import { workPath } from './path';

const safeRemainingSpace = 5 * 1024 * 1024 * 1024;

export async function checkIfHasEnoughRemainingSpaceForFileSize(size: number): Promise<boolean> {
    const diskSpace = await checkDiskSpace(workPath);

    return diskSpace.free - size > safeRemainingSpace;
}

export async function throwIfNotEnoughRemainingSpaceForFilePaths(filePaths: string[]): Promise<void> {
    const fileSizes= await Promise.all(filePaths.map(filePath => fs.promises.stat(filePath)));
    const filesTotalSize = fileSizes.reduce(((totalSize, { size }) => totalSize + size), 0);

    const hasEnoughSpace = await checkIfHasEnoughRemainingSpaceForFileSize(filesTotalSize);
    if (!hasEnoughSpace) throw new NotEnoughSpaceError();
}
