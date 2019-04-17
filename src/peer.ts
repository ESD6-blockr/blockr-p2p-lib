import { IpRegistry } from "./ipRegistry";
import { Receiver } from "./receiver";
import { Sender } from "./sender";

export class Peer {
    private sender: Sender;
    private receiver: Receiver;
    private ipRegistry: IpRegistry;

    constructor() {
        this.sender = new Sender();
        this.receiver = new Receiver();
        this.ipRegistry = new IpRegistry();
    }
}