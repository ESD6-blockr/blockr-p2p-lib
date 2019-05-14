/**
 * Message model.
 */
export class Message {
    public type: string;
    public date: Date;
    public originalSenderId?: string;
    public body?: string;

    constructor(type: string, originalSenderId?: string, body?: string) {
        this.type = type;
        this.date = new Date();
        this.originalSenderId = originalSenderId;
        this.body = body;
    }

    /**
     * Check if this message is older than the given date.
     *
     * @param date - The date
     *
     * @returns True if this message is older than the given date, false if otherwise
     */
    public isOlderThan(date: Date): boolean {
        return this.date < date;
    }
}
