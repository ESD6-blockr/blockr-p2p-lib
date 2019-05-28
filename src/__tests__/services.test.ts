import { Guid } from "guid-typescript";
import {MockConnectionService} from "../mockservices/mockConnection.service";
import { Message } from "../models";

let mockConnectionService: MockConnectionService;
let testPort: string;

beforeEach(async () => {
    testPort = "65535";
    mockConnectionService = new MockConnectionService();
});

describe("Connection service", () => {
    it("Should be instantiated", () => {
        expect(mockConnectionService).toBeDefined();
        expect(mockConnectionService).toBeInstanceOf(MockConnectionService);
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

        await mockConnectionService.init(testPort);
        mockConnectionService.routingTable.addPeer(destinationGuid, "localhost", "test");
        mockConnectionService.sendMessageAsync(message, destinationGuid);
        expect(mockConnectionService.sentMessages.size).toEqual(1);
        expect(mockConnectionService.receivedMessages.size).toEqual(1);
    });
});
