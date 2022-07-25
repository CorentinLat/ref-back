import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FileService {
    private readonly supportedVideoExtensions: string[] = ['mp4', 'mkv', 'mov', 'avi'];

    isFileSupported({ name }: File) {
        const regexResult = /\.(?<extension>[a-zA-Z\d]+)$/.exec(name);

        if (regexResult) {
            const extension = regexResult[1].toLowerCase();
            return this.supportedVideoExtensions.some(type => type.toLowerCase() === extension);
        }

        return false;
    }
}