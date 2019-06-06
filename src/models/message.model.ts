import { Guid } from "guid-typescript";

/**
 * Message model.
 */
export class Message {
    public guid: string;
    public type: string;
    public date: Date;
    public originalSenderGuid?: string;
    public body?: string;
    public correlationId: string;
    public senderIp?: string;
    public recieverIp?: string;


    /**
     * Creates an instance of message.
     * 
     * @param type
     * @param originalSenderGuid
     * @param [body]
     * @param [correlationId]
     */
    constructor(type: string, body?: string, originalSenderGuid?: string, correlationId?: string) {
        this.guid = Guid.create().toString();
        this.type = type;
        this.date = new Date();
        this.originalSenderGuid = originalSenderGuid;
        this.body = body;
        this.correlationId = (correlationId) ? correlationId : this.guid;
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
