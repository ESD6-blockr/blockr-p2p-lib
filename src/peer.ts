import { logger } from "@blockr/blockr-logger";

import { MessageType } from "./enums";
import { IMessageListener } from "./iMessageListener";
import { PeerRegistry } from "./peerRegistry";
import { Message } from "./models/message";
import { Receiver } from "./receiver";
import { Sender } from "./sender";

/**
 *
 */
export class Peer implements IMessageListener {
    private ipRegistry: PeerRegistry;
    private receiveHandlers: Map<string, (message: Message, senderIp: string) => void>;
    private sender: Sender;
    private receiver: Receiver;

    constructor(initialPeers: string[], port: string) {
        this.ipRegistry = new PeerRegistry([]);
        this.receiveHandlers = new Map();
        this.createReceiverHandlers();

        this.sender = new Sender(initialPeers, port);
        this.receiver = new Receiver(this, port);

        this.checkInitialPeers(initialPeers);
    }

    /**
     * Register custom receiver handlers.
     *
     * @param messageType - The messageType that the receiver handles
     * @param implementation - The implementation of the receiver handler
     */
    public registerReceiveHandlerImpl(messageType: string, implementation: (message: Message, senderIp: string) => void): void {
        this.receiveHandlers.set(messageType, implementation);
    }

    /**
     * Send a message to the given destination.
     *
     * @param messageType - The message type
     * @param destination - The destination ip
     * @param [body] - The message body
     */
    public sendMessage(messageType: string, destination: string, body?: string): void {
        this.sender.sendMessage(new Message(messageType, "senderId", body), destination);
    }

    /**
     * Check of messageType of the given message has a known implementation, and executes the implementation.
     *
     * @param message - The incoming message
     * @param senderIp - The IP of the sender
     */
    public onMessage(message: Message, senderIp: string): void {
        logger.info(`Message received from ${senderIp}: ${message}`);

        const implementation = this.receiveHandlers.get(message.type);
        if (implementation !== undefined && typeof implementation === "function") {
            implementation(message, senderIp);
        }
    }

    /**
     * Create the default handlers that act on a received message, depending on the messageType.
     */
    private createReceiverHandlers(): void {
        // Handle ping messages
        this.registerReceiveHandlerImpl(MessageType.PING, (message: Message, senderIp: string) => {
            const response = new Message(MessageType.PING_ACKNOWLEDGE, message.originalSenderId);
            this.sender.sendMessage(response, senderIp);
        });

        // Handle join messages
        this.registerReceiveHandlerImpl(MessageType.JOIN, (message: Message, senderIp: string) => {
            const response = new Message(MessageType.ROUTING_TABLE, message.originalSenderId, "RoutingTable");
            this.sender.sendMessage(response, senderIp);
        });
    }

    /**
     *
     */
    private checkInitialPeers(peers: string[]): void {
        peers.forEach((peer) => {
            // Check if peer is online and try to join
            const message = new Message(MessageType.JOIN, "tempId");
            this.sender.sendMessage(message, peer);
        });
    }
}
