import { Guid } from "guid-typescript";
import { PeerType } from "../enums";
import { PeerNode, RoutingTable } from "../models";
import { TestIps } from "./testAddress";

const TEST_PORT  = "8081";
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

        routingTable.addPeer(peerGuid, ip, PeerType.VALIDATOR, TEST_PORT);
        const peerNode = routingTable.peers.get(peerGuid);

        expect(peerNode).toBeDefined();
        expect(routingTable.peers.size).toEqual(1);
        if (peerNode) {
            expect(peerNode.ip).toEqual(ip);
        }

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
        const peersMap = new Map<string, PeerNode>();
        const expectedRoutingTableSize = 2;

        peersMap.set(peerGuid, new PeerNode(ip, PeerType.VALIDATOR, TEST_PORT));
        routingTable.addPeer(peerGuid2, ip2, PeerType.VALIDATOR, TEST_PORT);

        routingTable.mergeRoutingTables(peersMap);

        const peerNode = routingTable.peers.get(peerGuid);
        const peerNode2 = routingTable.peers.get(peerGuid2);

        expect(peerNode).toBeDefined();
        expect(peerNode2).toBeDefined();
        expect(routingTable.peers.size).toEqual(expectedRoutingTableSize);
        if (peerNode) {
            expect(peerNode.ip).toEqual(ip);
        }
        if (peerNode2) {
            expect(peerNode2.ip).toEqual(ip2);
        }
    });
});

describe("Cloning the routing table", () => {
    it("Should clone the routing table object", () => {
        const peerGuid = Guid.create().toString();
        const ip = TestIps.TEST_1;

        routingTable.addPeer(peerGuid, ip, PeerType.VALIDATOR, TEST_PORT);
        const clonedRoutingTable = routingTable.clone();

        expect(clonedRoutingTable).toBeDefined();
        expect(clonedRoutingTable).toBeInstanceOf(RoutingTable);
        expect(clonedRoutingTable).not.toBe(routingTable);
        expect(clonedRoutingTable.peers.size).toEqual(1);

        const peerNode = clonedRoutingTable.peers.get(peerGuid);
        if (peerNode) {
            expect(peerNode.ip).toEqual(ip);
        }
    });
});

describe("Get Peer of Type from routing table", () => {
    it("Should return a peer from the given type", () => {
        const peerGuid = Guid.create().toString();
        const ip = TestIps.TEST_1;
        routingTable.addPeer(peerGuid, ip, PeerType.VALIDATOR, TEST_PORT);

        const valPeerNode = routingTable.getPeerOfType(PeerType.VALIDATOR);
        expect(valPeerNode).toBeDefined();
        if (valPeerNode) {
            expect(valPeerNode).toEqual([peerGuid, ip]);
        }

        const scPeerNode = routingTable.getPeerOfType(PeerType.SMART_CONTRACT_ENGINE);
        expect(scPeerNode).toBeUndefined();
    });
});
