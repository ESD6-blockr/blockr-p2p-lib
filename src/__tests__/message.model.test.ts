import { Guid } from "guid-typescript";
import { Message } from "../models";
import { DateManipulator } from "../util/dateManipulator";

let originalSenderGuid: string;
let correlationId: string;
let message: Message;
let message2: Message;
const type = "ping";
const body = "body";

beforeAll(() => {
    originalSenderGuid = Guid.create().toString();
    correlationId = Guid.create().toString();
    message = new Message(type, body, originalSenderGuid, correlationId);
    message2 = new Message(type, body, originalSenderGuid);
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
        const secondsPerMinute: number = 60;
        const dateBefore = DateManipulator.minusSeconds(newDate, secondsPerMinute);
        newDate.setSeconds(newDate.getSeconds() + 1);

        expect(DateManipulator.isDateOlderThan(message.date, newDate)).toBeTruthy();
        expect(DateManipulator.isDateOlderThan(message.date, dateBefore)).toBeFalsy();
    });
});
