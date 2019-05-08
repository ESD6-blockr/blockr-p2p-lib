import { MessageType } from "../enums";

/**
 * Message model.
 */
export class Message {
    public type: MessageType;
    public senderId: string;
    public date: Date;
    public originalSenderId: string;
    public body?: string;

    constructor(type: MessageType, senderId: string, date: Date, originalSenderId: string, body?: string) {
        this.type = type;
        this.senderId = senderId;
        this.date = date;
        this.originalSenderId = originalSenderId;
        this.body = body;
    }
}
