import { logger } from "@blockr/blockr-logger";

import { MessageType } from "./enums";
import { IMessageListener } from "./iMessageListener";
import { IpRegistry } from "./ipRegistry";
import { Message } from "./models/message";
import { Receiver } from "./receiver";
import { Sender } from "./sender";

/**
 *
 */
export class Peer implements IMessageListener {
    private readonly localIp: string;
    private ipRegistry: IpRegistry;
    private receiveHandlers: Map<string, (message: Message) => void>;
    private sender: Sender;
    private receiver: Receiver;

    constructor(localIp: string, initialPeers: string[], port: string) {
        this.localIp = localIp;
        this.ipRegistry = new IpRegistry([]);
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
    public registerReceiveHandlerImpl(messageType: string, implementation: (message: Message) => void): void {
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
        this.sender.sendMessage(new Message(messageType, this.localIp, this.localIp, body), destination);
    }

    /**
     * Check of messageType of the given message has a known implementation, and executes the implementation.
     *
     * @param message - The incoming message
     */
    public onMessage(message: Message): void {
        const implementation = this.receiveHandlers.get(message.type);
        if (implementation !== undefined && typeof implementation === "function") {
            implementation(message);
        }

        logger.info(`Message received: ${message}`);
    }

    /**
     * Create the default handlers that act on a received message, depending on the messageType.
     */
    private createReceiverHandlers(): void {
        // Handle ping messages
        this.registerReceiveHandlerImpl(MessageType.PING, (message) => {
            const response = new Message(MessageType.PING_ACKNOWLEDGE, "tempId", message.originalSenderId);
            this.sender.sendMessage(response, message.senderId);
        });

        // Handle join messages
        this.registerReceiveHandlerImpl(MessageType.JOIN, (message) => {
            const response = new Message(MessageType.ROUTING_TABLE, "tempId", message.originalSenderId, "RoutingTable");
            this.sender.sendMessage(response, message.senderId);
        });
    }

    /**
     *
     */
    private checkInitialPeers(peers: string[]): void {
        peers.forEach((peer) => {
            // Check if peer is online and try to join
            const message = new Message(MessageType.JOIN, this.localIp, this.localIp);
            this.sender.sendMessage(message, peer);
        });
    }
}
