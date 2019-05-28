import { Guid } from "guid-typescript";
import {MockConnectionService} from "../mockservices/mockConnection.service";
import { Message } from "../models";

let mockConnectionService: MockConnectionService;
let testPort: number;

beforeEach(async () => {
    testPort = 65535;
    mockConnectionService = new MockConnectionService();
    await mockConnectionService.init(testPort.toString());
});

describe("Connection service", () => {
    it("Should be instantiated", () => {
        expect(mockConnectionService).toBeDefined();
        expect(mockConnectionService).toBeInstanceOf(MockConnectionService);
    });
});

describe("", () => {
    it("", () => {
        // const type = "ping";
        // const originalSenderGuid = Guid.create().toString();
        // const body = "body";
        // const correlationId = Guid.create().toString();
        // const message = new Message(type, originalSenderGuid, body, correlationId);
        // const destinationGuid = Guid.create().toString();
        //
        // mockConnectionService.sendMessageAsync(message, destinationGuid);
    });
});
