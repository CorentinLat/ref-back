import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DateTimeService {
    convertSecondsToMMSS(seconds: number): string {
        const secondsRounded = Math.floor(seconds);
        const minutesNbr = Math.floor(secondsRounded / 60);
        const minutesStr = minutesNbr.toString().padStart(2, '0');
        const secondsNbr = secondsRounded % 60;
        const secondsStr = secondsNbr.toString().padStart(2, '0');

        return minutesStr + ':' + secondsStr;
    }

    getLastSundayDate(): string {
        const today = new Date();
        const lastSunday = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);

        return lastSunday.toISOString().split('T')[0];
    }
}
