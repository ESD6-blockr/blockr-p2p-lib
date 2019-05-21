import { logger } from "@blockr/blockr-logger";

import { MessageType } from "../enums/messageType.enum";
import { UnknownDestinationException } from "../exceptions/unknownDestination.exception";
import { IMessageListener } from "../interfaces/messageListener";
import { RECIEVE_HANDLER_TYPE, RESPONSE_TYPE } from "../interfaces/peer";
import { Message } from "../models/message.model";
import { RoutingTable } from "../models/routingTable.model";
import { Receiver } from "../services/receiver.service";
import { Sender } from "../services/sender.service";
import { DateManipulator } from "../util/dateManipulator";
import { Deferred } from "../util/deffered.util";


const MESSAGE_EXPIRATION_TIMER: number = 1;
const MESSAGE_HISTORY_CLEANUP_TIMER: number = 60000; // One minute

/**
 * Handles the peer network.
 */
export class ConnectionService implements IMessageListener {
    public readonly routingTable: RoutingTable;
    public GUID?: string;
    private readonly receiveHandlers: Map<string, RECIEVE_HANDLER_TYPE>;
    private sender?: Sender;
    private receiver?: Receiver;
    private readonly responseDefferedsMap: Map<string, Deferred<boolean>>;
    private readonly requestsMap: Map<string, RESPONSE_TYPE>;
    private readonly sentMessages: Map<string, Message>;

    
    /**
     * Creates an instance of connection service.
     */
    constructor() {
        this.receiveHandlers = new Map<string, RECIEVE_HANDLER_TYPE>();
        this.requestsMap = new Map<string, RESPONSE_TYPE>();
        this.routingTable = new RoutingTable();
        this.sentMessages = new Map<string, Message>();
        this.responseDefferedsMap = new Map<string, Deferred<boolean>>();
    }

    /**
     * Inits connection service
     * @param port 
     * @returns init 
     */
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
     * Sends broadcast
     * @param message 
     * @param [responseImplementation] 
     * @returns broadcast 
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
     */
    public onMessage(message: Message): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (!this.sender) {
                reject();
                return;
            }
            logger.info(`${message.type} message received`);
            
            const responseImplementation = this.requestsMap.get(message.correlationId);
            if (responseImplementation) {
                await responseImplementation(message);
                const responseDeffered = this.responseDefferedsMap.get(message.correlationId);
                if (responseDeffered) {
                    responseDeffered.resolve!(true);
                }
            }

            const implementation = this.receiveHandlers.get(message.type);
            if (implementation && typeof implementation === "function") {
                await implementation(message, message.originalSenderGuid, (responseMessage: Message) => {
                    responseMessage.correlationId = message.guid;
                    responseMessage.originalSenderGuid = message.originalSenderGuid;
                    this.sendMessage(responseMessage, responseMessage.originalSenderGuid);
                });
                // Acknowledge this message
                if (message.type !== MessageType.ACKNOWLEDGE) {
                    const destination = this.getIpFromRoutingTable(message.originalSenderGuid);
                    this.sender.sendAcknowledgeMessage(message, destination);
                }
            }
            resolve();
        });
    }


    /**
     * Leaves connection service
     * @param guid 
     */
    public leave(guid: string): void {
        const message = new Message(MessageType.LEAVE, guid);
        this.sendBroadcast(message);
    }


    /**
     * Sends message by ip
     * @param message 
     * @param destinationIp 
     * @param [responseImplementation] 
     * @returns message by ip 
     */
    public sendMessageByIp(message: Message, destinationIp: string, responseImplementation?: RESPONSE_TYPE): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (!this.sender) {
                reject();
                return;
            }
            
            if (responseImplementation) {
                this.requestsMap.set(message.guid, responseImplementation);
                this.responseDefferedsMap.set(message.guid, new Deferred());
            }
            await this.sender.sendMessage(message, destinationIp);
            resolve();
        });
    }

    /**
     * Gets promise for response
     * @param message 
     * @returns promise for response 
     */
    public getPromiseForResponse(message: Message): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const responseDeffered = this.responseDefferedsMap.get(message.correlationId);
            if (responseDeffered) {
                await responseDeffered.promise;
                resolve();
            }
            reject();
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

    /**
     * Gets ip from routing table
     * @param guid 
     * @returns ip from routing table 
     */
    private getIpFromRoutingTable(guid: string): string {
        const destinationIp = this.routingTable.peers.get(guid);
        if (!destinationIp) {
            throw new UnknownDestinationException(`Unknown destination. Could not find an IP for: ${guid}`);
        }
        return destinationIp.ip;
    }
}
