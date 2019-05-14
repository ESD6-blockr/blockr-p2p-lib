/**
 * Peer registry.
 */
export class PeerRegistry {
    public peers: Map<string, string>;

    constructor(peers: Map<string, string>) {
        this.peers = peers;
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
}
