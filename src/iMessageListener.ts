import { Message } from "./message";

export interface IMessageListener {
    onMessage(message: Message);
}