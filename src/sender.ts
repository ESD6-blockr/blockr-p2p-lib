import { logger } from "@blockr/blockr-logger";
import { connect } from "socket.io-client";
import { MessageType } from "./enums";

import { Message } from "./models/message";
import { ObjectHasher } from "./util/objectHasher";

/**
 * Handles the sending of messages.
 */
export class Sender {
    private peers: string[];
    private readonly protocol = "http://";
    private readonly port: string;
    private sentMessages: Map<string, Message>;

    constructor(peers: string[], port: string) {
        this.peers = peers;
        this.port = port;
        this.sentMessages = new Map<string, Message>();
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
     * Distributes the given broadcast message to the peer network.
     *
     * @param broadcast - The broadcast message
     */
    public sendBroadcast(broadcast: Message): void {
        this.peers.forEach((peer: string) => {
            this.emitMessage(broadcast, peer);
        });
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
     * Get messages sent after the given date.
     * Deletes messages that are sent before the given date from the history.
     *
     * @param date - The date
     */
    public getSentMessagesSince(date: Date): Message[] {
        const oldMessages: Message[] = [];

        this.sentMessages.forEach((value: Message, key: string) => {
            if (value.isOlderThan(date)) {
                this.sentMessages.delete(key);
                oldMessages.push(value);
            }
        });

        return oldMessages;
    }

    /**
     * Remove the given message from the sent messages history.
     *
     * @param messageHash - The message hash of the message to remove
     */
    public removeSentMessage(messageHash: string): void {
        this.sentMessages.delete(messageHash);
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

        this.sentMessages.set(ObjectHasher.generateSha1(message), message);

        logger.info(`Message sent to: ${destination}: ${message.type}`);
    }
}
