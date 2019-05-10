import { Message } from "../models/message";

export interface IMessageListener {
    /**
     * Receive a message
     *
     * @param message - The received message
     * @param sender - IP of the sender
     */
    onMessage(message: Message, sender: string): void;
}
