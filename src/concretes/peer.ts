import { Guid } from "guid-typescript";

import { MessageType } from "../enums/messageType.enum";
import { IPeer, RECIEVE_HANDLER_TYPE, RESPONSE_TYPE } from "../interfaces/peer";
import { Message } from "../models/message.model";
import { ConnectionService } from "../services/concretes/connection.service";

const DEFAULT_PORT: string = "8081";
  
/**
 * Handles the peer network.
 */
export class Peer implements IPeer {
    private readonly connectionService: ConnectionService;
    private readonly type: string;

    /**
     * Creates an instance of peer.
     */
    constructor(type: string) {
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
            await this.connectionService.init(port);
            
            if (initialPeers) {
                this.connectionService.GUID = Guid.createEmpty().toString();
                await this.checkInitialPeers(initialPeers);
                
                resolve();
                return;
            }
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
    public sendBroadcastAsync(message: Message, responseImplementation?: RESPONSE_TYPE): Promise<void[]> {
        if (this.connectionService.GUID) {
            message.originalSenderGuid = this.connectionService.GUID;
        }
        return this.connectionService.sendBroadcastAsync(message, responseImplementation);
    }

    /**
     * Sends message
     * @param message 
     * @param destinationGuid 
     * @param [responseImplementation] 
     * @returns message 
     */
    public sendMessageAsync(message: Message, destinationGuid: string, responseImplementation?: RESPONSE_TYPE): Promise<void> {
        if (this.connectionService.GUID) {
            message.originalSenderGuid = this.connectionService.GUID;
        }
        return this.connectionService.sendMessageAsync(message, destinationGuid, responseImplementation);
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
            await this.handleJoinAsync(message, senderGuid, response);
        });

        // Handle new peer messages
        this.connectionService.registerReceiveHandlerForMessageType(MessageType.NEW_PEER, async (message: Message, senderGuid: string) => {
            if (senderGuid && message.body) {
                // Add the new peer to our registry
                const body = JSON.parse(message.body);
                if (this.connectionService.GUID !== body.guid) {
                    this.connectionService.routingTable.addPeer(body.guid, body.ip, body.type);
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
                const message = new Message(MessageType.JOIN, this.connectionService.GUID, JSON.stringify({type: this.type}));
                await this.connectionService.sendMessageByIpAsync(message, peer,
                    async (responseMessage: Message) => { await this.joinResponseAsync(responseMessage); });
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
     * @returns Promise<void>
     */
    private async handleJoinAsync(message: Message, senderGuid: string, response: RESPONSE_TYPE) {
        // Check if node already has an id, if so do not proceed with join request
        if (message && message.originalSenderGuid === Guid.EMPTY && senderGuid && this.connectionService.GUID) {
            if (!message.body || !message.senderIp) {
                return;
            }
            const newPeerId: string = Guid.create().toString();
            message.originalSenderGuid = newPeerId;
            const body = JSON.parse(message.body);

            const routingTable = this.connectionService.routingTable.clone();
            routingTable.addPeer(this.connectionService.GUID, message.senderIp, this.type);

            const responseBody = JSON.stringify({guid: newPeerId, ip: message.senderIp,
                                routingTable: Array.from(routingTable.peers)});

            // Add the new peer to our registry
            this.connectionService.routingTable.addPeer(newPeerId, message.senderIp, body.type);
            
            await response(new Message(MessageType.JOIN_RESPONSE, newPeerId, responseBody));

            // Let other peers know about the newly joined peer
            await this.connectionService.sendBroadcastAsync(new Message(MessageType.NEW_PEER, this.connectionService.GUID,
                JSON.stringify({guid: this.connectionService.GUID, ip: message.senderIp, type: this.type})));
        }
    }

    /**
     * Joins response
     * @param message 
     * @returns response 
     */
    private joinResponseAsync(message: Message): Promise<void> {
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
