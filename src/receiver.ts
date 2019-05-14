import { listen } from "socket.io";
import { IMessageListener } from "./interfaces/iMessageListener";
import { ObjectHasher } from "./util/objectHasher";

/**
 * Handles the receiving of messages.
 */
export class Receiver {
    private readonly messageListener: IMessageListener;
    private readonly server: any;
    private receivedMessages: string[];

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
        this.server.on("connection", (socket: any) => {
            socket.on("message", (body: string) => {
                if (this.server.ourSockets === undefined) {
                    this.server.ourSockets = [];
                }
                this.server.ourSockets.push(socket);

                const message = JSON.parse(body);
                const messageHash = ObjectHasher.generateSha1(message);
                if (!this.receivedMessages.includes(messageHash)) {
                    this.receivedMessages.push(messageHash);
                    const sender = socket.request.connection.remoteAddress.split(":").pop();
                    this.messageListener.onMessage(message, sender);
                }
            });
        });
    }
}
