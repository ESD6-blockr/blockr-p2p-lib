/**
 * Message model.
 */
export class Message {
    public type: string;
    public date: Date;
    public senderId: string;
    public originalSenderId: string;
    public body?: string;

    constructor(type: string, senderId: string, originalSenderId: string, body?: string) {
        this.type = type;
        this.date = new Date();
        this.senderId = senderId;
        this.originalSenderId = originalSenderId;
        this.body = body;
    }
}
