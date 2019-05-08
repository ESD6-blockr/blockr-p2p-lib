import { sha1 } from "object-hash";
import { listen } from "socket.io";
import { IMessageListener } from "./iMessageListener";
import { Message } from "./models/message";

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
            socket.on("message", (message: Message) => {
                if (this.server.ourSockets === undefined) {
                    this.server.ourSockets = [];
                }
                this.server.ourSockets.push(socket);

                const messageHash = this.generateHash(message);
                if (!this.receivedMessages.includes(messageHash)) {
                    this.receivedMessages.push(messageHash);
                    this.messageListener.onMessage(message);
                }
            });
        });
    }

    /**
     * Generate sha1 hash of the given object.
     */
    private generateHash(object: object): string {
        return sha1(object);
    }
}
