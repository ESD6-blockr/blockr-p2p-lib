import { logger } from "@blockr/blockr-logger";
import { Guid } from "guid-typescript";

import { MessageType } from "./enums";
import { IMessageListener } from "./interfaces/iMessageListener";
import { IPeer } from "./interfaces/iPeer";
import { Message } from "./models/message";
import { PeerRegistry } from "./peerRegistry";
import { Receiver } from "./receiver";
import { Sender } from "./sender";

/**
 *
 */
export class Peer implements IMessageListener, IPeer {
    private GUID: string;
    private peerRegistry: PeerRegistry;
    private receiveHandlers: Map<string, (message: Message, senderIp: string) => void>;
    private sender: Sender;
    private receiver: Receiver;

    constructor(initialPeers: string[], port: string, firstPeer: boolean) {
        this.peerRegistry = new PeerRegistry(new Map());
        this.receiveHandlers = new Map();
        this.createReceiverHandlers();

        this.sender = new Sender(initialPeers, port);
        this.receiver = new Receiver(this, port);

        if (firstPeer) {
            this.GUID = Guid.create().toString();
            return;
        }
        this.GUID = Guid.createEmpty().toString();
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
        this.sender.sendMessage(new Message(messageType, this.GUID, body), destination);
    }

    /**
     * Send a broadcast to the network.
     *
     * @param messageType - The message type
     * @param [body] - The message body
     */
    public sendBroadcast(messageType: string, body?: string): void {
        this.peerRegistry.peers.forEach((peer) => {
            const message = new Message(messageType, this.GUID, body);
            this.sender.sendMessage(message, peer);
        });
    }

    /**
     * Check of messageType of the given message has a known implementation, and executes the implementation.
     *
     * @param message - The incoming message
     * @param senderIp - The IP of the sender
     */
    public onMessage(message: Message, senderIp: string): void {
        logger.info(`Message received from ${senderIp}: ${message.type}`);

        const implementation = this.receiveHandlers.get(message.type);
        if (implementation !== undefined && typeof implementation === "function") {
            implementation(message, senderIp);

            // Acknowledge this message
            if (message.type !== MessageType.ACKNOWLEDGE) {
                this.sender.sendAcknowledgeMessage(message, senderIp);
            }
        }
    }

    /**
     * Create the default handlers that act on a received message, depending on the messageType.
     */
    private createReceiverHandlers(): void {
        // Handle ping messages
        this.registerReceiveHandlerImpl(MessageType.PING, (message: Message, senderIp: string) => {
            const response = new Message(MessageType.PING_RESPONSE, message.originalSenderId);
            this.sender.sendMessage(response, senderIp);
        });

        // Handle join messages
        this.registerReceiveHandlerImpl(MessageType.JOIN, (message: Message, senderIp: string) => {
            // Check if node already has an id, if so do not proceed with join request
            if (message.originalSenderId === undefined) {
                const newPeerId: string = Guid.create().toString();

                const response = new Message(
                    MessageType.JOIN_RESPONSE,
                    message.originalSenderId,
                    JSON.stringify({guid: newPeerId, routingTable: this.peerRegistry}),
                );
                this.sender.sendMessage(response, senderIp);

                // Add the new peer to our registry
                this.peerRegistry.addPeer(senderIp, newPeerId);

                // Let other peers know about the newly joined peer
                const broadcast = new Message(MessageType.NEW_PEER, this.GUID, newPeerId);
                this.sender.sendBroadcast(broadcast);
            }
        });

        // Handle join acknowledge messages
        this.registerReceiveHandlerImpl(MessageType.JOIN_RESPONSE, (message: Message, senderIp: string) => {
            if (message.body !== undefined
                && this.GUID === undefined
                && senderIp !== undefined
                && message.originalSenderId !== undefined) {
                const body = JSON.parse(message.body);
                this.GUID = body.guid;
                this.peerRegistry = JSON.parse(body.peerRegistry);
                this.peerRegistry.addPeer(senderIp, message.originalSenderId);
            }
        });

        // Handle acknowledge messages
        this.registerReceiveHandlerImpl(MessageType.ACKNOWLEDGE, (message: Message, senderIp: string) => {
            if (senderIp !== undefined && message.body !== undefined) {
                this.sender.removeSentMessage(message.body);
            }
        });
    }

    /**
     * Try to join the network. Send a join request to every given peer.
     */
    private checkInitialPeers(peers: string[]): void {
        peers.forEach((peer) => {
            // Check if peer is online and try to join
            const message = new Message(MessageType.JOIN);
            this.sender.sendMessage(message, peer);
        });
    }
}
