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
     * Get guids from the senders of the sent messages after the given date.
     * Deletes messages that are sent before the given date from the history.
     *
     * @param date - The date
     *
     * @return An array of the GUIDs of the senders
     */
    public getSentMessagesSendersSince(date: Date): string[] {
        const guids: string[] = [];

        for (const guid of this.sentMessages.keys()) {
            const sentMessageSender = this.sentMessageSenders.get(guid);
            const message = this.sentMessages.get(guid);

            if (message && message.isOlderThan(date) && sentMessageSender) {
                guids.push(sentMessageSender);

                this.sentMessages.delete(guid);
                this.sentMessageSenders.delete(guid);
            }
        }

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
    public sendMessage(message: Message, destinationIp: string, destinationGuid?: string): Promise<void> {
        return new Promise((resolve) => {
            message.createGuid();

            const socket = connect(`${this.protocol}${destinationIp}:${this.port}`);
            socket.emit("message", JSON.stringify(message));

            if (destinationGuid) {
                this.sentMessages.set(message.guid, message);
                this.sentMessageSenders.set(message.guid, destinationGuid);
            }
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
