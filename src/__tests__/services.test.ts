import { Guid } from "guid-typescript";
import { Message } from "../models";
import { ConnectionService } from "../services/concretes/connection.service";
import { MockCommunicationProtocol } from "../mocks/mockCommunicationProtocol.service";

let connectionService: ConnectionService;
let testPort: string;

beforeEach(async () => {
    testPort = "65535";
    connectionService = new ConnectionService();
    await connectionService.init(testPort);
    // Override communicationProtocol to mock web sockets
    connectionService.communicationProtocol = new MockCommunicationProtocol(connectionService, testPort);
});

describe("Connection service", () => {
    it("Should be instantiated", () => {
        expect(connectionService).toBeDefined();
        expect(connectionService).toBeInstanceOf(ConnectionService);
        expect(connectionService.communicationProtocol).toBeInstanceOf(MockCommunicationProtocol);
    });
});

describe("Send a message", () => {
    it("Should be received", async () => {
        const type = "test";
        const originalSenderGuid = Guid.create().toString();
        const body = "body";
        const correlationId = Guid.create().toString();
        const message = new Message(type, originalSenderGuid, body, correlationId);
        const destinationGuid = "test";


        connectionService.routingTable.addPeer(destinationGuid, "localhost", "test");
        connectionService.sendMessageAsync(message, destinationGuid);
        // expect(connectionService.sentMessages.size).toEqual(1);
        // expect(connectionService.receivedMessages.size).toEqual(1);
    });
});
