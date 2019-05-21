export class node {
    public id: string;
    public type: string;

    public init(){
        
    }
}

/**
 * Routing table
 */
export class RoutingTable {
    public peers: Map<string, string>;

    /**
     * Creates an instance of routing table.
     */
    constructor() {
        this.peers = new Map();
    }

    /**
     * Adds peer
     * @param guid 
     * @param ip 
     */
    public addPeer(guid: string, ip: string): void {
        this.peers.set(guid, ip);
    }

    /**
     * Removes peer
     * @param guid 
     */
    public removePeer(guid: string): void {
        this.peers.delete(guid);
    }

    /**
     * Merges routing tables
     * @param routingTable 
     */
    public mergeRoutingTables(routingTable: Map<string, string>): void {
        this.peers = new Map([...this.peers, ...routingTable]);
    }

    /**
     * Clones routing table
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
