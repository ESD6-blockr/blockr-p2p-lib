import { listen } from "socket.io-client";

import { Message } from "./message";

export class Receiver {
    private readonly callback: (message: Message) => void;
    private readonly client;
    private receivedMessages;

    constructor(callback: (message: Message) => void) {
        this.callback = callback;
        //temp port
        this.client = listen(8082);
        this.receivedMessages = [];

        this.handleMessage();
    }

    private handleMessage() {
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