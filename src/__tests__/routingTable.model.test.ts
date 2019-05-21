import { Guid } from "guid-typescript";
import { RoutingTable } from "../models/routingTable.model";

let routingTable: RoutingTable;

beforeEach(() => {
    routingTable = new RoutingTable();
});

describe("Creating routingTable model", () => {
    it("Should match the defined routingTable format & properties values", () => {
        expect(routingTable).toBeDefined();
        expect(routingTable.peers).toBeDefined();
        expect(routingTable.peers).toBeInstanceOf(Map);
    });
});

describe("Adding/removing a peer", () => {
    it("Should add/remove the peer to/from the peers map", () => {
        const peerGuid = Guid.create().toString();
        const ip = "0.0.0.0";

        routingTable.addPeer(peerGuid, ip);

        expect(routingTable.peers.size).toEqual(1);
        expect(routingTable.peers.get(peerGuid)).toEqual(ip);

        routingTable.removePeer(peerGuid);

        expect(routingTable.peers.size).toEqual(0);
    });
});

describe("Merging routing tables", () => {
    it("Should merge routing tables", () => {
        const peerGuid = Guid.create().toString();
        const peerGuid2 = Guid.create().toString();
        const ip = "0.0.0.0";
        const ip2 = "0.0.0.1";

        const peersMap = new Map<string, string>();
        peersMap.set(peerGuid, ip);
        routingTable.addPeer(peerGuid2, ip2);

        routingTable.mergeRoutingTables(peersMap);

        expect(routingTable.peers.size).toEqual(2);
        expect(routingTable.peers.get(peerGuid)).toEqual(ip);
        expect(routingTable.peers.get(peerGuid2)).toEqual(ip2);
    });
});

describe("Cloning the routing table", () => {
    it("Should clone the routing table object", () => {
        const peerGuid = Guid.create().toString();
        const ip = "0.0.0.0";

        routingTable.addPeer(peerGuid, ip);
        const clonedRoutingTable = routingTable.clone();

        expect(clonedRoutingTable).toBeDefined();
        expect(clonedRoutingTable).toBeInstanceOf(RoutingTable);
        expect(clonedRoutingTable).not.toBe(routingTable);
        expect(clonedRoutingTable.peers.size).toEqual(1);
        expect(clonedRoutingTable.peers.get(peerGuid)).toEqual(ip);
    });
});
