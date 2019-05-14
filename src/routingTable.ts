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
     * @param peerRegistry - The RoutingTable
     */
    public mergeRegistries(peerRegistry: RoutingTable): void {
        console.log(this.peers);
        console.log(peerRegistry.peers);

        // this.peers = new Map([...this.peers, ...peerRegistry.peers]);
        this.peers = new Map([...Array.from(this.peers.entries()), ...Array.from(peerRegistry.peers.entries())]);

        console.log(this.peers);
    }
}
