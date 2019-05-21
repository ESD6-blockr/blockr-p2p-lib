import { Guid } from "guid-typescript";

import { logger } from "@blockr/blockr-logger";
import { MessageType } from "../enums/messageType.enum";
import { PeerType } from "../enums/peerType.enum";
import { IPeer, RECIEVE_HANDLER_TYPE, RESPONSE_TYPE } from "../interfaces/peer";
import { Message } from "../models/message.model";
import { ConnectionService } from "../services/connection.service";
import { HostIp } from "../util/hostIp.util";

const DEFAULT_PORT: string = "8081";
  
/**
 * Handles the peer network.
 */
export class Peer implements IPeer {
    private readonly connectionService: ConnectionService;
    private readonly type: PeerType;
    private ip?: string;

    /**
     * Creates an instance of peer.
     */
    constructor(type: PeerType) {
        this.connectionService = new ConnectionService();
        this.createReceiverHandlers();
        this.type = type;
    }

    /**
     * Inits peer
     * @param [port] 
     * @param [initialPeers] 
     * @returns init 
     */
    public init(port: string = DEFAULT_PORT, initialPeers?: string[]): Promise<void> {
        return new Promise(async (resolve) => {
            this.ip = HostIp.getIp();
            await this.connectionService.init(port);
            if (initialPeers) {
                this.connectionService.GUID = Guid.createEmpty().toString();
                await this.checkInitialPeers(initialPeers);
                resolve();
                logger.info("=====================finished init =====================");
                return;
            }
            logger.info("=====================finished init =====================");
            this.connectionService.GUID = Guid.create().toString();
            resolve();
        });
    }

    /**
     * Registers receive handler for message type
     * @param messageType 
     * @param implementation 
     */
    public registerReceiveHandlerForMessageType(messageType: string, implementation: RECIEVE_HANDLER_TYPE): void {
        this.connectionService.registerReceiveHandlerForMessageType(messageType, implementation);
    }

    /**
     * Sends broadcast
     * @param message 
     * @param [responseImplementation] 
     * @returns broadcast 
     */
    public sendBroadcast(message: Message, responseImplementation?: RESPONSE_TYPE): Promise<void[]> {
        if (this.connectionService.GUID) {
            message.originalSenderGuid = this.connectionService.GUID;
        }
        return this.connectionService.sendBroadcast(message, responseImplementation);
    }

    /**
     * Sends message
     * @param message 
     * @param destinationGuid 
     * @param [responseImplementation] 
     * @returns message 
     */
    public sendMessage(message: Message, destinationGuid: string, responseImplementation?: RESPONSE_TYPE): Promise<void> {
        if (this.connectionService.GUID) {
            message.originalSenderGuid = this.connectionService.GUID;
        }
        return this.connectionService.sendMessage(message, destinationGuid, responseImplementation);
    }

    /**
     * Leaves peer
     */
    public leave() {
        if (this.connectionService.GUID) {
            this.connectionService.leave(this.connectionService.GUID);
        }
    }

    /**
     * Gets promise for response
     * @param message 
     * @returns promise for response 
     */
    public getPromiseForResponse(message: Message): Promise<void> {
        return this.connectionService.getPromiseForResponse(message);
    }

    public getPeerOfType(type: string): string | undefined {
        return this.connectionService.routingTable.getPeerOfType(type);
    }
    /**
     * Create the default handlers that act on a received message, depending on the messageType.
     */
    private createReceiverHandlers(): void {
        // Handle acknowledge messages
        this.connectionService.registerReceiveHandlerForMessageType(MessageType.ACKNOWLEDGE, async (message: Message, senderGuid: string) => {
            if (senderGuid && message.body) {
                this.connectionService.removeSentMessage(senderGuid);
            }
        });

        // Handle join messages
        this.connectionService.registerReceiveHandlerForMessageType(MessageType.JOIN, async (message: Message,
                                                                                             senderGuid: string, response: RESPONSE_TYPE) => {
            await this.handelJoin(message, senderGuid, response);
        });

        // Handle new peer messages
        this.connectionService.registerReceiveHandlerForMessageType(MessageType.NEW_PEER, async (message: Message, senderGuid: string) => {
            if (senderGuid && message.body) {
                // Add the new peer to our registry
                const body = JSON.parse(message.body);
                if (this.connectionService.GUID !== body.guid) {
                    this.connectionService.routingTable.addPeer(body.guid, body.guid, body.type);
                }
            }
        });

        // Handle leave messages
        this.connectionService.registerReceiveHandlerForMessageType(MessageType.LEAVE, async (message: Message, senderGuid: string) => {
            if (message && senderGuid) {
                // Remove the new peer from our registry
                this.connectionService.routingTable.removePeer(senderGuid);
            }
        });
    }
    /**
     * Try to join the network. Send a join request to every given peer.
     * @param peers 
     * @returns initial peers 
     */
    private checkInitialPeers(peers: string[]): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (!this.connectionService.GUID) {
                reject();
                return;
            }
            for (const peer of peers) {
                // Check if peer is online and try to join
                const message = new Message(MessageType.JOIN, this.connectionService.GUID, JSON.stringify({ip: this.ip, type: this.type}));
                await this.connectionService.sendMessageByIp(message, peer,
                    async (responseMessage: Message) => { await this.joinResponse(responseMessage); });
                await this.connectionService.getPromiseForResponse(message);
            }
            resolve();
        });
    }

    /**
     * Handels join
     * @param message 
     * @param senderGuid 
     * @param response 
     * @returns  
     */
    private async handelJoin(message: Message, senderGuid: string, response: RESPONSE_TYPE) {
        // Check if node already has an id, if so do not proceed with join request
        if (message.originalSenderGuid === Guid.EMPTY && senderGuid && this.connectionService.GUID && this.ip) {
            if (!message.body) {
                return;
            }
            const newPeerId: string = Guid.create().toString();
            message.originalSenderGuid = newPeerId;
            const body = JSON.parse(message.body);

            const routingTable = this.connectionService.routingTable.clone();
            routingTable.addPeer(this.connectionService.GUID, this.ip, this.type);

            const responseBody = JSON.stringify({guid: newPeerId, ip: body.ip,
                                routingTable: Array.from(routingTable.peers)});

            // Add the new peer to our registry
            this.connectionService.routingTable.addPeer(newPeerId, body.ip, body.type);
            
            await response(new Message(MessageType.JOIN_RESPONSE, newPeerId, responseBody));

            // Let other peers know about the newly joined peer
            await this.connectionService.sendBroadcast(new Message(MessageType.NEW_PEER, this.connectionService.GUID,
                JSON.stringify({guid: this.connectionService.GUID, type: this.type})));
        }
    }

    /**
     * Joins response
     * @param message 
     * @returns response 
     */
    private joinResponse(message: Message): Promise<void> {
        return new Promise(async (resolve) => {
            if (message.body && message.originalSenderGuid) {
                const body = JSON.parse(message.body);
                this.connectionService.GUID = body.guid;
                this.connectionService.routingTable.mergeRoutingTables(new Map(body.routingTable));
            }
            resolve();
        });
    }
}
