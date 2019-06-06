import { PeerType } from "../enums";

/**
 * Peer node.
 * This model is used to store different type op PeerNodes in the routingTable.
 */
export class PeerNode {
    public readonly ip: string;
    public readonly port: string;
    public readonly type: PeerType;

    /**
     * Creates an instance of peer node.
     * 
     * @param ip
     * @param type
     * @param port
     */
    public constructor(ip: string, type: PeerType, port: string) {
        this.ip = ip;
        this.port = port;
        this.type = type;
    }

    /**
     * Get the address (ip and port) of this peer node.
     * 
     * @returns the address
     */
    public getAddress(): string {
        return `${this.ip}:${this.port}`;
    }
}
