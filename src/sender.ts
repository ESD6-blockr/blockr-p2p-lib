import { connect } from "socket.io-client";

import { Message } from "./message";

export class Sender {
    private peers;

    //temp
    private tempPeer = "http://localhost:8082";

    constructor(peers: []) {
        this.peers = peers;

        //temp
        this.peers.put(this.tempPeer);
    }

    public sendMessage(message: Message, destination?: string) {
        if (destination === undefined) {
            //temp
            destination = this.tempPeer;
        }

        this.emitMessage(destination, message);
    }

    public sendBroadcast(broadcast: Message) {
        this.peers.forEach((peer) => {
            this.emitMessage(peer, broadcast);
        })
    }

    private emitMessage(destination: string, message: Message) {
        const socket = connect(destination);
        socket.emit(message.type, JSON.stringify(message));
    }
}