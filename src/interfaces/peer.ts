import { Message } from "../models/";


export type RESPONSE_TYPE = (message: Message) => Promise<void> | void;
export type RECEIVE_HANDLER_TYPE = (message: Message, senderGuid: string, response: RESPONSE_TYPE) => Promise<void>;
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
     */
    registerReceiveHandlerForMessageType(messageType: string, implementation: RECEIVE_HANDLER_TYPE): void;

    /**
     * Send a message to the given destination.
     *
     * @param message - The message
     * @param destinationGuid - The destination GUID
     * @param [responseImplementation] - The implementation for the response message
     */
    sendMessageAsync(message: Message, destinationGuid: string, responseImplementation?: RESPONSE_TYPE): Promise<void>;

    /**
     * Send a broadcast to the network.
     *
     * @param message - The message
     * @param [responseImplementation] - The implementation for the response message
     */
    sendBroadcastAsync(message: Message, responseImplementation?: RESPONSE_TYPE): Promise<void[]>;

    /**
     * Gets promise for response
     * @param message 
     * @returns promise for response 
     */
    getPromiseForResponse(message: Message): Promise<void>;

    /**
     * Gets peer of type
     * @param type 
     * @returns peer of type 
     */
     getPeerOfType(type: string): string | undefined;

    /**
     * Leave the network.
     */
    leave(): void;
}
