export function getTimeFromDate(date: Date) {
    return formatTime(date.getHours(), date.getMinutes());
}

export function formatTime(hours: number, minutes: number): string {
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}:00`;
}