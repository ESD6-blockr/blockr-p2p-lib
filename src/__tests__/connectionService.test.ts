import {PeerType} from "../enums";
import {UnknownDestinationException} from "../exceptions/unknownDestination.exception";
import {Message} from "../models";
import {ConnectionService} from "../services/concretes/connection.service";
import {TestBodies, TestGuids, TestIps} from "./testAddress";

let connectionService: ConnectionService;
let testPort: string;

beforeEach(async () => {
    testPort = "65535";
    connectionService = new ConnectionService(true);
    await connectionService.init(testPort);
});

describe("Connection service", () => {
    it("Should be properly instantiated", () => {
        expect(connectionService).toBeDefined();
        expect(connectionService).toBeInstanceOf(ConnectionService);
    });
});

describe("Send an async message by GUID", () => {
    it("Should be received with correct information", async () => {
        const type = PeerType.VALIDATOR;
        const originalSenderGuid = TestGuids.TEST_1;
        const body = TestBodies.TEST_1;
        const correlationId = TestGuids.TEST_2;
        const destinationGuid = TestGuids.TEST_3;
        const testIp = TestIps.TEST_1;
        const testMessage = new Message(type, body, originalSenderGuid, correlationId);

        connectionService.routingTable.addPeer(destinationGuid, testIp, type);
        connectionService.registerReceiveHandlerForMessageType("test", async (message: Message, senderGuid: string) => {
            expect(message).toBeInstanceOf(Message);
            expect(message.type).toEqual(type);
            expect(message.body).toEqual(body);
            expect(message.originalSenderGuid).toEqual(originalSenderGuid);
            expect(message.correlationId).toEqual(correlationId);
            expect(message.originalSenderGuid).toEqual(senderGuid);
        });
        await connectionService.sendMessageAsync(testMessage, destinationGuid);
    });

    it("Should fail because no ip is attached to destinationGuid", async () => {
        const type = PeerType.VALIDATOR;
        const originalSenderGuid = TestGuids.TEST_1;
        const body = TestBodies.TEST_1;
        const correlationId = TestGuids.TEST_2;
        const destinationGuid = TestGuids.TEST_3;
        const testMessage = new Message(type, body, originalSenderGuid, correlationId);

        try {
            expect(await connectionService.sendMessageAsync(testMessage, destinationGuid)).toThrowError(UnknownDestinationException);
            fail("Expected to throw an error because no destination is attached to guid");
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual(`Unknown destination. Could not find an IP for: ${destinationGuid}`);
        }
    });
});

describe("Send a async message by IP", () => {
    it("Should be received with correct information", async () => {
        const type = PeerType.VALIDATOR;
        const originalSenderGuid = TestGuids.TEST_1;
        const body = TestBodies.TEST_1;
        const correlationId = TestGuids.TEST_2;
        const testIp = TestIps.TEST_1;
        const testMessage = new Message(type, body, originalSenderGuid, correlationId);

        connectionService.registerReceiveHandlerForMessageType("test", async (message: Message, senderGuid: string) => {
            expect(message).toBeInstanceOf(Message);
            expect(message.type).toEqual(type);
            expect(message.body).toEqual(body);
            expect(message.originalSenderGuid).toEqual(originalSenderGuid);
            expect(message.correlationId).toEqual(correlationId);
            expect(message.originalSenderGuid).toEqual(senderGuid);
        });
        await connectionService.sendMessageByIpAsync(testMessage, testIp);
    });
});

describe("Send a async message by IP with response implementation", () => {
    it("Should be received with correct information", async () => {
        const type = PeerType.VALIDATOR;
        const originalSenderGuid = TestGuids.TEST_1;
        const body = TestBodies.TEST_1;
        const correlationId = TestGuids.TEST_2;
        const testIp = TestIps.TEST_1;
        const testMessage = new Message(type, body, originalSenderGuid, correlationId);

        await connectionService.sendMessageByIpAsync(testMessage, testIp, (message: Message) => {
            expect(message).toBeInstanceOf(Message);
            expect(message.type).toEqual(type);
            expect(message.body).toEqual(body);
            expect(message.originalSenderGuid).toEqual(originalSenderGuid);
            expect(message.correlationId).toEqual(correlationId);
        });
    });
});

describe("Creating routing table cleanup timer", () => {
    it("Should remove expired peers from the routing table", async () => {
        const messageExpirationTimer = 1;
        const messageHistoryCleanupTimer = 1000;
        const type = PeerType.VALIDATOR;
        const destinationGuid = TestGuids.TEST_3;
        const testIp = TestIps.TEST_1;

        connectionService.routingTable.addPeer(destinationGuid, testIp, type);
        expect(connectionService.routingTable.peers.size).toEqual(1);
        connectionService.createRoutingTableCleanupTimer(messageExpirationTimer, messageHistoryCleanupTimer);
        setTimeout(() => {
            expect(connectionService.routingTable.peers.size).toEqual(0);
        }, messageHistoryCleanupTimer);
    });
});



