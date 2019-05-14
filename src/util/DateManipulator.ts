/**
 * Utility class for the manipulation for date objects.
 */
export class DateManipulator {
    /**
     * Get a date minus the given minutes.
     *
     * @param date - The starting date
     * @param minutes - The amount of minutes to subtract
     *
     * @returns The date minus the given minutes
     */
    public static minusMinutes(date: Date, minutes: number): Date {
        return new Date(date.getTime() - minutes * 60000);
    }
}
