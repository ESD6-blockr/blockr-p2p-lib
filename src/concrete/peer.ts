import { logger } from "@blockr/blockr-logger";
import { Guid } from "guid-typescript";

import { MessageType } from "../enums";
import { UnknownDestinationError } from "../exceptions/unknownDestinationError";
import { IMessageListener } from "../interfaces/messageListener";
import { IPeer } from "../interfaces/peer";
import { Message } from "../models/message";
import { Receiver } from "../receiver";
import { RoutingTable } from "../routingTable";
import { Sender } from "../sender";
import { DateManipulator } from "../util/dateManipulator";


const MESSAGE_EXPIRATION_TIMER: number = 1;
const MESSAGE_HISTORY_CLEANUP_TIMER: number = 60000; // One minute

/**
 * Handles the peer network.
 */
export class Peer implements IMessageListener, IPeer {
    private readonly routingTable: RoutingTable;
    private readonly externalReceiveHandlers: Map<string, (message: Message, senderGuid: string, response: (body: string) => void) => void>;
    private readonly internalReceiveHandlers: Map<string, (message: Message, senderGuid: string, senderIp: string) => void>;
    private readonly sender: Sender;
    private readonly receiver: Receiver;
    private GUID: string;
    private readonly requestsMap: Map<string, (response: Message) => void>;


    constructor(port: string, initialPeers?: string[]) {
        this.externalReceiveHandlers = new Map();
        this.internalReceiveHandlers = new Map();
        this.requestsMap = new Map();
        this.createReceiverHandlers();

        this.routingTable = new RoutingTable();
        this.sender = new Sender(port);
        this.receiver = new Receiver(this, port);

        this.createRoutingTableCleanupTimer();

        // If initialPeers is undefined, this instance is the first peer
        if (!initialPeers) {
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
    public registerReceiveHandlerForMessageType(messageType: string, implementation: (message: Message, sender: string,
                                                                                      response: (body: string) => void) => void): void {
        this.externalReceiveHandlers.set(messageType, implementation);
    }

    /**
     * Send a message to the given destination.
     *
     * @param messageType - The message type
     * @param destination - The destination GUID
     * @param [body] - The message body
     */
    public sendMessage(messageType: string, destination: string, body?: string, responseImplementation?: (response: Message) => void): void {
        const destinationIp = this.getIpFromRoutingTable(destination);
        const message = new Message(messageType, this.GUID, body);
        this.sender.sendMessage(message, destinationIp, destination);

        if (responseImplementation) {
            this.requestsMap.set(message.guid, responseImplementation);
        }
    }

    /**
     * Send a broadcast to the network.
     *
     * @param messageType - The message type
     * @param [body] - The message body
     */
    public sendBroadcast(messageType: string, body?: string, responseImplementation?: (response: Message) => void): void {
        for (const guid of this.routingTable.peers.keys()) {
            const message = new Message(messageType, this.GUID, body);
            const ip = this.routingTable.peers.get(guid);
            if (ip) {
                logger.info(messageType, "message");
                this.sender.sendMessage(message, ip, guid);
            }

            if (responseImplementation) {
                this.requestsMap.set(message.guid, responseImplementation);
            }
        }
    }

    /**
     * Check of messageType of the given message has a known implementation, and executes the implementation.
     *
     * @param message - The incoming message
     * @param senderGuid - The GUID of the sender
     * @param senderIp - The IP of the sender
     */
    public onMessage(message: Message, senderGuid: string, senderIp: string): void {
        logger.info(`Message received from ${senderGuid}: ${message.type}`);

        const internalImplementation = this.internalReceiveHandlers.get(message.type);
        if (internalImplementation && typeof internalImplementation === "function") {
            internalImplementation(message, senderGuid, senderIp);

            // Acknowledge this message
            if (message.type !== MessageType.ACKNOWLEDGE) {
                this.sender.sendAcknowledgeMessage(message, this.getIpFromRoutingTable(senderGuid));
            }
            return;
        }

        const externalImplementation = this.externalReceiveHandlers.get(message.type);
        if (externalImplementation && typeof externalImplementation === "function") {
            externalImplementation(message, senderGuid, (body: string) => {
                this.sendMessage(`${message.type}reply`, senderGuid, body);
            });

            // Acknowledge this message
            if (message.type !== MessageType.ACKNOWLEDGE) {
                this.sender.sendAcknowledgeMessage(message, this.getIpFromRoutingTable(senderGuid));
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
        this.registerInternalReceiveHandlerForMessageType(MessageType.ACKNOWLEDGE, async (message: Message, senderGuid: string, senderIp: string) => {
            if (senderGuid && message.body) {
                this.sender.removeSentMessage(message.body);
            }
        });

        // Handle join messages
        this.registerInternalReceiveHandlerForMessageType(MessageType.JOIN, async (message: Message, senderGuid: string, senderIp: string) => {
            // Check if node already has an id, if so do not proceed with join request
            if (message.originalSenderGuid === Guid.EMPTY) {
                const newPeerId: string = Guid.create().toString();

                // Add the new peer to our registry
                this.routingTable.addPeer(newPeerId, senderIp);

                // Send response
                this.sendMessage(
                    MessageType.JOIN_RESPONSE,
                    newPeerId,
                    JSON.stringify({guid: newPeerId, routingTable: Array.from(this.routingTable.peers)}),
                );

                // Let other peers know about the newly joined peer
                this.sendBroadcast(
                    MessageType.NEW_PEER,
                    JSON.stringify({guid: newPeerId, sender: senderIp}),
                );
            }
        });

        // Handle join response messages
        this.registerInternalReceiveHandlerForMessageType(MessageType.JOIN_RESPONSE, async (message: Message, senderGuid: string, senderIp: string) => {
            if (message.body && this.GUID === Guid.EMPTY && senderIp && message.originalSenderGuid) {
                const body = JSON.parse(message.body);
                this.GUID = body.guid;
                this.routingTable.addPeer(message.originalSenderGuid, senderIp);
                this.routingTable.mergeRoutingTables(new Map(body.routingTable));
            }
        });

        // Handle new peer messages
        this.registerInternalReceiveHandlerForMessageType(MessageType.NEW_PEER, async (message: Message, senderGuid: string, senderIp: string) => {
            if (senderGuid && message.body) {
                // Add the new peer to our registry
                const body = JSON.parse(message.body);
                this.routingTable.addPeer(body.guid, body.sender);
            }
        });

        // Handle leave messages
        this.registerInternalReceiveHandlerForMessageType(MessageType.LEAVE, async (message: Message, senderGuid: string, senderIp: string) => {
            if (message && senderGuid) {
                // Remove the new peer from our registry
                this.routingTable.removePeer(message.originalSenderGuid);
            }
        });
    }

    public registerInternalReceiveHandlerForMessageType(messageType: string, implementation: (message: Message, senderGuid: string, senderIp: string) => void): void {
        this.internalReceiveHandlers.set(messageType, implementation);
    }

    /**
     * Try to join the network. Send a join request to every given peer.
     */
    private checkInitialPeers(peers: string[]): void {
        for (const peer of peers) {
            // Check if peer is online and try to join
            const message = new Message(MessageType.JOIN, this.GUID);
            this.sender.sendMessage(message, peer);
        }
    }

    /**
     * Create timer that removes peers that did not reply to a sent message.
     *
     * Used to remove offline peers
     */
    private createRoutingTableCleanupTimer() {
        setInterval(() => {
            const minDate = DateManipulator.minusMinutes(new Date(), MESSAGE_EXPIRATION_TIMER);
            for (const value of this.sender.getSentMessagesSendersSince(minDate)) {
                this.routingTable.removePeer(value);
                logger.info(`Peer removed from routing table: ${value}`);
            }
        }, MESSAGE_HISTORY_CLEANUP_TIMER);
    }

    private getIpFromRoutingTable(guid: string): string {
        const destinationIp = this.routingTable.peers.get(guid);
        if (!destinationIp) {
            throw new UnknownDestinationError(`Unknown destination. Could not find an IP for: ${guid}`);
        }

        return destinationIp;
    }
}
