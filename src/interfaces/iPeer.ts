import {Message} from "../models/message";

export interface IPeer {
    // constructor(initialPeers: string[], port: string, firstPeer: boolean)

    registerReceiveHandlerImpl(messageType: string, implementation: (message: Message, senderIp: string) => void): void;

    sendMessage(messageType: string, destination: string, body?: string): void;
}
