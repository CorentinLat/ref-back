import checkDiskSpace from 'check-disk-space';
import fs from 'fs';

import { workPath } from './path';

const safeRemainingSpace = 5 * 1024 * 1024 * 1024;

export default async function hasEnoughRemainingSpaceForFilePaths(filePaths: string[]): Promise<boolean> {
    const [diskSpace, fileSizes] = await Promise.all([
        checkDiskSpace(workPath),
        Promise.all(filePaths.map(filePath => fs.promises.stat(filePath))),
    ]);
    const filesTotalSize = fileSizes.reduce(((totalSize, { size }) => totalSize + size), 0);

    return diskSpace.free - filesTotalSize > safeRemainingSpace;
}
