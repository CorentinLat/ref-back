import fs from 'fs';
import path from 'path';

export function copyFileToPath(filePath: string, newFilePath: string): void {
    fs.copyFileSync(filePath, newFilePath);
}

export function extractFileExtension(fileName: string): string {
    return path.extname(fileName).slice(1).toLowerCase();
}
