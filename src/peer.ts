import { logger } from "@blockr/blockr-logger";
import { Guid } from "guid-typescript";

import { MessageType } from "./enums";
import { IMessageListener } from "./interfaces/iMessageListener";
import { IPeer } from "./interfaces/iPeer";
import { Message } from "./models/message";
import { PeerRegistry } from "./peerRegistry";
import { Receiver } from "./receiver";
import { Sender } from "./sender";
import { DateManipulator } from "./util/DateManipulator";

/**
 * Handles the peer network.
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

        this.sender = new Sender(port);
        this.receiver = new Receiver(this, port);

        if (firstPeer) {
            this.GUID = Guid.create().toString();
            return;
        }
        this.GUID = Guid.createEmpty().toString();
        this.checkInitialPeers(initialPeers);

        // Create timer that removes peers that did not reply
        setInterval(() => {
            const minDate = DateManipulator.minusMinutes(new Date(), 0.5);
            this.sender.getSentMessagesSendersSince(minDate).forEach((value: string) => {
                this.peerRegistry.removePeer(value);
            });
        });
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
        const destinationIp = this.peerRegistry.peers.get(destination);
        if (destinationIp === undefined) {
            throw new Error("Unknown GUID.")
        }

        this.sender.sendMessage(new Message(messageType, this.GUID, body), destinationIp);
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
            console.log(peer);
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
     * Leave the network.
     */
    public leave(): void {
        this.sendBroadcast(MessageType.LEAVE);
    }

    /**
     * Create the default handlers that act on a received message, depending on the messageType.
     */
    private createReceiverHandlers(): void {
        // Handle join messages
        this.registerReceiveHandlerImpl(MessageType.JOIN, (message: Message, senderIp: string) => {
            // Check if node already has an id, if so do not proceed with join request
            if (message.originalSenderGuid === undefined) {
                const newPeerId: string = Guid.create().toString();

                // Add the new peer to our registry
                this.peerRegistry.addPeer(newPeerId, senderIp);

                // Send response
                this.sendMessage(
                    MessageType.JOIN_RESPONSE,
                    senderIp,
                    JSON.stringify({guid: newPeerId, routingTable: this.peerRegistry})
                );

                // Let other peers know about the newly joined peer
                this.sendBroadcast(
                    MessageType.NEW_PEER,
                    JSON.stringify({guid: newPeerId, sender: senderIp}),
                );
            }
        });

        // Handle join response messages
        this.registerReceiveHandlerImpl(MessageType.JOIN_RESPONSE, (message: Message, senderIp: string) => {
            if (message.body !== undefined
                && this.GUID === undefined
                && senderIp !== undefined
                && message.originalSenderGuid !== undefined) {
                const body = JSON.parse(message.body);
                this.GUID = body.guid;
                this.peerRegistry = JSON.parse(body.peerRegistry);
                this.peerRegistry.addPeer(message.originalSenderGuid, senderIp);
            }
        });

        // Handle new peer messages
        this.registerReceiveHandlerImpl(MessageType.NEW_PEER, (message: Message, senderIp: string) => {
            if (senderIp !== undefined && message.body !== undefined) {
                // Add the new peer to our registry
                const body = JSON.parse(message.body);
                this.peerRegistry.addPeer(body.guid, body.sender);
            }
        });

        // Handle leave messages
        this.registerReceiveHandlerImpl(MessageType.LEAVE, (message: Message, senderIp: string) => {
            if (message !== undefined && senderIp !== undefined) {
                // Remove the new peer from our registry
                this.peerRegistry.removePeer(message.originalSenderGuid);
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
            const message = new Message(MessageType.JOIN, this.GUID);
            this.sender.sendMessage(message, peer);
        });
    }
}
