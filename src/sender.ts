import { logger } from "@blockr/blockr-logger";
import { connect } from "socket.io-client";
import { MessageType } from "./enums";

import { Message } from "./models/message";

/**
 * Handles the sending of messages.
 */
export class Sender {
    private readonly protocol = "http://";
    private readonly port: string;
    private readonly sentMessages: Map<string, Message>;
    private readonly sentMessageSenders: Map<string, string>;

    constructor(port: string) {
        this.port = port;
        this.sentMessages = new Map<string, Message>();
        this.sentMessageSenders = new Map<string, string>();
    }

    /**
     * Send the given message to the given destinationIp.
     *
     * @param message - The message
     * @param destinationIp - The destinationIp ip
     * @param destinationGuid
     */
    public sendMessage(message: Message, destinationIp: string, destinationGuid?: string): void {
        this.emitMessage(message, destinationIp, destinationGuid);
    }

    /**
     * Send an acknowledge message to the given destinationIp, based on the given message.
     *
     * @param originalMessage - The message
     * @param destinationIp - The destinationIp
     */
    public sendAcknowledgeMessage(originalMessage: Message, destinationIp: string): void {
        const response = new Message(
            MessageType.ACKNOWLEDGE,
            originalMessage.originalSenderGuid,
            originalMessage.guid,
        );
        response.createGuid();

        // Send the response
        const socket = connect(`${this.protocol}${destinationIp}:${this.port}`);
        socket.emit("message", JSON.stringify(response));

        logger.info(`Message sent to: ${destinationIp}: ${response.type}`);
    }

    /**
     * Get guids from the senders of the sent messages after the given date.
     * Deletes messages that are sent before the given date from the history.
     *
     * @param date - The date
     *
     * @return An array of the GUIDs of the senders
     */
    public getSentMessagesSendersSince(date: Date): string[] {
        const guids: string[] = [];

        this.sentMessages.forEach((value: Message, key: string) => {
            const sentMessageSender = this.sentMessageSenders.get(key);

            if (value.isOlderThan(date) && sentMessageSender !== undefined) {
                guids.push(sentMessageSender);

                this.sentMessages.delete(key);
                this.sentMessageSenders.delete(key);
            }
        });

        return guids;
    }

    /**
     * Remove the given message from the sent messages history.
     *
     * @param messageGuid - The message hash of the message to remove
     */
    public removeSentMessage(messageGuid: string): void {
        this.sentMessages.delete(messageGuid);
        this.sentMessageSenders.delete(messageGuid);
    }

    /**
     * Emits the given message to the given destinationIp and adds the message to the history.
     *
     * @param message - The message
     * @param destinationIp - The destinationIp ip
     * @param destinationGuid
     */
    private emitMessage(message: Message, destinationIp: string, destinationGuid?: string): void {
        message.createGuid();

        const socket = connect(`${this.protocol}${destinationIp}:${this.port}`);
        socket.emit("message", JSON.stringify(message));

        if (destinationGuid !== undefined) {
            this.sentMessages.set(message.guid, message);
            this.sentMessageSenders.set(message.guid, destinationGuid);
        }

        logger.info(`Message sent to: ${destinationIp}: ${message.type}`);
    }
}
