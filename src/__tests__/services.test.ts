import {ConnectionService} from "../services/connection.service";
import {Message} from "../models/message.model";
import {Guid} from "guid-typescript";

let connectionService: ConnectionService;
let randomPort: number;

beforeEach(async () => {
    const minPortRange = 0;
    const maxPortRange = 65535;
    randomPort = Math.floor(Math.random() * (+maxPortRange - +minPortRange)) + +minPortRange;

    connectionService = new ConnectionService();
    await connectionService.init(randomPort.toString());
    console.log("Connection service initialized with random port: " + randomPort);
});

afterEach(() => {
    randomPort = -1;
});

describe("Connection service", () => {
    it("Should be instantiated", () => {
        expect(connectionService).toBeDefined();
        expect(connectionService).toBeInstanceOf(ConnectionService);
    });
});

describe("", () => {
    it("", () => {
        const type = "ping";
        const originalSenderGuid = Guid.create().toString();
        const body = "body";
        const correlationId = Guid.create().toString();
        const message = new Message(type, originalSenderGuid, body, correlationId);
        const destinationGuid = Guid.create().toString();

        // TODO: Look into parameters for this function (ask Quint).
        // connectionService.sendMessage(message, destinationGuid, );
    });
});
