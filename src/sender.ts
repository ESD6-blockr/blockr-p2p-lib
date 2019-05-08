import { logger } from "@blockr/blockr-logger";
import { connect } from "socket.io-client";

import { Message } from "./models/message";

/**
 * Handles the sending of messages.
 */
export class Sender {
    private peers: string[];
    private readonly protocol = "http://";
    private readonly port: string;

    constructor(peers: string[], port: string) {
        this.peers = peers;
        this.port = port;
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
     * Emits the given message to the given destination.
     *
     * @param message - The message
     * @param destination - The destination ip
     */
    private emitMessage(message: Message, destination: string): void {
        const socket = connect(this.protocol + destination + ":" + this.port);
        socket.emit("message", JSON.stringify(message));

        // Temp logging
        logger.info(`Message sent to: ${this.protocol + destination}:${this.port}`);
    }
}
