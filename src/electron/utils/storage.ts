import checkDiskSpace from 'check-disk-space';
import fs from 'fs';

import { workPath } from './path';
import { NotEnoughSpaceError } from '../domain/error/NotEnoughSpaceError';

const safeRemainingSpace = 5 * 1024 * 1024 * 1024;

export default async function throwIfNotEnoughRemainingSpaceForFilePaths(filePaths: string[]): Promise<void> {
    const [diskSpace, fileSizes] = await Promise.all([
        checkDiskSpace(workPath),
        Promise.all(filePaths.map(filePath => fs.promises.stat(filePath))),
    ]);
    const filesTotalSize = fileSizes.reduce(((totalSize, { size }) => totalSize + size), 0);

    if (diskSpace.free - filesTotalSize <= safeRemainingSpace) {
        throw new NotEnoughSpaceError();
    }
}
