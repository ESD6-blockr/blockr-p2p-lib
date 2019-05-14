import { logger } from "@blockr/blockr-logger";
import { connect } from "socket.io-client";
import { MessageType } from "./enums";

import { Message } from "./models/message";
import { ObjectHasher } from "./util/objectHasher";

/**
 * Handles the sending of messages.
 */
export class Sender {
    private readonly protocol = "http://";
    private readonly port: string;
    private sentMessages: Map<string, Message>;
    private sentMessageSenders: Map<string, string>;

    constructor(port: string) {
        this.port = port;
        this.sentMessages = new Map<string, Message>();
        this.sentMessageSenders = new Map<string, string>();
    }

    /**
     * Send the given message to the given destination.
     *
     * @param message - The message
     * @param destination - The destination ip
     */
    public sendMessage(message: Message, destination: string): void {
        this.emitMessage(message, destination);
    }

    /**
     * Send an acknowledge message to the given destination, based on the given message.
     *
     * @param originalMessage - The message
     * @param destination - The destination
     */
    public sendAcknowledgeMessage(originalMessage: Message, destination: string): void {
        const response = new Message(
            MessageType.ACKNOWLEDGE,
            originalMessage.originalSenderId,
            ObjectHasher.generateSha1(originalMessage),
        );

        // Send the response
        const socket = connect(this.protocol + destination + ":" + this.port);
        socket.emit("message", JSON.stringify(response));
    }

    /**
     * Get ips from the senders of the sent messages after the given date.
     * Deletes messages that are sent before the given date from the history.
     *
     * @param date - The date
     *
     * @return An array of the ips of the senders
     */
    public getSentMessagesSendersSince(date: Date): string[] {
        const ips: string[] = [];

        this.sentMessages.forEach((value: Message, key: string) => {
            const sentMessageSender = this.sentMessageSenders.get(key);

            if (value.isOlderThan(date) && sentMessageSender !== undefined) {
                ips.push(sentMessageSender);

                this.sentMessages.delete(key);
                this.sentMessageSenders.delete(key);
            }
        });

        return ips;
    }

    /**
     * Remove the given message from the sent messages history.
     *
     * @param messageHash - The message hash of the message to remove
     */
    public removeSentMessage(messageHash: string): void {
        this.sentMessages.delete(messageHash);
        this.sentMessageSenders.delete(messageHash);
    }

    /**
     * Emits the given message to the given destination and adds the message to the history.
     *
     * @param message - The message
     * @param destination - The destination ip
     */
    private emitMessage(message: Message, destination: string): void {
        const socket = connect(this.protocol + destination + ":" + this.port);
        socket.emit("message", JSON.stringify(message));

        const messageHash = ObjectHasher.generateSha1(message);
        this.sentMessages.set(messageHash, message);
        this.sentMessageSenders.set(messageHash, destination);

        logger.info(`Message sent to: ${destination}: ${message.type}`);
    }
}
