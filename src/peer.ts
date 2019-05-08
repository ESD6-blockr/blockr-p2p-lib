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
    private sender: Sender;
    private receiver: Receiver;
    private ipRegistry: IpRegistry;
    private receiveHandlers: Map<MessageType, (message: Message) => void>;

    constructor(initialPeers: string[], port: string) {
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
    public registerReceiveHandlerImpl(messageType: MessageType, implementation: (message: Message) => void): void {
        this.receiveHandlers.set(messageType, implementation);
    }

    /**
     *
     * @param destination - The destination ip
     * @param messageType - The message type
     */
    public sendMessage(destination: string, messageType: string): boolean {
        if (destination && messageType) {
            this.sender.sendMessage(new Message(messageType, null, "temp", null, null), destination);
            return true;
        }
        return false;
    }

    /**
     * Check of messageType of the given message has a known implementation, and executes the implementation.
     *
     * @param message - The incoming message
     */
    public onMessage(message: Message): void {
        logger.info(`Message received: ${message}`);

        const implementation = this.receiveHandlers.get(message.type);
        if (implementation !== undefined && typeof implementation === "function") {
            implementation(message);
        }
    }

    /**
     * Create the default handlers that act on a received message, depending on the messageType.
     */
    private createReceiverHandlers(): void {
        // Handle ping messages
        this.registerReceiveHandlerImpl(MessageType.PING, (message) => {
            const response = new Message(MessageType.PING_ACKNOWLEDGE, "tempId", new Date(), "tempId");
            this.sender.sendMessage(response, message.senderId);
        });

        // Handle join messages
        this.registerReceiveHandlerImpl(MessageType.JOIN, (message) => {
            const response = new Message(MessageType.ROUTING_TABLE, "tempId", new Date(), "tempId", "RoutingTable");
            this.sender.sendMessage(response, message.senderId);
        });
    }

    /**
     *
     */
    private checkInitialPeers(peers: string[]): void {
        peers.forEach((peer) => {
            // Check if peer is online and try to join
            const message = new Message(MessageType.JOIN, "tempId", new Date(), "tempId");
            this.sender.sendMessage(message, peer);
        });
    }
}
