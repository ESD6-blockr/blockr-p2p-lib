import { listen } from "socket.io";
import { IMessageListener } from "./iMessageListener";

/**
 * Handles the receiving of messages.
 */
export class Receiver {
    private readonly messageListener: IMessageListener;
    private readonly server;
    private receivedMessages;

    constructor(messageListener: IMessageListener, port: string) {
        this.messageListener = messageListener;
        this.server = listen(port);
        this.receivedMessages = [];

        this.handleMessage();
    }

    /**
     * Handles the incoming messages.
     */
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