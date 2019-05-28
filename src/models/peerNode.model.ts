import { PeerType } from "../enums/peerType.enum";

/**
 * Peer node.
 * This model is used to store different type op PeerNodes in the routingtable.
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
