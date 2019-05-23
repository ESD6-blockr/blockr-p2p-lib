import { Message } from "../models/message.model";

/**
 * Message listener interface.
 */
export interface IMessageListener {
    /**
     * Receive a message
     *
     * @param message - The received message
     */
    onMessageAsync(message: Message): Promise<void>;
}
