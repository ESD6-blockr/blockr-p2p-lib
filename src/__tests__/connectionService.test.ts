import {Message} from "../models";
import {ConnectionService} from "../services/concretes/connection.service";

let connectionService: ConnectionService;
let testPort: string;

beforeEach(async () => {
    testPort = "65535";
    connectionService = new ConnectionService();
    await connectionService.initMock(testPort);
});

describe("Connection service", () => {
    it("Should be properly instantiated", () => {
        expect(connectionService).toBeDefined();
        expect(connectionService).toBeInstanceOf(ConnectionService);
    });
});

describe("Send a message", () => {
    it("Should be received", async () => {
        const type = "test";
        const originalSenderGuid = "test-guid1";
        const body = "body";
        const correlationId = "test-guid2";
        const testMessage = new Message(type, body, originalSenderGuid, correlationId);
        const destinationGuid = "test-guid3";

        connectionService.routingTable.addPeer(destinationGuid, "localhost", "test");
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
})
;

