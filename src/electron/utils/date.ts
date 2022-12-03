export function getLongDateString(dateStr: string): string {
    const date = new Date(dateStr);
    const longDate = date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const longDateSplit = longDate.split(' ');

    return longDateSplit.map(str => `${str[0].toUpperCase()}${str.slice(1)}`).join(' ');
}

export function convertSecondsToMMSS(seconds: number): string {
    const secondsRounded = Math.floor(seconds);
    const minutesNbr = Math.floor(secondsRounded / 60);
    const minutesStr = minutesNbr.toString().padStart(2, '0');
    const secondsNbr = secondsRounded % 60;
    const secondsStr = secondsNbr.toString().padStart(2, '0');

    return minutesStr + ':' + secondsStr;
}
