import {MessageType, PeerType} from "../../enums";
import { UnknownDestinationException } from "../../exceptions/unknownDestination.exception";
import { IMessageListener } from "../../interfaces/messageListener";
import { RECEIVE_HANDLER_TYPE, RESPONSE_TYPE } from "../../interfaces/peer";
import { MockCommunicationProtocol } from "../../mocks/mockCommunicationProtocol.service";
import { Message, RoutingTable } from "../../models";
import { DateManipulator } from "../../util/dateManipulator";
import { Deferred } from "../../util/deferred.util";
import { ICommunicationProtocol } from "../interfaces/communicationProtocol.service";
import { IConnectionService } from "../interfaces/connection.service";
import { SocketIOCommunicationProtocol } from "./socketIO/socketIO.service";

const MESSAGE_EXPIRATION_TIMER: number = 60;
const MESSAGE_HISTORY_CLEANUP_TIMER: number = 60000; // One minute

/**
 * Handles the peer network.
 */
export class ConnectionService implements IConnectionService, IMessageListener {
    public readonly routingTable: RoutingTable;
    public GUID?: string;
    private communicationProtocol?: ICommunicationProtocol;
    private readonly receiveHandlers: Map<string, RECEIVE_HANDLER_TYPE>;
    private readonly responseDeferredsMap: Map<string, Deferred<boolean>>;
    private readonly requestsMap: Map<string, RESPONSE_TYPE>;
    private readonly sentMessages: Map<string, Message>;
    private readonly mock: boolean;

    /**
     * Creates an instance of connection service.
     */
    constructor(mock: boolean = false) {
        this.mock = mock;
        this.receiveHandlers = new Map<string, RECEIVE_HANDLER_TYPE>();
        this.requestsMap = new Map<string, RESPONSE_TYPE>();
        this.routingTable = new RoutingTable();
        this.sentMessages = new Map<string, Message>();
        this.responseDeferredsMap = new Map<string, Deferred<boolean>>();
    }

    /**
     * Inits connection service
     *
     * Mock inits mock connection service for testing purposes only
     * Can be removed when dependency injection is implemented
     *
     * @param port
     * @returns init
     */
    public init(port: string): Promise<void> {
        if (this.mock) {
            this.communicationProtocol = new MockCommunicationProtocol(this, port);
            return new Promise(async (resolve) => {
                resolve();
            });
        }
        return new Promise(async (resolve) => {
            this.communicationProtocol = new SocketIOCommunicationProtocol(this, port);
            this.createRoutingTableCleanupTimer(MESSAGE_EXPIRATION_TIMER, MESSAGE_HISTORY_CLEANUP_TIMER);
            resolve();
        });
    }

    /**
     * Remove the given message from the sent messages history.
     *
     * @param senderGuid - The guid of the sender
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
    public registerReceiveHandlerForMessageType(messageType: string, implementation: RECEIVE_HANDLER_TYPE): void {
        this.receiveHandlers.set(messageType, implementation);
    }

    /**
     * Send a message to the given destination.
     *
     * @param message - The message
     * @param destinationGuid - The destination GUID
     * @param [responseImplementation] - The implementation for the response message
     */
    public sendMessageAsync(message: Message, destinationGuid: string, responseImplementation?: RESPONSE_TYPE): Promise<void> {
        if (destinationGuid) {
            this.sentMessages.set(destinationGuid, message);
        }
        const destinationIp = this.getIpFromRoutingTable(destinationGuid);
        return this.sendMessageByIpAsync(message, destinationIp, responseImplementation);
    }


    /**
     * Sends broadcast
     * @param message The message
     * @param [responseImplementation] The implementation of the response message
     * @returns broadcast
     */
    public sendBroadcastAsync(message: Message, responseImplementation?: RESPONSE_TYPE): Promise<void[]> {
        const promises = [];
        for (const guid of this.routingTable.peers.keys()) {
            promises.push(this.sendMessageAsync(message, guid, responseImplementation));
        }
        return Promise.all(promises);
    }

    /**
     * Check of messageType of the given message has a known implementation, and executes the implementation.
     *
     * @param message - The incoming message
     */
    public onMessageAsync(message: Message): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (!this.communicationProtocol) {
                reject();
                return;
            }
            const responseImplementation = this.requestsMap.get(message.correlationId);
            if (responseImplementation) {
                await responseImplementation(message);
                const responseDeferred = this.responseDeferredsMap.get(message.correlationId);
                if (responseDeferred && responseDeferred.resolve) {
                    responseDeferred.resolve(true);
                }
                resolve();
                return;
            }

            const implementation = this.receiveHandlers.get(message.type);
            if (implementation && typeof implementation === "function" && message.originalSenderGuid) {
                await implementation(message, message.originalSenderGuid, (responseMessage: Message) => {
                    responseMessage.correlationId = message.guid;
                    responseMessage.originalSenderGuid = message.originalSenderGuid;
                    this.sendMessageAsync(responseMessage, responseMessage.originalSenderGuid as string);
                });
                if (message.type !== MessageType.ACKNOWLEDGE) {
                    const destination = this.getIpFromRoutingTable(message.originalSenderGuid);
                    this.communicationProtocol.sendAcknowledgementAsync(message, destination);
                }
            }
            resolve();
        });
    }


    /**
     * Leaves connection service
     * @param guid  The guid of a peer
     */
    public leave(guid: string): void {
        const message = new Message(MessageType.LEAVE, undefined, guid);
        this.sendBroadcastAsync(message);
    }


    /**
     * Sends message by ip
     * @param message  The message
     * @param destinationIp The ip address of the destination
     * @param [responseImplementation] The implementation of the response message
     * @returns message by ip
     */
    public sendMessageByIpAsync(message: Message, destinationIp: string, responseImplementation?: RESPONSE_TYPE): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (!this.communicationProtocol) {
                reject();
                return;
            }

            if (responseImplementation) {
                this.requestsMap.set(message.guid, responseImplementation);
                this.responseDeferredsMap.set(message.guid, new Deferred());
            }
            await this.communicationProtocol.sendMessageAsync(message, destinationIp);
            resolve();
        });
    }

    /**
     * Gets promise for response
     * @param message The message
     * @returns promise for response
     */
    public getPromiseForResponse(message: Message): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const responseDeferred = this.responseDeferredsMap.get(message.correlationId);
            if (responseDeferred) {
                await responseDeferred.promise;
                resolve();
            }
            reject();
        });
    }

    /**
     * Create timer that removes peers that did not reply to a sent message.
     *
     * Used to remove offline peers
     */
    public createRoutingTableCleanupTimer(messageExpirationTimer: number, messageHistoryCleanupTimer: number) {
        setInterval(() => {
            if (!this.communicationProtocol) {
                return;
            }
            const minDate = DateManipulator.minusSeconds(new Date(), messageExpirationTimer);
            for (const value of this.getSentMessagesSendersSince(minDate)) {
                this.routingTable.removePeer(value);
            }
        }, messageHistoryCleanupTimer);
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
     * Gets ip from routing table
     * @param guid The guid of a peer
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
