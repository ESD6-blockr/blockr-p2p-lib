import { Guid } from "guid-typescript";
import { PeerNode, RoutingTable } from "../models";
import { TestIps } from "./testAddress";

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
        const ip = TestIps.TEST_1;

        routingTable.addPeer(peerGuid, ip, "validator");
        const peerNode = routingTable.peers.get(peerGuid);

        expect(peerNode).not.toBeUndefined();
        expect(routingTable.peers.size).toEqual(1);
        // @ts-ignore
        expect(peerNode.ip).toEqual(ip);

        routingTable.removePeer(peerGuid);

        expect(routingTable.peers.size).toEqual(0);
    });
});

describe("Merging routing tables", () => {
    it("Should merge routing tables", () => {
        const peerGuid = Guid.create().toString();
        const peerGuid2 = Guid.create().toString();
        const ip = TestIps.TEST_1;
        const ip2 = TestIps.TEST_2;
        const peerNode = new PeerNode(ip, "validator");

        const peersMap = new Map<string, PeerNode>();
        peersMap.set(peerGuid, peerNode);
        routingTable.addPeer(peerGuid2, ip2, "validator");

        routingTable.mergeRoutingTables(peersMap);

        expect(routingTable.peers.size).toEqual(2);
        expect(routingTable.peers.get(peerGuid)).toEqual(ip);
        expect(routingTable.peers.get(peerGuid2)).toEqual(ip2);
    });
});

describe("Cloning the routing table", () => {
    it("Should clone the routing table object", () => {
        const peerGuid = Guid.create().toString();
        const ip = TestIps.TEST_1;

        routingTable.addPeer(peerGuid, ip, "validator");
        const clonedRoutingTable = routingTable.clone();

        expect(clonedRoutingTable).toBeDefined();
        expect(clonedRoutingTable).toBeInstanceOf(RoutingTable);
        expect(clonedRoutingTable).not.toBe(routingTable);
        expect(clonedRoutingTable.peers.size).toEqual(1);
        expect(clonedRoutingTable.peers.get(peerGuid)).toEqual(ip);
    });
});
