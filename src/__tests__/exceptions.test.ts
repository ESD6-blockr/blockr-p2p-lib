import { PeerNotPresentException } from "../exceptions/peerNotPresent.exception";
import { UnknownDestinationException } from "../exceptions/unknownDestination.exception";

describe("Exception: {name} should instantiate with a message", () => {
    it("{Peer not present}", () => {
        const exception = new PeerNotPresentException("Exception");

        expect(exception).toBeDefined();
        expect(exception).toBeInstanceOf(PeerNotPresentException);
        expect(exception.message).toBe("Exception");
    });

    it("{Unknown destination}", () => {
        const exception = new UnknownDestinationException("Exception");

        expect(exception).toBeDefined();
        expect(exception).toBeInstanceOf(UnknownDestinationException);
        expect(exception.message).toBe("Exception");
    });
});
