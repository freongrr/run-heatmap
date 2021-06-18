export function formatTime(timeString: string): string {
    // Raw format: 2014-12-07T05:54:07Z)
    // TODO : better format including local time?
    return timeString.substring(0, 10)
}

export function formatDuration(durationInMillis: number, includeMillis = false): string {
    let remainingInSeconds = Math.floor(durationInMillis / 1000);
    const parts: string[] = [];
    if (remainingInSeconds > 3600) {
        const hours = Math.floor(remainingInSeconds / 3600);
        remainingInSeconds = remainingInSeconds % 3600;
        parts.push(hours + 'h');
    }
    if (parts.length > 0 || remainingInSeconds > 60) {
        const minutes = Math.floor(remainingInSeconds / 60);
        remainingInSeconds = remainingInSeconds % 60;
        if (parts.length === 0) {
            parts.push(minutes + 'm');
        } else {
            parts.push(padWith0(minutes) + 'm');
        }
    }
    if (parts.length > 0 || remainingInSeconds > 0 || !includeMillis) {
        if (parts.length === 0) {
            parts.push(remainingInSeconds + 's');
        } else {
            parts.push(padWith0(remainingInSeconds) + 's');
        }
    }
    const millis = durationInMillis % 1000;
    if (includeMillis) {
        if (parts.length === 0) {
            parts.push(millis + 'ms');
        } else {
            parts.push(padWith0(millis, 3) + 'ms');
        }
    }
    return parts.join(' ');
}

function padWith0(n: number, l: number = 2): string {
    let s = '' + n;
    while (s.length < l) {
        s = '0' + s;
    }
    return s;
}
