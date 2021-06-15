export function formatTime(timeString: string): string {
    // Raw format: 2014-12-07T05:54:07Z)
    // TODO : better format including local time?
    return timeString.substring(0, 10)
}
