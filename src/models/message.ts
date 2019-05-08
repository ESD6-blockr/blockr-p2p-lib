/**
 * Message model.
 */
import {Guid} from "guid-typescript";

export class Message {
    public type: string;
    public date: Date;
    public originalSenderId?: Guid;
    public body?: string;

    constructor(type: string, originalSenderId?: Guid, body?: string) {
        this.type = type;
        this.date = new Date();
        this.originalSenderId = originalSenderId;
        this.body = body;
    }
}
