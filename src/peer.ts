import { MessageType } from "./enums";
import { IpRegistry } from "./ipRegistry";
import { Message } from "./message";
import { Receiver } from "./receiver";
import { Sender } from "./sender";

export class Peer {
    private sender: Sender;
    private receiver: Receiver;
    private ipRegistry: IpRegistry;
    private receiveHandlers;

    constructor() {
        this.sender = new Sender([]);
        this.receiver = new Receiver(this.onMessage);
        this.ipRegistry = new IpRegistry();
        this.receiveHandlers = new Map();

        this.createReceiverHandlers();
    }

    public addReceiveHandlerImpl(messageType: MessageType, implementation: (message: Message) => void) {
        this.receiveHandlers.set(messageType, implementation);
    }

    private onMessage(message: Message) {
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
    }
}