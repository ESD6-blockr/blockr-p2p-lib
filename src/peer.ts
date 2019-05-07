import { MessageType } from "./enums";
import { IMessageListener } from "./iMessageListener";
import { IpRegistry } from "./ipRegistry";
import { Message } from "./message";
import { Receiver } from "./receiver";
import { Sender } from "./sender";

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

        //temp message test
        const message = new Message();
        message.type = MessageType.JOIN;
        message.text = "test";
        this.sender.sendMessage(message, initialPeers[1]);
    }

    public addReceiveHandlerImpl(messageType: MessageType, implementation: (message: Message) => void) {
        this.receiveHandlers.set(messageType, implementation);
    }

    onMessage(message: Message) {
        console.log("Message received:");
        console.log(message);

        const implementation = this.receiveHandlers.get(message.type);
        if (implementation !== undefined && typeof implementation === 'function') {
            implementation(message);
        }
    }

    private createReceiverHandlers() {
        // Handle ping messages
        this.addReceiveHandlerImpl(MessageType.PING, (message) => {
            const response = new Message();
            response.type = MessageType.PING_ACKNOWLEDGE;
            response.senderId = "temp";

            this.sender.sendMessage(response, message.senderId);
        });

         // Handle join messages
        this.addReceiveHandlerImpl(MessageType.JOIN, (message) => {
            const response = new Message();
            response.type = MessageType.ROUTING_TABLE;
            response.text = "tempNewId";

            this.sender.sendMessage(response, message.senderId);
        });
    }
}