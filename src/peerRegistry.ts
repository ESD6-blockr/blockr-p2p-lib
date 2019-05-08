import {Guid} from "guid-typescript";

export class PeerRegistry {
    private peers: Map<string, Guid>;

    constructor(peers: Map<string, Guid>) {
        this.peers = peers;
    }

    public addPeer(ip: string, GUID: Guid){
        this.peers.set(ip, GUID);
    }
}
