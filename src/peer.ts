import { MessageType } from "./enums";
import { IMessageListener } from "./iMessageListener";
import { IpRegistry } from "./ipRegistry";
import { Message } from "./models/message";
import { Receiver } from "./receiver";
import { Sender } from "./sender";

/**
 *
 */
export class Peer implements IMessageListener {
    private sender: Sender;
    private receiver: Receiver;
    private ipRegistry: IpRegistry;
    private receiveHandlers;

    constructor(initialPeers: string[], port: string) {
        this.ipRegistry = new IpRegistry();
        this.receiveHandlers = new Map();
        this.createReceiverHandlers();

        this.sender = new Sender(initialPeers, port);
        this.receiver = new Receiver(this, port);

        this.checkInitialPeers(initialPeers);
    }

    /**
     * Register custom receiver handlers.
     *
     * @param messageType - The messageType that the receiver handles
     * @param implementation - The implementation of the receiver handler
     */
    public registerReceiveHandlerImpl(messageType: MessageType, implementation: (message: Message) => void) {
        this.receiveHandlers.set(messageType, implementation);
    }

    /**
     * Check of messageType of the given message has a known implementation, and executes the implementation.
     *
     * @param message - The incoming message
     */
    onMessage(message: Message) {
        console.log("Message received:");
        console.log(message);

        const implementation = this.receiveHandlers.get(message.type);
        if (implementation !== undefined && typeof implementation === 'function') {
            implementation(message);
        }
    }

    /**
     * Create the default handlers that act on a received message, depending on the messageType.
     */
    private createReceiverHandlers() {
        // Handle ping messages
        this.registerReceiveHandlerImpl(MessageType.PING, (message) => {
            const response = new Message();
            response.type = MessageType.PING_ACKNOWLEDGE;
            response.senderId = "temp";

            this.sender.sendMessage(response, message.senderId);
        });

        // Handle join messages
        this.registerReceiveHandlerImpl(MessageType.JOIN, (message) => {
            const response = new Message();
            response.type = MessageType.ROUTING_TABLE;
            response.text = "tempNewId";

            this.sender.sendMessage(response, message.senderId);
        });
    }

    /**
     *
     */
    private checkInitialPeers(peers: string[]) {
        peers.forEach((peer) => {
            // Check if peer is online and try to join
            const message = new Message();
            message.type = MessageType.JOIN;
            this.sender.sendMessage(message, peer);
        });
    }
}