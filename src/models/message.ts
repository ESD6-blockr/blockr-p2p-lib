import { Guid } from "guid-typescript";

/**
 * Message model.
 */
export class Message {
    public guid: string;
    public type: string;
    public date: Date;
    public originalSenderGuid: string;
    public body?: string;

    constructor(type: string, originalSenderGuid: string, body?: string) {
        this.guid = Guid.createEmpty().toString();
        this.type = type;
        this.date = new Date();
        this.originalSenderGuid = originalSenderGuid;
        this.body = body;
    }

    /**
     * Create a guid for this message if guid has not been created yet.
     */
    public createGuid() {
        if (this.guid === Guid.EMPTY) {
            this.guid = Guid.create().toString();
        }
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
