import { Guid } from "guid-typescript";
import { injectable } from "inversify";
import { MessageType, PeerType } from "../enums/";
import { PeerNotPresentException } from "../exceptions/peerNotPresent.exception";
import { IPeer, RECEIVE_HANDLER_TYPE, RESPONSE_TYPE } from "../interfaces/peer";
import { Message } from "../models/";
import { ConnectionService } from "../services/concretes/connection.service";
import { IConnectionService } from "../services/interfaces/connection.service";

const DEFAULT_PORT: string = "8081";

/**
 * Handles the peer network.
 */
@injectable()
export class Peer implements IPeer {
    private readonly connectionService: IConnectionService;
    private readonly type: PeerType;
    private port?: string;

    /**
     * Creates an instance of peer.
     */
    constructor(type: PeerType, mock: boolean = false) {
        this.connectionService = new ConnectionService(mock);
        this.createReceiverHandlers();
        this.type = type;
    }

    /**
     * Inits peer
     *
     * @param [initialPeers] - An array of initial peer ips (with ports)
     * @param [port] - The port on which this node will listen
     * @returns init
     */
    public init(initialPeers?: [], port: string = DEFAULT_PORT): Promise<void> {
        return new Promise(async (resolve) => {
            await this.connectionService.init(port);
            this.port = port;
            this.connectionService.GUID = Guid.create().toString();
            if (initialPeers) {
                await this.checkInitialPeers(initialPeers);
                resolve();
                return;
            }
            resolve();
        });
    }

    /**
     * Registers receive handler for message type
     *
     * @param messageType
     * @param implementation
     */
    public registerReceiveHandlerForMessageType(messageType: string, implementation: RECEIVE_HANDLER_TYPE): void {
        this.connectionService.registerReceiveHandlerForMessageType(messageType, implementation);
    }

    /**
     * Sends broadcast
     * 
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
     * 
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
     * Send a message to a random peer.
     *
     * @param message - The message
     * @param peerType - The destination peer type
     * @param [responseImplementation] - The implementation for the response message
     */
    public sendMessageToRandomPeerAsync(message: Message, peerType: PeerType, responseImplementation?: RESPONSE_TYPE): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const peer = this.getPeerOfType(peerType);
            if (peer) {
                const destinationGuid = peer[0];
                message.originalSenderGuid = this.connectionService.GUID;
                await this.connectionService.sendMessageAsync(message, destinationGuid, responseImplementation);
                resolve();
            }
            reject(new PeerNotPresentException("Can't find peer for the given type."));
        });
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
     * 
     * @param message
     * @returns promise for response
     */
    public getPromiseForResponse(message: Message): Promise<void> {
        return this.connectionService.getPromiseForResponse(message);
    }


    /**
     * Gets peer of type
     * 
     * @param type
     * @returns peer of type
     */
    public getPeerOfType(type: string): [string, string] | undefined {
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
                    this.connectionService.routingTable.addPeer(body.guid, body.ip, body.peerType, body.port);
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
     * 
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
                const message = new Message(MessageType.JOIN, JSON.stringify({peerType: this.type, port: this.port}), this.connectionService.GUID);
                await this.connectionService.sendMessageByIpAsync(message, peer,
                    async (responseMessage: Message) => {
                        await this.joinResponseAsync(responseMessage);
                    });
                await this.connectionService.getPromiseForResponse(message);
            }
            resolve();
        });
    }

    /**
     * Handles join
     * 
     * @param message
     * @param senderGuid
     * @param response
     * @returns Promise<void>
     */
    private async handleJoinAsync(message: Message, senderGuid: string, response: RESPONSE_TYPE) {
        // Check if node already has an id, if so do not proceed with join request
        if (message && senderGuid && this.connectionService.GUID) {
            if (!message.body || !message.senderIp || !message.recieverIp || !this.port) {
                return;
            }
            const newPeerId: string = Guid.create().toString();
            message.originalSenderGuid = newPeerId;
            const body = JSON.parse(message.body);

            const routingTable = this.connectionService.routingTable.clone();
            routingTable.addPeer(this.connectionService.GUID, message.recieverIp, this.type);
            routingTable.removePeerByIp(message.senderIp);
            
            const responseBody = JSON.stringify({guid: newPeerId, ip: message.recieverIp,
                                routingTable: Array.from(routingTable.peers)});

            // Add the new peer to our registry
            this.connectionService.routingTable.addPeer(newPeerId, message.senderIp, body.peerType, body.port);
            await response(new Message(MessageType.JOIN_RESPONSE, responseBody, newPeerId));

            // Let other peers know about the newly joined peer
            await this.connectionService.sendBroadcastAsync(new Message(MessageType.NEW_PEER,
                JSON.stringify({
                    guid: newPeerId,
                    ip: message.senderIp,
                    peerType: this.type,
                    port: body.port,
                }), this.connectionService.GUID));
        }
    }

    /**
     * Joins response
     * 
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
