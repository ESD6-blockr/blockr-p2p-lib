import { Peer } from "./concretes/peer";
import { IPeer } from "./interfaces/peer";
import { Message } from "./models";

// Create the peer
const peer: IPeer = new Peer("examplePeer");
// Connect to the p2p network and await the connection
peer.init("8081", ["145.93.101.81"]);

// Add custom receive handler
peer.registerReceiveHandlerForMessageType("testMessageType", async (message: Message, senderGuid: string) => {
    if (message && senderGuid) {
        // Send the message back
        peer.sendMessageAsync(message, senderGuid);
    }
});

// Get a validator peer
const validatorGuid: string | undefined = peer.getPeerOfType("Validator");
if (validatorGuid !== undefined) {
    // Create a message
    const message: Message = new Message("testMessageType", "testMessageType");
    // Send the message to the validator
    peer.sendMessageAsync(message, validatorGuid);
    // Send the message to all peers in the network
    peer.sendBroadcastAsync(message);
}

// Leave the network
peer.leave();
