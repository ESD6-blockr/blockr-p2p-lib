import { listen, Socket } from "socket.io";
import { IMessageListener } from "./interfaces/iMessageListener";

/**
 * Handles the receiving of messages.
 */
export class Receiver {
    private readonly messageListener: IMessageListener;
    private readonly server: any;
    private readonly receivedMessages: string[];

    constructor(messageListener: IMessageListener, port: string) {
        this.messageListener = messageListener;
        this.server = listen(port);
        this.receivedMessages = [];

        this.handleMessage();
    }

    /**
     * Handles the incoming messages.
     */
    private handleMessage(): void {
        // event fired every time a new client connects:
        this.server.on("connection", (socket: Socket) => {
            socket.on("message", (body: string) => {
                if (!this.server.ourSockets) {
                    this.server.ourSockets = [];
                }
                this.server.ourSockets.push(socket);

                const message = JSON.parse(body);
                if (!this.receivedMessages.includes(message.guid)) {
                    this.receivedMessages.push(message.guid);
                    const sender = socket.request.connection.remoteAddress.split(":").pop();
                    this.messageListener.onMessage(message, sender);
                }
            });
        });
    }
}
