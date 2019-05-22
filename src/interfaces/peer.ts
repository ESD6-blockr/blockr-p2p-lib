import { Message } from "../models/message.model";


export type RESPONSE_TYPE = (message: Message) => Promise<void> | void;
export type RECIEVE_HANDLER_TYPE = (message: Message, senderGuid: string, response: RESPONSE_TYPE) => Promise<void>;
/**
 * Peer interface.
 */
export interface IPeer {
    /**
     * Inits peer
     * @param [port] 
     * @param [initialPeers] 
     * @returns init 
     */
    init(port?: string, initialPeers?: string[]): Promise<void>;

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
    registerReceiveHandlerForMessageType(messageType: string, implementation: RECIEVE_HANDLER_TYPE): void;

    /**
     * Send a message to the given destination.
     *
     * @param messageType - The message type
     * @param destination - The destination GUID
     * @param [body] - The message body
     * @param [responseImplementation] - The implementation for the response message
     */
    sendMessageAsync(message: Message, destinationGuid: string, responseImplementation?: RESPONSE_TYPE): Promise<void>;

    /**
     * Send a broadcast to the network.
     *
     * @param messageType - The message type
     * @param [body] - The message body
     * @param [responseImplementation] - The implementation for the response message
     */
    sendBroadcastAsync(message: Message, responseImplementation?: RESPONSE_TYPE): Promise<void[]>;

    /**
     * Leave the network.
     */
    leave(): void;
}
