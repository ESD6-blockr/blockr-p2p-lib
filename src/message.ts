import { MessageType } from "./enums";

export class Message {
    public type: MessageType;
    public text: string;
    public senderId: string;
    public date: Date;
    public originalSenderId: string;
}