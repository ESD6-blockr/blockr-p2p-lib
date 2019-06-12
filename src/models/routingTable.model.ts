import { PeerType } from "../enums";
import { PeerNode } from "./peerNode.model";

/**
 * Routing table registry.
 */
export class RoutingTable {
    public peers: Map<string, PeerNode>;

    /**
     * Creates an instance of routing table.
     */
    constructor() {
        this.peers = new Map<string, PeerNode>();
    }

    /**
     * Add a peer to the registry.
     *
     * @param guid - The GUID
     * @param ip - The IP
     * @param type - The Type
     * @param [port] - The Port
     */
    public addPeer(guid: string, ip: string, type: PeerType, port?: string): void {
        this.peers.set(guid, new PeerNode(ip, type, port));
    }

    /**
     * Gets peer of type
     * 
     * @param type The type of the peer
     * @returns peer of type
     */
    public getPeerOfType(type: string): [string, string] | undefined {
        for (const peer of this.peers.entries()) {
            if (peer[1].type === type) {
                return [peer[0], peer[1].ip];
            }
        }
        return undefined;
    }

    /**
     * Remove peer by its guid.
     *
     * @param guid - The GUID
     */
    public removePeer(guid: string): void {
        this.peers.delete(guid);
    }

    /**
     * Remove peer by its ip.
     *
     * @param ip - The ip
     */
    public removePeerByIp(ip: string): void {
        for (const peer of this.peers.entries()) {
            if (peer[1].ip === ip) {
                this.peers.delete(peer[0]);
            }
        }
    }

    /**
     * Remove peer by its ip and port.
     *
     * @param ip - The ip
     * @param port - The port
     */
    public removePeerByIpAndPort(ip: string, port: string): void {
        for (const peer of this.peers.entries()) {
            if (peer[1].ip === ip && peer[1].port === port) {
                this.peers.delete(peer[0]);
            }
        }
    }

    /**
     * Merge two existing peer registries.
     *
     * @param routingTable - The RoutingTable
     */
    public mergeRoutingTables(routingTable: Map<string, PeerNode>): void {
        this.peers = new Map([...this.peers, ...routingTable]);
    }

    /**
     * Clones routing table
     * 
     * @returns clone
     */
    public clone(): RoutingTable {
        const routingTable = new RoutingTable();
        for (const peer of this.peers) {
            routingTable.peers.set(peer[0], peer[1]);
        }
        return routingTable;
    }
}
