import { Message } from "../models/message";

/**
 * Peer interface.
 */
export interface IPeer {
    // constructor(initialPeers: string[], port: string, firstPeer: boolean)

    /**
     * Register custom receiver handlers.
     *
     * @param messageType - The messageType that the receiver handles
     * @param implementation - The implementation of the receiver handler
     *                         The implementation should be a void that receives the following arguments:
     *                              message - The message
     *                              sender - The IP of the message sender
     */
    registerReceiveHandlerImpl(messageType: string, implementation: (message: Message, sender: string) => void): void;

    /**
     * Send a message to the given destination.
     *
     * @param messageType - The message type
     * @param destination - The destination ip
     * @param [body] - The message body
     */
    sendMessage(messageType: string, destination: string, body?: string): void;

    /**
     * Send a broadcast to the network.
     *
     * @param messageType - The message type
     * @param [body] - The message body
     */
    sendBroadcast(messageType: string, body?: string): void;
}
