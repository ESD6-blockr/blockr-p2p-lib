import { connect } from "socket.io-client";

import { Message } from "./message";

export class Sender {
    private peers;
    private readonly protocol = 'http://';
    private readonly port;

    constructor(peers: string[], port: string) {
        this.peers = peers;
        this.port = port;
    }

    public sendMessage(message: Message, destination: string) {
        this.emitMessage(message, destination);
    }

    public sendBroadcast(broadcast: Message) {
        this.peers.forEach((peer) => {
            this.emitMessage(broadcast, peer);
        })
    }

    private emitMessage(message: Message, destination: string) {
        const socket = connect(this.protocol + destination + this.port);
        socket.emit('message', JSON.stringify(message));

        // Temp logging
        console.log(`Message sent to: ${this.protocol + destination}:${this.port}`)
    }
}