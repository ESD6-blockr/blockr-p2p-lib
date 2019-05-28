import { Server } from "mock-socket";
import { MessageType } from "../../enums/messageType.enum";
import { Message } from "../../models";

export class MockSocketIOSender {
    private readonly protocol = "http";
    private readonly port: string;

    /**
     * Creates an instance of sender.
     * @param port The communication port
     */
    constructor(port: string) {
        this.port = port;
    }

    /**
     * Emits the given message to the given destinationIp and adds the message to the history.
     *
     * @param message - The message
     * @param destinationIp - The destinationIp ip
     */
    public sendMessageAsync(message: Message, destinationIp: string): Promise<void> {
        return new Promise((resolve) => {
            const socket = new Server(`${this.protocol}://${destinationIp}:${this.port}`);
            console.log("destinationIp: " + `${this.protocol}://${destinationIp}:${this.port}`);
            socket.emit("message", JSON.stringify(message));
            resolve();
        });
    }

    /**
     * Send an acknowledge message to the given destinationIp, based on the given message.
     *
     * @param originalMessage - The message
     * @param destinationIp - The destinationIp
     */
    public sendAcknowledgementAsync(originalMessage: Message, destinationIp: string): Promise<void> {
        const message = new Message(
            MessageType.ACKNOWLEDGE,
            originalMessage.originalSenderGuid,
            originalMessage.guid,
        );

        return this.sendMessageAsync(message, destinationIp);
    }
}
