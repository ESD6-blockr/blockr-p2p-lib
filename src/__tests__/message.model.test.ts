import { Guid } from "guid-typescript";
import { Message } from "../models";
import { DateManipulator } from "../util/dateManipulator";

let type: string;
let originalSenderGuid: string;
let body: string;
let correlationId: string;
let message: Message;
let message2: Message;

beforeAll(() => {
    type = "ping";
    originalSenderGuid = Guid.create().toString();
    body = "body";
    correlationId = Guid.create().toString();
    message = new Message(type, originalSenderGuid, body, correlationId);
    message2 = new Message(type, originalSenderGuid, body);
});

describe("Creating message model", () => {
    it("Should match the defined message format & properties values", () => {
        expect(message).toBeDefined();
        expect(message.guid).toBeDefined();
        expect(message.date).toBeDefined();
        expect(message.date).toBeInstanceOf(Date);
        expect(message.type).toBe(type);
        expect(message.originalSenderGuid).toBe(originalSenderGuid);
        expect(message.body).toBe(body);
        expect(message.correlationId).toBe(correlationId);
        expect(message2.correlationId).toBeDefined();
    });
});

describe("Comparing dates with isOlder function", () => {
    it("Should return the right value", () => {
        const newDate = new Date();
        const dateBefore = DateManipulator.minusMinutes(newDate, 1);
        newDate.setSeconds(newDate.getSeconds() + 1);

        expect(message.isOlderThan(newDate)).toBeTruthy();
        expect(message.isOlderThan(dateBefore)).toBeFalsy();
    });
});
