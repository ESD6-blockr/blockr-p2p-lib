import { logger } from "@blockr/blockr-logger";
import { Guid } from "guid-typescript";

import { MessageType } from "./enums";
import { IMessageListener } from "./interfaces/iMessageListener";
import { IPeer } from "./interfaces/iPeer";
import { Message } from "./models/message";
import { Receiver } from "./receiver";
import { RoutingTable } from "./routingTable";
import { Sender } from "./sender";
import { DateManipulator } from "./util/dateManipulator";

/**
 * Handles the peer network.
 */
export class Peer implements IMessageListener, IPeer {
    private readonly routingTable: RoutingTable;
    private readonly receiveHandlers: Map<string, (message: Message, senderIp: string) => void>;
    private readonly sender: Sender;
    private readonly receiver: Receiver;
    private GUID: string;

    constructor(initialPeers: string[], port: string, firstPeer: boolean) {
        this.routingTable = new RoutingTable();
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
                this.routingTable.removePeer(value);

                logger.info(`Peer removed from routing table: ${value}`);
            });
        }, 0.5);
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
     * @param destination - The destination GUID
     * @param [body] - The message body
     */
    public sendMessage(messageType: string, destination: string, body?: string): void {
        const destinationIp = this.routingTable.peers.get(destination);
        if (destinationIp === undefined) {
            throw new Error(`Unknown destination. Could not find an IP for: ${destination}`);
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
        this.routingTable.peers.forEach((peer) => {
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
     * Leave the network.
     */
    public leave(): void {
        this.sendBroadcast(MessageType.LEAVE);
    }

    /**
     * Create the default handlers that act on a received message, depending on the messageType.
     */
    private createReceiverHandlers(): void {
        // Handle acknowledge messages
        this.registerReceiveHandlerImpl(MessageType.ACKNOWLEDGE, (message: Message, senderIp: string) => {
            if (senderIp !== undefined && message.body !== undefined) {
                this.sender.removeSentMessage(message.body);
            }
        });

        // Handle join messages
        this.registerReceiveHandlerImpl(MessageType.JOIN, (message: Message, senderIp: string) => {
            // Check if node already has an id, if so do not proceed with join request
            if (message.originalSenderGuid === Guid.EMPTY) {
                const newPeerId: string = Guid.create().toString();

                // Add the new peer to our registry
                this.routingTable.addPeer(newPeerId, senderIp);

                // Send response
                this.sendMessage(
                    MessageType.JOIN_RESPONSE,
                    newPeerId,
                    JSON.stringify({guid: newPeerId, routingTable: this.routingTable}),
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
                && this.GUID === Guid.EMPTY
                && senderIp !== undefined
                && message.originalSenderGuid !== undefined) {
                const body = JSON.parse(message.body);
                this.GUID = body.guid;
                this.routingTable.addPeer(message.originalSenderGuid, senderIp);
                this.routingTable.mergeRegistries(body.routingTable);
            }
        });

        // Handle new peer messages
        this.registerReceiveHandlerImpl(MessageType.NEW_PEER, (message: Message, senderIp: string) => {
            if (senderIp !== undefined && message.body !== undefined) {
                // Add the new peer to our registry
                const body = JSON.parse(message.body);
                this.routingTable.addPeer(body.guid, body.sender);
            }
        });

        // Handle leave messages
        this.registerReceiveHandlerImpl(MessageType.LEAVE, (message: Message, senderIp: string) => {
            if (message !== undefined && senderIp !== undefined) {
                // Remove the new peer from our registry
                this.routingTable.removePeer(message.originalSenderGuid);
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
