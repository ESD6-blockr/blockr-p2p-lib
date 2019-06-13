const MILLIS_IN_SECONDS: number = 1000;

/**
 * Utility class for the manipulation for date objects.
 */
export class DateManipulator {
    /**
     * Get a date minus the given minutes.
     *
     * @param date - The starting date
     * @param seconds - The amount of seconds to subtract
     *
     * @returns The date minus the given seconds
     */
    public static minusSeconds(date: Date, seconds: number): Date {
        return new Date(date.getTime() - seconds * MILLIS_IN_SECONDS);
    }

    /**
     * Check if the date is older than the given date.
     *
     * @param oldDate - The old date
     * @param newDate - The new date
     *
     * @returns True if the old date is older than the given date, false if otherwise
     */
    public static isDateOlderThan(oldDate: Date, newDate: Date): boolean {
        return oldDate < newDate;
    }
}
