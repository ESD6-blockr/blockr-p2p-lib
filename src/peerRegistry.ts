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
     * @param ip - The IP
     * @param guid - The GUID
     */
    public addPeer(ip: string, guid: string): void {
        this.peers.set(ip, guid);
    }

    /**
     * Remove peer by its ip.
     *
     * @param ip - The IP
     */
    public removePeer(ip: string): void {
        this.peers.delete(ip);
    }
}
