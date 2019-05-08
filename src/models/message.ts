import { MessageType } from "../enums";

/**
 * Message model.
 */
export class Message {
    public type: MessageType;
    public text: string;
    public senderId: string;
    public date: Date;
    public originalSenderId: string;

    constructor(type: MessageType, text: string, senderId: string, date: Date, originalSenderId: string) {
        this.type = type;
        this.text = text;
        this.senderId = senderId;
        this.date = date;
        this.originalSenderId = originalSenderId;
    }
}
