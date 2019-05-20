import { Message } from "../models/message.model";

/**
 * Message listener interface.
 */
export interface IMessageListener {
    /**
     * Receive a message
     *
     * @param message - The received message
     * @param senderGuid - GUID of the sender
     * @param senderIp - IP of the sender
     */
    onMessage(message: Message): void;
}
