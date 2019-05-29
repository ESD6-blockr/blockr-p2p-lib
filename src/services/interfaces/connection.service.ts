import { RECEIVE_HANDLER_TYPE, RESPONSE_TYPE } from "../../interfaces/peer";
import {Message, RoutingTable} from "../../models";

/**
 * Handles the peer network.
 */
export interface IConnectionService {

    /**
     * Routing table containing all known p2p ip-guid combinations.
     */
    readonly routingTable: RoutingTable;

    /**
     * GUID of this p2p node.
     */
    GUID?: string;

    /**
     * Inits connection service
     * @param port 
     * @returns init 
     */
    init(port: string): Promise<void>;

    /**
     * Inits mock connection service for testing purposes only
     * Can be removed when dependency injection is implemented
     * @param port
     * @returns init
     */
    initMock(port: string): Promise<void>;

    /**
     * Remove the given message from the sent messages history.
     *
     * @param senderGuid - The guid of the sender
     */
    removeSentMessage(senderGuid: string): void;

    /**
     * Register custom receiver handlers.
     *
     * @param messageType - The messageType that the receiver handles
     * @param implementation - The implementation of the receiver handler
     */
    registerReceiveHandlerForMessageType(messageType: string, implementation: RECEIVE_HANDLER_TYPE): void;

    /**
     * Send a message to the given destination.
     *
     * @param message - The message
     * @param destinationGuid - The destination GUID
     * @param [responseImplementation] - The implementation for the response message
     */
    sendMessageAsync(message: Message, destinationGuid: string, responseImplementation?: RESPONSE_TYPE): Promise<void>;


    /**
     * Sends broadcast
     * @param message The message
     * @param [responseImplementation] The implementation of the response message
     * @returns broadcast 
     */
    sendBroadcastAsync(message: Message, responseImplementation?: RESPONSE_TYPE): Promise<void[]>;

    /**
     * Check of messageType of the given message has a known implementation, and executes the implementation.
     *
     * @param message - The incoming message
     */
    onMessageAsync(message: Message): Promise<void>;


    /**
     * Leaves connection service
     * @param guid  The guid of a peer
     */
    leave(guid: string): void;

    /**
     * Sends message by ip
     * @param message  The message
     * @param destinationIp The ip address of the destination
     * @param [responseImplementation] The implementation of the response message
     * @returns message by ip 
     */
    sendMessageByIpAsync(message: Message, destinationIp: string, responseImplementation?: RESPONSE_TYPE): Promise<void>;

    /**
     * Gets promise for response
     * @param message The message
     * @returns promise for response 
     */
    getPromiseForResponse(message: Message): Promise<void>;
}
