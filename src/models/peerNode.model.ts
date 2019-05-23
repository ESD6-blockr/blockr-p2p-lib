/**
 * Peer node.
 * This model is used to store different type op PeerNodes in the routingtable.
 */
export class PeerNode {
    public readonly ip: string;
    public readonly type: string;

    /**
     * Creates an instance of peer node.
     * @param ip 
     * @param type 
     */
    public constructor(ip: string, type: string) {
        this.ip = ip;
        this.type = type;
    }
}
