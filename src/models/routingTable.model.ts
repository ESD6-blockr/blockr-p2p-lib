import { PeerNode } from "./peerNode.model";
import { Peer } from "../concrete/peer";

/**
 * Routing table registry.
 */
export class RoutingTable {
    public peers: Map<string, PeerNode>;

    constructor() {
        this.peers = new Map();
    }

    /**
     * Add a peer to the registry.
     *
     * @param guid - The GUID
     * @param ip - The IP
     * @param type - The Type
     */
    public addPeer(guid: string, ip: string, type: string): void {
        this.peers.set(guid, new PeerNode(ip, type));
    }

    public getPeerOfType(type: string): string | undefined {
        for (const peer of this.peers) {
            if (peer[1].type === type) {
                return peer[0];
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
     * Merge two existing peer registries.
     *
     * @param routingTable - The RoutingTable
     */
    public mergeRoutingTables(routingTable: Map<string, PeerNode>): void {
        this.peers = new Map([...this.peers, ...routingTable]);
    }

    public clone(): RoutingTable {
        const routingTable = new RoutingTable();
        for (const peer of this.peers) {
            routingTable.peers.set(peer[0], peer[1]);
        }
        return routingTable;
    }
}
