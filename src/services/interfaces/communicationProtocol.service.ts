import { Message } from "../../models/message.model";

/**
 * Handles the sending of messages.
 */
export interface ICommunicationProtocol {
    /**
     * Emits the given message to the given destinationIp and adds the message to the history.
     *
     * @param message - The message
     * @param destinationIp - The destinationIp ip
     */
    sendMessageAsync(message: Message, destinationIp: string): Promise<void>;

    /**
     * Send an acknowledge message to the given destinationIp, based on the given message.
     *
     * @param originalMessage - The message
     * @param destinationIp - The destinationIp
     */
    sendAcknowledgeMessageAsync(originalMessage: Message, destinationIp: string): Promise<void>;
}
