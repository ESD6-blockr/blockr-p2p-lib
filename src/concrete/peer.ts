import { logger } from "@blockr/blockr-logger";
import { Guid } from "guid-typescript";

import { MessageType } from "../enums";
import { UnknownDestinationError } from "../exceptions/unknownDestinationError";
import { IMessageListener } from "../interfaces/messageListener";
import { IPeer, RESPONSE_TYPE } from "../interfaces/peer";
import { Message } from "../models/message";
import { Receiver } from "../receiver";
import { RoutingTable } from "../routingTable";
import { Sender } from "../sender";
import { DateManipulator } from "../util/dateManipulator";
import { rejects } from "assert";


const MESSAGE_EXPIRATION_TIMER: number = 1;
const MESSAGE_HISTORY_CLEANUP_TIMER: number = 60000; // One minute
const DEFAULT_PORT: string = "8081";
  
/**
 * Handles the peer network.
 */
export class Peer implements IMessageListener, IPeer {
    private readonly routingTable: RoutingTable;
    private readonly receiveHandlers: Map<string, (message: Message, senderGuid: string, response: RESPONSE_TYPE) => void>;
    private sender?: Sender;
    private receiver?: Receiver;
    private GUID?: string;
    private readonly requestsMap: Map<string, (response: Message) => void>;

    constructor() {
        this.receiveHandlers = new Map();
        this.requestsMap = new Map();
        this.routingTable = new RoutingTable();

    }

    public init(port: string = DEFAULT_PORT, initialPeers?: string[]): Promise<void> {
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
                                                                                      response: RESPONSE_TYPE) => void): void {
        this.receiveHandlers.set(messageType, implementation);
    }

    /**
     * Send a message to the given destination.
     *
     * @param messageType - The message type
     * @param destination - The destination GUID
     * @param [body] - The message body
     */
    public sendMessage(messageType: string, destination: string, body?: string, responseImplementation?: RESPONSE_TYPE): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (!this.sender || !this.GUID) {
                reject();
                return;
            }
            let destinationIp = destination;
            if (messageType !== MessageType.JOIN) {
                destinationIp = this.getIpFromRoutingTable(destination);
            }
            const message = new Message(messageType, this.GUID, body);
            if (responseImplementation) {
                this.requestsMap.set(message.guid, responseImplementation);
            }
            await this.sender.sendMessage(message, destinationIp, destination);
            resolve();
        });
    }

    /**
     * Send a broadcast to the network.
     *
     * @param messageType - The message type
     * @param [body] - The message body
     */
    public sendBroadcast(messageType: string, body?: string, responseImplementation?: RESPONSE_TYPE): void {
        if (!this.sender || !this.GUID) {
            return;
        }

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
    public onMessage(message: Message, senderGuid: string): void {
        if (!this.sender) {
            return;
        }
        
        logger.info(`Message received from ${senderGuid}: ${message.type}`);

        const implementation = this.receiveHandlers.get(message.type);
        if (implementation && typeof implementation === "function") {

            implementation(message, senderGuid, (message: Message) => {
                this.sendMessage(message.type, message.originalSenderGuid, message.body);
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
        this.registerReceiveHandlerForMessageType(MessageType.ACKNOWLEDGE, async (message: Message, senderGuid: string) => {
            if (!this.sender) {
                return;
            }

            if (senderGuid && message.body) {
                this.sender.removeSentMessage(message.body);
            }
        });

        // Handle join messages
        this.registerReceiveHandlerForMessageType(MessageType.JOIN, async (message: Message, senderGuid: string, response: RESPONSE_TYPE) => {
            // Check if node already has an id, if so do not proceed with join request
            if (message.originalSenderGuid === Guid.EMPTY && senderGuid) {
                const newPeerId: string = Guid.create().toString();
                if (!message.body) {
                    return;
                }
                const body = JSON.parse(message.body);
                // Add the new peer to our registry
                this.routingTable.addPeer(newPeerId, body.ip);

                // Send response
                response(new Message(MessageType.JOIN_RESPONSE,
                    newPeerId,
                    JSON.stringify({guid: newPeerId, ip: body.ip, routingTable: Array.from(this.routingTable.peers)})));

                // Let other peers know about the newly joined peer
                this.sendBroadcast(
                    MessageType.NEW_PEER,
                    JSON.stringify({guid: newPeerId, sender: body.ip}),
                );
            }
        });

        // Handle new peer messages
        this.registerReceiveHandlerForMessageType(MessageType.NEW_PEER, async (message: Message, senderGuid: string) => {
            if (senderGuid && message.body) {
                // Add the new peer to our registry
                const body = JSON.parse(message.body);
                this.routingTable.addPeer(body.guid, body.sender);
            }
        });

        // Handle leave messages
        this.registerReceiveHandlerForMessageType(MessageType.LEAVE, async (message: Message, senderGuid: string) => {
            if (message && senderGuid) {
                // Remove the new peer from our registry
                this.routingTable.removePeer(message.originalSenderGuid);
            }
        });
    }
    /**
     * Try to join the network. Send a join request to every given peer.
     */
    private checkInitialPeers(peers: string[]): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (!this.sender || !this.GUID) {
                reject();
                return;
            }
            const promises = [];
            for (const peer of peers) {
                // Check if peer is online and try to join
                promises.push(this.sendMessage(MessageType.JOIN, peer, JSON.stringify({ip: "145.93.120.201"}), this.joinResponse));
            }
            await Promise.all(promises);
            resolve();
        });
    }

    private joinResponse(message: Message) {
        if (message.body && this.GUID === Guid.EMPTY && message.originalSenderGuid) {
            const body = JSON.parse(message.body);
            this.GUID = body.guid;
            this.routingTable.addPeer(message.originalSenderGuid, body.ip);
            this.routingTable.mergeRoutingTables(new Map(body.routingTable));
        }
    }


    /**
     * Create timer that removes peers that did not reply to a sent message.
     *
     * Used to remove offline peers
     */
    private createRoutingTableCleanupTimer() {
        setInterval(() => {
            if (!this.sender) {
                return;
            }
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
