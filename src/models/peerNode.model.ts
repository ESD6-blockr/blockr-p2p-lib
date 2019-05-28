import { PeerType } from "../enums";

/**
 * Peer node.
 * This model is used to store different type op PeerNodes in the routingTable.
 */
export class PeerNode {
    public readonly ip: string;
    public readonly type: PeerType;

    /**
     * Creates an instance of peer node.
     * @param ip 
     * @param type 
     */
    public constructor(ip: string, type: PeerType) {
        this.ip = ip;
        this.type = type;
    }
}
