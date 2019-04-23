import { Socket } from "socket.io";
import { Message } from "./message";
import { MessageType } from "./enums";

export class Receiver {
    private readonly callback: (message: Message) => void;
    private readonly client: Socket;
    private receivedMessages;
    private receiveHandlers;

    constructor(callback: (message: Message) => void) {
        this.callback = callback;
        this.client = new Socket();
        this.receiveHandlers = [];
        this.receiveHandlers = new Map();
    }

    public addReceiveHandlerImpl(messageType: MessageType, implementation: () => void) {
        this.receiveHandlers.set(messageType, implementation());
    }

    private onMessage(message: Message) {
        if (this.client) {
            // event fired every time a new client connects:
            this.client.on('connection', (socket) => {
                socket.on('message', (message) => {
                    if (this.client.ourSockets === undefined) {
                        this.client.ourSockets = [];
                    }
                    this.client.ourSockets.push(socket);

                    if (this.receivedMessages.includes((m) => { return message.id === m.id; })) {
                        this.callback(message);
                    }
                });
            });
        }
    }
}