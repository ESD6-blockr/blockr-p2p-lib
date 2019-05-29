import { listen, Server, Socket } from "socket.io";
import { IMessageListener } from "../../../interfaces/messageListener";
import { Message } from "../../../models";

/**
 * Handles the receiving of messages.
 */
export class SocketIOReceiver {
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
                console.log(body)
                const message: Message = JSON.parse(body);
                console.log(message)
                if (!this.receivedMessages.includes(message.guid)) {
                    message.senderIp = socket.request.connection.remoteAddress.split(":").pop();
                    socket.broadcast.emit("message", "response");
                    this.receivedMessages.push(message.guid);
                    this.messageListener.onMessageAsync(message);
                }
            });
        });
    }
}
