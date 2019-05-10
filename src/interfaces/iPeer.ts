import { Message } from "../models/message";

export interface IPeer {
    // constructor(initialPeers: string[], port: string, firstPeer: boolean)

    /**
     * Register custom receiver handlers.
     *
     * @param messageType - The messageType that the receiver handles
     * @param implementation - The implementation of the receiver handler
     */
    registerReceiveHandlerImpl(messageType: string, implementation: (message: Message, senderIp: string) => void): void;

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
