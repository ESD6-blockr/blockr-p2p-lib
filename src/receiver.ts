import { sha1 } from "object-hash";
import { listen } from "socket.io";
import { IMessageListener } from "./iMessageListener";

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
                const messageHash = this.generateHash(message);
                if (!this.receivedMessages.includes(messageHash)) {
                    this.receivedMessages.push(messageHash);
                    const clientIp = socket.request.connection.remoteAddress.split(":").pop();
                    this.messageListener.onMessage(message, clientIp);
                }
            });
        });
    }

    /**
     * Generate sha1 hash of the this message.
     */
    private generateHash(object: object): string {
        return sha1(object);
    }
}
