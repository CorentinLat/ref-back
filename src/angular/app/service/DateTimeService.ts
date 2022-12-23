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

    getCurrentSeasonYears(): string {
        const newSeasonStartMonth = 7;
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        const currentSeasonStartYear = currentMonth >= newSeasonStartMonth ? currentYear : currentYear - 1;
        const currentSeasonEndYear = currentSeasonStartYear + 1;
        return `${currentSeasonStartYear}${currentSeasonEndYear.toString().slice(-2)}`;
    }
}
