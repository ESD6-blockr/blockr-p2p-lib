export class PeerRegistry {
    private peers: Map<string, string>;

    constructor(peers: Map<string, string>) {
        this.peers = peers;
    }

    public addPeer(ip: string, guid: string) {
        this.peers.set(ip, guid);
    }
}
