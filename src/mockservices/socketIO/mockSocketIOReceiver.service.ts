import { Server, WebSocket } from "mock-socket";
import { IMessageListener } from "../../interfaces/messageListener";
import { Message } from "../../models";

/**
 * Handles the receiving of messages.
 */
export class MockSocketIOReceiver {
    private readonly messageListener: IMessageListener;
    private readonly server: Server;
    private readonly receivedMessages: string[];

    /**
     * Creates an instance of receiver.
     * @param messageListener The listener for new messages
     * @param port The communication port
     */
    constructor(messageListener: IMessageListener, port: string) {
        this.messageListener = messageListener;
        this.server = new Server(`ws://localhost:${port}`);
        this.receivedMessages = [];

        this.handleMessage();
    }

    /**
     * Handles the incoming messages.
     */
    private handleMessage(): void {
        // event fired every time a new client connects:
        this.server.on("connection", (socket: WebSocket) => {
            socket.onmessage = (event: any) => {
                console.log("eventData: " + event.data + " | url: " + socket.url);
                const message: Message = JSON.parse(event.data);
                if (!this.receivedMessages.includes(message.guid)) {
                    message.senderIp = socket.url.split(":").pop();
                    console.log("senderIp: " + message.senderIp);
                    this.receivedMessages.push(message.guid);
                    this.messageListener.onMessageAsync(message);
                }
            };
        });
    }
}
