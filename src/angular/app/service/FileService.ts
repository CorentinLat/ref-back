import { Injectable } from '@angular/core';
import path from 'path';

@Injectable({ providedIn: 'root' })
export class FileService {
    private readonly supportedVideoExtensions: string[] = ['mp4', 'mkv', 'mov', 'avi', 'webm', 'ogg', 'mts'];

    isFileSupported({ name }: File) {
        const regexResult = /\.(?<extension>[a-zA-Z\d]+)$/.exec(name);

        if (regexResult) {
            const extension = regexResult[1].toLowerCase();
            return this.supportedVideoExtensions.some(type => type.toLowerCase() === extension);
        }

        return false;
    }

    extractFileExtension({ name }: File) {
        return path.extname(name).slice(1).toLowerCase();
    }
}
