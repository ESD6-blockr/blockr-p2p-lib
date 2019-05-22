/**
 * Routing table registry.
 */
export class RoutingTable {
    public peers: Map<string, string>;

    constructor() {
        this.peers = new Map();
    }

    /**
     * Add a peer to the registry.
     *
     * @param guid - The GUID
     * @param ip - The IP
     */
    public addPeer(guid: string, ip: string): void {
        this.peers.set(guid, ip);
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
    public mergeRoutingTables(routingTable: Map<string, string>): void {
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
