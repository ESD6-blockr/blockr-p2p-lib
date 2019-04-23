import { io } from 'socket.io-client'

import { Message } from "./message";
import { MessageType } from "./enums";

export class Sender {
    private readonly sender;

    constructor() {
        console.log(io);

        this.sender = io('http://localhost');
    }

    public sendMessage(message: Message) {

    }

    public sendBroadcast(broadcast: Message) {

    }
}