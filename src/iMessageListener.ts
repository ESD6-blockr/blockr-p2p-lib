import { Message } from "./models/message";

export interface IMessageListener {
    onMessage(message: Message, clientIp: string): void;
}
