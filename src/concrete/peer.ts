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
    private readonly receiveHandlers: Map<string, (message: Message, senderGuid: string, response: (body: string) => void) => void>;
    private sender: Sender;
    private receiver: Receiver;
    private GUID: string;
    private readonly requestsMap: Map<string, (response: Message) => void>;


    constructor() {
        this.receiveHandlers = new Map();
        this.requestsMap = new Map();
        this.routingTable = new RoutingTable();

    }

    public init(port: string | "8081", initialPeers?: string[]): Promise<void> {
        return new Promise(async (resolve) => {
            this.createReceiverHandlers();
            
            this.sender = new Sender(port);
            this.receiver = new Receiver(this, port);

            this.createRoutingTableCleanupTimer();

            if (initialPeers) {
                this.GUID = Guid.createEmpty().toString();
                await this.checkInitialPeers(initialPeers);
                resolve();
            }

            this.GUID = Guid.create().toString();
            resolve();
        });
    }

    /**
     * Register custom receiver handlers.
     *
     * @param messageType - The messageType that the receiver handles
     * @param implementation - The implementation of the receiver handler
     */
    public registerReceiveHandlerForMessageType(messageType: string, implementation: (message: Message, sender: string,
                                                                                      response: (body: string) => void) => void): void {
        this.receiveHandlers.set(messageType, implementation);
    }

    /**
     * Send a message to the given destination.
     *
     * @param messageType - The message type
     * @param destination - The destination GUID
     * @param [body] - The message body
     */
    public sendMessage(messageType: string, destination: string, body?: string, responseImplementation?: (response: Message) => void): Promise<void> {
        const destinationIp = this.getIpFromRoutingTable(destination);
        const message = new Message(messageType, this.GUID, body);
        if (responseImplementation) {
            this.requestsMap.set(message.guid, responseImplementation);
        }
        return this.sender.sendMessage(message, destinationIp, destination);
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

        const implementation = this.receiveHandlers.get(message.type);
        if (implementation && typeof implementation === "function") {
            implementation(message, senderGuid, (body: string) => {
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
        this.registerReceiveHandlerForMessageType(MessageType.ACKNOWLEDGE, async (message: Message, senderGuid: string, senderIp: string) => {
            if (senderGuid && message.body && senderIp) {
                this.sender.removeSentMessage(message.body);
            }
        });

        // Handle join messages
        this.registerReceiveHandlerForMessageType(MessageType.JOIN, async (message: Message, senderGuid: string, senderIp: string) => {
            // Check if node already has an id, if so do not proceed with join request
            if (message.originalSenderGuid === Guid.EMPTY && senderGuid) {
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

        // Handle new peer messages
        this.registerReceiveHandlerForMessageType(MessageType.NEW_PEER, async (message: Message, senderGuid: string, senderIp: string) => {
            if (senderGuid && message.body && senderIp) {
                // Add the new peer to our registry
                const body = JSON.parse(message.body);
                this.routingTable.addPeer(body.guid, body.sender);
            }
        });

        // Handle leave messages
        this.registerReceiveHandlerForMessageType(MessageType.LEAVE, async (message: Message, senderGuid: string, senderIp: string) => {
            if (message && senderGuid && senderIp) {
                // Remove the new peer from our registry
                this.routingTable.removePeer(message.originalSenderGuid);
            }
        });
    }
    /**
     * Try to join the network. Send a join request to every given peer.
     */
    private checkInitialPeers(peers: string[]): Promise<void> {
        return new Promise(async (resolve) => {
            const promises = [];
            for (const peer of peers) {
                // Check if peer is online and try to join
                promises.push(this.sendMessage(MessageType.JOIN, peer, (body: string) => void ) => {
                    response();
                });
            }
            await Promise.all(promises);
            resolve();
        });
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
