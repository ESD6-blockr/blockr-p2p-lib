import { logger } from "@blockr/blockr-logger";

import { MessageType } from "../enums/messageType.enum";
import { UnknownDestinationError } from "../exceptions/unknownDestinationError";
import { IMessageListener } from "../interfaces/messageListener";
import { RECIEVE_HANDLER_TYPE, RESPONSE_TYPE } from "../interfaces/peer";
import { Message } from "../models/message.model";
import { RoutingTable } from "../models/routingTable.model";
import { Receiver } from "../services/receiver.service";
import { Sender } from "../services/sender.service";
import { DateManipulator } from "../util/dateManipulator";


const MESSAGE_EXPIRATION_TIMER: number = 1;
const MESSAGE_HISTORY_CLEANUP_TIMER: number = 60000; // One minute

/**
 * Handles the peer network.
 */
export class ConnectionService implements IMessageListener {
    public readonly routingTable: RoutingTable;
    private readonly receiveHandlers: Map<string, RECIEVE_HANDLER_TYPE>;
    private sender?: Sender;
    private receiver?: Receiver;
    private readonly requestsMap: Map<string, RESPONSE_TYPE>;
    private readonly sentMessages: Map<string, Message>;

    
    constructor() {
        this.receiveHandlers = new Map<string, RECIEVE_HANDLER_TYPE>();
        this.requestsMap = new Map<string, RESPONSE_TYPE>();
        this.routingTable = new RoutingTable();
        this.sentMessages = new Map<string, Message>();
    }

    public init(port: string): Promise<void> {
        return new Promise(async (resolve) => {
            this.sender = new Sender(port);
            this.receiver = new Receiver(this, port);
            this.createRoutingTableCleanupTimer();
            resolve();
        });
    }

    /**
     * Remove the given message from the sent messages history.
     *
     * @param messageGuid - The message hash of the message to remove
     */
    public removeSentMessage(senderGuid: string): void {
        this.sentMessages.delete(senderGuid);
    }

    /**
     * Register custom receiver handlers.
     *
     * @param messageType - The messageType that the receiver handles
     * @param implementation - The implementation of the receiver handler
     */
    public registerReceiveHandlerForMessageType(messageType: string, implementation: RECIEVE_HANDLER_TYPE): void {
        this.receiveHandlers.set(messageType, implementation);
    }

    /**
     * Send a message to the given destination.
     *
     * @param messageType - The message type
     * @param destination - The destination GUID
     * @param [body] - The message body
     */
    public sendMessage(message: Message, destinationGuid: string, responseImplementation?: RESPONSE_TYPE): Promise<void> {
        if (destinationGuid) {
            this.sentMessages.set(destinationGuid, message);
        }

        const destinationIp = this.getIpFromRoutingTable(destinationGuid);
        return this.sendMessageByIp(message, destinationIp, responseImplementation);
    }

    /**
     * Send a broadcast to the network.
     *
     * @param messageType - The message type
     * @param [body] - The message body
     */
    public sendBroadcast(message: Message, responseImplementation?: RESPONSE_TYPE): Promise<void[]> {
        const promises = [];
        for (const guid of this.routingTable.peers.keys()) {
            promises.push(this.sendMessage(message, guid, responseImplementation));
        }
        return Promise.all(promises);
    }

    /**
     * Check of messageType of the given message has a known implementation, and executes the implementation.
     *
     * @param message - The incoming message
     * @param senderGuid - The GUID of the sender
     * @param senderIp - The IP of the sender
     */
    public onMessage(message: Message): void {
        if (!this.sender) {
            return;
        }
        logger.info(`Message received from ${message.originalSenderGuid}: ${message.type}`);
        
        const responseImplementation = this.requestsMap.get(message.correlationId);
        if (responseImplementation) {
            responseImplementation(message);
        }

        const implementation = this.receiveHandlers.get(message.type);
        if (implementation && typeof implementation === "function") {
            implementation(message, message.originalSenderGuid, (responseMessage: Message) => {
                responseMessage.correlationId = message.guid;
                this.sendMessage(responseMessage, responseMessage.originalSenderGuid);
            });
        }

        // Acknowledge this message
        if (message.type !== MessageType.ACKNOWLEDGE) {
            const destination = this.getIpFromRoutingTable(message.originalSenderGuid);
            this.sender.sendAcknowledgeMessage(message, destination);
        }
    }

    /**
     * Leave the network.
     */
    public leave(guid: string): void {
        const message = new Message(MessageType.LEAVE, guid);
        this.sendBroadcast(message);
    }


    public sendMessageByIp(message: Message, destinationIp: string, responseImplementation?: RESPONSE_TYPE): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (!this.sender) {
                reject();
                return;
            }
            
            if (responseImplementation) {
                this.requestsMap.set(message.guid, responseImplementation);
            }
            
            await this.sender.sendMessage(message, destinationIp);
            resolve();
        });
    }

    /**
     * Get guids from the senders of the sent messages after the given date.
     * Deletes messages that are sent before the given date from the history.
     *
     * @param date - The date
     *
     * @return An array of the GUIDs of the senders
     */
    private getSentMessagesSendersSince(date: Date): string[] {
        const guids: string[] = [];

        for (const guid of this.sentMessages.keys()) {
            const message = this.sentMessages.get(guid);

            if (message && message.isOlderThan(date) && guid) {
                guids.push(guid);
            }
        }
        return guids;
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
            for (const value of this.getSentMessagesSendersSince(minDate)) {
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
