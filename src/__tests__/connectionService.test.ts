import {PeerType} from "../enums";
import {UnknownDestinationException} from "../exceptions/unknownDestination.exception";
import {RESPONSE_TYPE} from "../interfaces/peer";
import {Message} from "../models";
import {ConnectionService} from "../services/concretes/connection.service";
import {TestBodies, TestGuids, TestIps} from "./testAddress";

let connectionService: ConnectionService;
const testPort = "65535";

beforeEach(async () => {
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
        const destinationGuid = originalSenderGuid;
        const testIp = TestIps.TEST_LOCALHOST;
        const port = ":8081";
        const testMessage = new Message(type, body, originalSenderGuid, correlationId);
        const expectedMessageCount = 1;
        let receivedMessageCount = 0;

        connectionService.routingTable.addPeer(destinationGuid, testIp, type, port);
        connectionService.registerReceiveHandlerForMessageType(type, async (message: Message, senderGuid: string) => {
            expect(message).toBeInstanceOf(Message);
            expect(message.type).toEqual(type);
            expect(message.body).toEqual(body);
            expect(message.originalSenderGuid).toEqual(originalSenderGuid);
            expect(message.correlationId).toEqual(correlationId);
            expect(message.originalSenderGuid).toEqual(senderGuid);
            receivedMessageCount++;

        });
        await connectionService.sendMessageAsync(testMessage, destinationGuid);
        expect(receivedMessageCount).toEqual(expectedMessageCount);
    });

    it("Should fail because no ip is attached to destinationGuid", async () => {
        const type = PeerType.VALIDATOR;
        const originalSenderGuid = TestGuids.TEST_1;
        const body = TestBodies.TEST_1;
        const correlationId = TestGuids.TEST_2;
        const destinationGuid = originalSenderGuid;
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
        const testIp = TestIps.TEST_LOCALHOST;
        const testMessage = new Message(type, body, originalSenderGuid, correlationId);
        const expectedMessageCount = 1;
        let receivedMessageCount = 0;

        connectionService.registerReceiveHandlerForMessageType(type, async (message: Message, senderGuid: string) => {
            expect(message).toBeInstanceOf(Message);
            expect(message.type).toEqual(type);
            expect(message.body).toEqual(body);
            expect(message.originalSenderGuid).toEqual(originalSenderGuid);
            expect(message.correlationId).toEqual(correlationId);
            expect(message.originalSenderGuid).toEqual(senderGuid);
            receivedMessageCount++;
        });
        await connectionService.sendMessageByIpAsync(testMessage, testIp);
        expect(receivedMessageCount).toEqual(expectedMessageCount);
    });
});

// TODO: Fix not receiving message with a response implementation
// describe("Send a async message by IP with response implementation", () => {
//     it("Should be received with correct information", async () => {
//         const type = PeerType.VALIDATOR;
//         const originalSenderGuid = TestGuids.TEST_1;
//         const body = TestBodies.TEST_1;
//         const correlationId = TestGuids.TEST_2;
//         const testIp = TestIps.TEST_LOCALHOST;
//         const testMessage = new Message(type, body, originalSenderGuid, correlationId);
//         const expectedMessageCount = 1;
//         let receivedMessageCount = 0;
//
//         connectionService.registerReceiveHandlerForMessageType(type, async (message: Message, senderGuid: string, response: RESPONSE_TYPE) => {
//             if (message && senderGuid) {
//                 // Respond to the message
//                 response(message);
//             }
//         });
//         await connectionService.sendMessageByIpAsync(testMessage, testIp, (message: Message) => {
//             expect(message).toBeInstanceOf(Message);
//             expect(message.type).toEqual(type);
//             expect(message.body).toEqual(body);
//             expect(message.originalSenderGuid).toEqual(originalSenderGuid);
//             expect(message.correlationId).toEqual(correlationId);
//             receivedMessageCount++;
//         });
//         expect(receivedMessageCount).toEqual(expectedMessageCount);
//     });
// });

// TODO: Fix to confirm messages are received by all 3 peers
// describe("Send a async broadcast message", () => {
//     it("Should be received by all peers with the correct information", async () => {
//         const type = PeerType.VALIDATOR;
//         const originalSenderGuid = TestGuids.TEST_1;
//         const body = TestBodies.TEST_1;
//         const correlationId = TestGuids.TEST_2;
//         const testMessage = new Message(type, body, originalSenderGuid, correlationId);
//         const destinationGuid1 = TestGuids.TEST_3;
//         const destinationGuid2 = TestGuids.TEST_4;
//         const destinationGuid3 = TestGuids.TEST_5;
//         const testIp = TestIps.TEST_LOCALHOST;
//         const expectedMessageCount = 3;
//         let receivedMessageCount = 0;
//
//         connectionService.routingTable.addPeer(destinationGuid1, testIp, type);
//         connectionService.routingTable.addPeer(destinationGuid2, testIp, type);
//         connectionService.routingTable.addPeer(destinationGuid3, testIp, type);
//
//         connectionService.registerReceiveHandlerForMessageType(type, async (message: Message, senderGuid: string) => {
//             expect(message).toBeInstanceOf(Message);
//             expect(message.type).toEqual(type);
//             expect(message.body).toEqual(body);
//             expect(message.originalSenderGuid).toEqual(originalSenderGuid);
//             expect(message.correlationId).toEqual(correlationId);
//             expect(message.originalSenderGuid).toEqual(senderGuid);
//             receivedMessageCount++;
//         });
//         await connectionService.sendBroadcastAsync(testMessage);
//         expect(receivedMessageCount).toEqual(expectedMessageCount);
//     });
// });

describe("Creating routing table cleanup timer", () => {
    it("Should remove expired peers from the routing table", async () => {
        const messageExpirationTimer = 1;
        const messageHistoryCleanupTimer = 1000;
        const type = PeerType.VALIDATOR;
        const destinationGuid = TestGuids.TEST_3;
        const testIp = TestIps.TEST_1;
        const port = ":8081";

        connectionService.routingTable.addPeer(destinationGuid, testIp, type, port);
        expect(connectionService.routingTable.peers.size).toEqual(1);
        connectionService.createRoutingTableCleanupTimer(messageExpirationTimer, messageHistoryCleanupTimer);
        setTimeout(() => {
            expect(connectionService.routingTable.peers.size).toEqual(0);
        }, messageHistoryCleanupTimer);
    });
});



