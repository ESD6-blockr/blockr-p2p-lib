import {PeerType} from "../enums";

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
     * If no port is given, the ip param will be split into the ip and the port.
     *
     * @param ip
     * @param type
     * @param port
     */
    public constructor(ip: string, type: PeerType, port?: string) {
        this.type = type;

        if (!port) {
            this.ip = ip.split(":")[0];
            this.port = ip.split(":")[1];
            return;
        }

        this.ip = ip;
        this.port = port;
    }
}
