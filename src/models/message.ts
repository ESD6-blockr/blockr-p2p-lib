/**
 * Message model.
 */
export class Message {
    public type: string;
    public date: Date;
    public originalSenderGuid: string;
    public body?: string;

    constructor(type: string, originalSenderGuid: string, body?: string) {
        this.type = type;
        this.date = new Date();
        this.originalSenderGuid = originalSenderGuid;
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
