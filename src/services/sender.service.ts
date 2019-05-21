import { logger } from "@blockr/blockr-logger";
import { connect } from "socket.io-client";
import { MessageType } from "../enums/messageType.enum";
import { Message } from "../models/message.model";

/**
 * Handles the sending of messages.
 */
export class Sender {
    private readonly protocol = "http";
    private readonly port: string;

    /**
     * Creates an instance of sender.
     * @param port 
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
    public sendMessage(message: Message, destinationIp: string): Promise<void> {
        return new Promise((resolve) => {
            const socket = connect(`${this.protocol}://${destinationIp}:${this.port}`);
            socket.emit("message", JSON.stringify(message));

            logger.info(`Message sent to: ${destinationIp}: ${message.type}`);
            resolve();
        });
    }

    /**
     * Send an acknowledge message to the given destinationIp, based on the given message.
     *
     * @param originalMessage - The message
     * @param destinationIp - The destinationIp
     */
    public sendAcknowledgeMessage(originalMessage: Message, destinationIp: string): Promise<void> {
        const message = new Message(
            MessageType.ACKNOWLEDGE,
            originalMessage.originalSenderGuid,
            originalMessage.guid,
        );

        return this.sendMessage(message, destinationIp);
    }
}
