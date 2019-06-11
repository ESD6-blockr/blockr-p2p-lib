# blockr-p2p-lib
>library for peer to peer communication

|**CI**|**SonarQube**|**Version**|
|:-:|:-:|:-:|
|[![Build Status](https://jenkins.naebers.me/buildStatus/icon?job=Blockr%2Fblockr-p2p-lib%2Fmaster)](https://jenkins.naebers.me/job/Blockr/job/blockr-p2p-lib/job/master/)|[![Quality Gate Status](https://sonarqube.naebers.me/api/project_badges/measure?project=blockr-p2p-lib&metric=alert_status)](https://sonarqube.naebers.me/dashboard?id=blockr-p2p-lib)|[![npm](https://img.shields.io/npm/v/@blockr/blockr-p2p-lib.svg)](https://www.npmjs.com/package/@blockr/blockr-p2p-lib)|

The utilities exposed by this library can be consumed by normal construction.

## Dependencies
All components implementing the P2P-library require the reflect-metadata dependency.
```ts
"dependencies": {
    "reflect-metadata": "^0.1.13"
}
```

## Importing
**ES6**
```ts
import "reflect-metadata";
import { Peer } from "./concretes/peer";
import { PeerType } from "./enums/peerType.enum";
import { IPeer } from "./interfaces/peer";
```

## Construction and initialisation
In the constructor of `Peer` expects the name of type of peer connection. For example `Validator` or `IPFS`.

The init function expects a `Port`, if left empty the default port is used. And a list of `initial peers`, these are the peers the `Peer` will try to connect to, if left empty the `Peer` assumes it is the first `Peer` of the network.

  ### Example:
*First peer of a network*
```ts
class MainService {
	private peer: IPeer;
	
	constructor() {
		this.peer = new Peer(PeerType.INITIAL_PEER);
		this.peer.init();
	}
}
```

*Peer connecting to the network, it is possible to await the init to ensure a connection is made.*
```ts
class MainService {
	private peer: IPeer;

	constructor() {
		this.peer = new Peer(PeerType.VALIDATOR);
		await this.peer.init(["0.0.0.0:8081"]);
	}
}
```

  ### Usage:
 *See the TSDoc of IPeer, found at src/interfaces/peer, for more specific information*

 ```ts
// Create the peer
const peer: IPeer = new Peer(PeerType.IPFS);
// Connect to the p2p network and await the connection
await peer.init(["0.0.0.0:8081"], "8082");

// Add custom receive handler without a response
peer.registerReceiveHandlerForMessageType("testMessageType", async (message: Message, senderGuid: string) => {
    if (message && senderGuid) {
        Logger.info(message.correlationId);
    }
});
// Add custom receive handler with a response type
peer.registerReceiveHandlerForMessageType("testMessageTypeWithResponse", async (message: Message, senderGuid: string, response: RESPONSE_TYPE) => {
    if (message && senderGuid) {
        // Rspond to the message
        response(message);
    }
});

// Get a validator peer
const validatorPeer: [string,string] = peer.getPeerOfType(PeerType.VALIDATOR); 
if (!validatorPeer) {
    // Get the guid of the validator. [0] = Guid, [1] = Ip 
    const validatorGuid: string = validatorPeer[0];
    
    // Basic message without responses
    const message: Message = new Message("testMessageType", "testMessageType");

    // Send the message to the validator
    // Optional to await the sending of the message
    await peer.sendMessageAsync(message, validatorGuid);
    // Send the message to all peers in the network
    // Optional to await the sending of the message
    await peer.sendBroadcastAsync(message);

    // Message with a response
    const message: Message = new Message("testMessageTypeWithResponse", "testMessageType");

    // Send the message to the validator, with a response implementation
    // Optional to await the sending of the message
    await peer.sendMessageAsync(message, validatorGuid, (responseMessage: Message) => {
        Logger.info(responseMessage.correlationId);
    });
    // With a response implementation it is possible to wait till the other peer has responded to the message.
    await peer.getPromiseForResponse(message);
}

// Leave the network
peer.leave();
```

