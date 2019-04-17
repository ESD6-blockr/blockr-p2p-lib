import { Message } from "./message";

export class Broadcast extends Message {
    public originalSenderId: string;
}