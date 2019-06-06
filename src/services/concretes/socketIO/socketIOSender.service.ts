import { connect } from "socket.io-client";
import { MessageType } from "../../../enums";
import { Message } from "../../../models/";

/**
 * Handles the sending of messages.
 */
export class SocketIOSender {
    private readonly protocol = "http";

    /**
     * Emits the given message to the given destinationIp and adds the message to the history.
     *
     * @param message - The message
     * @param destinationIp - The destinationIp ip
     */
    public sendMessageAsync(message: Message, destinationIp: string): Promise<void> {
        return new Promise((resolve) => {
            const socket = connect(`${this.protocol}://${destinationIp}`);
            message.recieverIp = destinationIp;
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
            undefined,
            originalMessage.originalSenderGuid,
            originalMessage.guid,
        );

        return this.sendMessageAsync(message, destinationIp);
    }
}
