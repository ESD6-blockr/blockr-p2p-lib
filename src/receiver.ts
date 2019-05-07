import { listen } from "socket.io";
import { IMessageListener } from "./iMessageListener";

export class Receiver {
    private readonly messageListener: IMessageListener;
    private readonly server;
    private receivedMessages;

    constructor(messageListener: IMessageListener) {
        this.messageListener = messageListener;
        //temp port
        this.server = listen('8081');
        this.receivedMessages = [];

        console.log(`Started listening to http://localhost:8081`);

        this.handleMessage();
    }

    private handleMessage() {
        // event fired every time a new client connects:
        this.server.on('connection', (socket) => {
            socket.on('message', (message) => {
                if (this.server.ourSockets === undefined) {
                    this.server.ourSockets = [];
                }
                this.server.ourSockets.push(socket);

                if (this.receivedMessages.filter((m) => {
                    return message.id === m.id;
                }).length === 0) {
                    this.messageListener.onMessage(message);
                }
            });
        });
    }
}