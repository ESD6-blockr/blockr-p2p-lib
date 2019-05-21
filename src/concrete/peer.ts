import { Guid } from "guid-typescript";

import { MessageType } from "../enums/messageType.enum";
import { IPeer, RECIEVE_HANDLER_TYPE, RESPONSE_TYPE } from "../interfaces/peer";
import { Message } from "../models/message.model";
import { ConnectionService } from "../services/connection.service";

const DEFAULT_PORT: string = "8081";
const THIS_IP: string = "145.93.120.194"; // TODO: get the ip dynamic of the current machine
  
/**
 * Handles the peer network.
 */
export class Peer implements IPeer {
    private GUID?: string;
    private readonly connectionService: ConnectionService;
    
    constructor() {
        this.connectionService = new ConnectionService();
        this.createReceiverHandlers();
    }

    public init(port: string = DEFAULT_PORT, initialPeers?: string[]): Promise<void> {
        return new Promise(async (resolve) => {
            await this.connectionService.init(port);
            if (initialPeers) {
                this.GUID = Guid.createEmpty().toString();
                await this.checkInitialPeers(initialPeers);
                resolve();
            }

            this.GUID = Guid.create().toString();
            console.log("====================init finished===================");
            resolve();
        });
    }

    public registerReceiveHandlerForMessageType(messageType: string, implementation: RECIEVE_HANDLER_TYPE): void {
        this.connectionService.registerReceiveHandlerForMessageType(messageType, implementation);
    }

    public sendBroadcast(message: Message, responseImplementation?: RESPONSE_TYPE): Promise<void[]> {
        if (this.GUID) {
            message.originalSenderGuid = this.GUID;
        }
        return this.connectionService.sendBroadcast(message, responseImplementation);
    }

    public sendMessage(message: Message, destinationGuid: string, responseImplementation?: RESPONSE_TYPE): Promise<void> {
        if (this.GUID) {
            message.originalSenderGuid = this.GUID;
        }
        return this.connectionService.sendMessage(message, destinationGuid, responseImplementation);
    }

    public leave() {
        if (this.GUID) {
            this.connectionService.leave(this.GUID);
        }
    }

    public getPromiseForResponse(message: Message): Promise<void> {
        return this.connectionService.getPromiseForResponse(message);
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
            // Check if node already has an id, if so do not proceed with join request
            if (message.originalSenderGuid === Guid.EMPTY && senderGuid && this.GUID) {
                if (!message.body) {
                    return;
                }
                const newPeerId: string = Guid.create().toString();
                message.originalSenderGuid = newPeerId;
                const body = JSON.parse(message.body);

                const routingTable = this.connectionService.routingTable.clone();
                routingTable.addPeer(this.GUID, THIS_IP);

                const responseBody = JSON.stringify({guid: newPeerId, ip: body.ip,
                                    routingTable: Array.from(routingTable.peers)});

                // Add the new peer to our registry
                this.connectionService.routingTable.addPeer(newPeerId, body.ip);
                console.log("===== ConnectionService After RoutingTable ====", this.connectionService.routingTable);
                console.log("===== ConnectionService CONST RoutingTable ====", routingTable);
                
                response(new Message(MessageType.JOIN_RESPONSE, newPeerId, responseBody));

                // Let other peers know about the newly joined peer
                await this.connectionService.sendBroadcast(new Message(MessageType.NEW_PEER, this.GUID));
            }
        });

        // Handle new peer messages
        this.connectionService.registerReceiveHandlerForMessageType(MessageType.NEW_PEER, async (message: Message, senderGuid: string) => {
            if (senderGuid && message.body) {
                // Add the new peer to our registry
                const body = JSON.parse(message.body);
                if (this.GUID !== body.guid) {
                    console.log("====================new peer==================", body.guid);
                    this.connectionService.routingTable.addPeer(body.guid, body.sender);
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
     */
    private checkInitialPeers(peers: string[]): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (!this.GUID) {
                reject();
                return;
            }
            for (const peer of peers) {
                // Check if peer is online and try to join
                const message = new Message(MessageType.JOIN, this.GUID, JSON.stringify({ip: THIS_IP}));
                await this.connectionService.sendMessageByIp(message, peer,
                    async (responseMessage: Message) => { await this.joinResponse(responseMessage); });
                await this.connectionService.getPromiseForResponse(message);
            }
            resolve();
        });
    }

    private joinResponse(message: Message): Promise<void> {
        return new Promise(async (resolve) => {
            if (message.body && message.originalSenderGuid) {
                const body = JSON.parse(message.body);
                this.GUID = body.guid;
                this.connectionService.routingTable.mergeRoutingTables(new Map(body.routingTable));
            }
            resolve();
        });
    }
}
