# blockr-p2p-lib
>library for peer to peer communication

|**CI**|**SonarQube**|**Version**|
|:-:|:-:|:-:|
|[![Build Status](https://jenkins.naebers.me/buildStatus/icon?job=Blockr%2Fblockr-p2p-lib%2Fmaster)](https://jenkins.naebers.me/job/Blockr/job/blockr-p2p-lib/job/master/)|[![Quality Gate Status](https://sonarqube.naebers.me/api/project_badges/measure?project=blockr-p2p-lib&metric=alert_status)](https://sonarqube.naebers.me/dashboard?id=blockr-p2p-lib)|[![npm](https://img.shields.io/npm/v/@blockr/blockr-p2p-lib.svg)](https://www.npmjs.com/package/@blockr/blockr-p2p-lib)|

The utilities exposed by this library can be consumed by normal construction.

## Importing
**ES6**
```ts
import { Peer } from "./concretes/peer";
import { IPeer } from "./interfaces/peer";
```

## Construction and initialisation
In the constructor of `Peer` expects the name of type of peer connection. For example 'Validator' or 'IPFS'.

The init function expects a `Port`, if left empty the default port is used. And a list of 'initial peers', these are the peers the `Peer` will try to connect to, if left empty the 'Peer' assumes it is the first 'Peer' of the network.

  ### Example:
*First peer of a network*
```ts
class MainService {
	private peer: IPeer;
	
	constructor() {
		this.peer = new Peer("typeOfPeer");
		this.peer.init();
	}
}
```

*Peer connecting to the network, it is possible to await the init to ensure a connection is made.*
```ts
class MainService {
	private peer: IPeer;

	constructor() {
		this.peer = new Peer("typeOfPeer");
		await this.peer.init([145.93.101.81]);
	}
}
```

  ### Usage:
 *See the TSDoc of IPeer for more specific information*