import { Guid } from "guid-typescript";

import { MessageType } from "../enums/messageType.enum";
import { RESPONSE_TYPE } from "../interfaces/peer";
import { Message } from "../models/message.model";
import { ConnectionService } from "../services/connection.service";

const DEFAULT_PORT: string = "8081";
const THIS_IP: string = ""; // TODO: get the ip dynamic of the current machine
  
/**
 * Handles the peer network.
 */
export class Peer {
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
            resolve();
        });
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
            if (message.originalSenderGuid === Guid.EMPTY && senderGuid) {
                if (!message.body) {
                    return;
                }
                const newPeerId: string = Guid.create().toString();
                const body = JSON.parse(message.body);
                
                // Send response
                const responseBody = JSON.stringify({guid: newPeerId, ip: body.ip,
                    routingTable: Array.from(this.connectionService.routingTable.peers)});
                response(new Message(MessageType.JOIN_RESPONSE, newPeerId, responseBody));

                // Let other peers know about the newly joined peer
                this.connectionService.sendBroadcast(new Message(MessageType.NEW_PEER, newPeerId));

                // Add the new peer to our registry
                this.connectionService.routingTable.addPeer(newPeerId, body.ip);
            }
        });

        // Handle new peer messages
        this.connectionService.registerReceiveHandlerForMessageType(MessageType.NEW_PEER, async (message: Message, senderGuid: string) => {
            if (senderGuid && message.body) {
                // Add the new peer to our registry
                const body = JSON.parse(message.body);
                this.connectionService.routingTable.addPeer(body.guid, body.sender);
            }
        });

        // Handle leave messages
        this.connectionService.registerReceiveHandlerForMessageType(MessageType.LEAVE, async (message: Message, senderGuid: string) => {
            if (message && senderGuid) {
                // Remove the new peer from our registry
                this.connectionService.routingTable.removePeer(message.originalSenderGuid);
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
            const promises = [];
            for (const peer of peers) {
                // Check if peer is online and try to join
                const message = new Message(MessageType.JOIN, this.GUID, JSON.stringify({ip: THIS_IP}));
                promises.push(this.connectionService.sendMessageByIp(message, peer, this.joinResponse));
            }
            await Promise.all(promises);
            resolve();
        });
    }

    private joinResponse(message: Message): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (message.body && this.GUID === Guid.EMPTY && message.originalSenderGuid) {
                const body = JSON.parse(message.body);
                this.GUID = body.guid;
                this.connectionService.routingTable.addPeer(message.originalSenderGuid, body.ip);
                this.connectionService.routingTable.mergeRoutingTables(new Map(body.routingTable));
                resolve();
            }
            reject();
        });
    }
}
