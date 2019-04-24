import { connect } from "socket.io-client";

import { Message } from "./message";

export class Sender {
    private peers;

    //temp
    private tempPeer = `http://localhost:${process.env.PORT_HOST}`;

    constructor(peers: []) {
        this.peers = peers;

        //temp
        this.peers.push(this.tempPeer);
    }

    public sendMessage(message: Message, destination?: string) {
        if (destination === undefined) {
            //temp
            destination = this.tempPeer;
        }

        this.emitMessage(message, destination);
    }

    public sendBroadcast(broadcast: Message) {
        this.peers.forEach((peer) => {
            this.emitMessage(broadcast, peer);
        })
    }

    private emitMessage(message: Message, destination: string) {
        const socket = connect(`http://localhost:${destination}`);
        socket.emit('message', JSON.stringify(message));
        console.log(`Message sent to: http://localhost:${destination}`)
    }
}