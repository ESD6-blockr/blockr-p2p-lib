import { Message } from "../models/message.model";


export type RESPONSE_TYPE = (message: Message) => Promise<void> | void;
export type RECIEVE_HANDLER_TYPE = (message: Message, senderGuid: string, response: RESPONSE_TYPE) => Promise<void>;
/**
 * Peer interface.
 */
export interface IPeer {
    /**
     * Register custom receiver handlers.
     *
     * @param messageType - The messageType that the receiver handles
     * @param implementation - The implementation of the receiver handler
     *                         The implementation should be a void that receives the following arguments:
     *                              message - The message
     *                              sender - The GUID of the message sender
     * @param [response] - Methode for sending the response message
     */
    registerReceiveHandlerForMessageType(messageType: string, implementation: (message: Message, sender: string,
                                                                               response: RESPONSE_TYPE) => void): void;

    /**
     * Send a message to the given destination.
     *
     * @param messageType - The message type
     * @param destination - The destination GUID
     * @param [body] - The message body
     * @param [responseImplementation] - The implementation for the response message
     */
    sendMessage(messageType: string, destination: string, body?: string, responseImplementation?: RESPONSE_TYPE): void;

    /**
     * Send a broadcast to the network.
     *
     * @param messageType - The message type
     * @param [body] - The message body
     * @param [responseImplementation] - The implementation for the response message
     */
    sendBroadcast(messageType: string, body?: string, responseImplementation?: RESPONSE_TYPE): void;

    /**
     * Leave the network.
     */
    leave(): void;
}
