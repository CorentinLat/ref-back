import { app } from 'electron';
import fs from 'fs';
import path from 'path';

export const downloadPath = app.getPath('downloads');
export const userDataPath = app.getPath('userData');
export const workPath = path.join(userDataPath, 'work');

export function checkMandatoryFolderExists() {
    if (!fs.existsSync(workPath)) {
        fs.mkdirSync(workPath, { recursive: true });
    }
}
