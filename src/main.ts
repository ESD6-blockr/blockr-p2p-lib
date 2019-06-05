import "reflect-metadata";
import { Peer } from "./concretes/peer";
import { PeerType } from "./enums/peerType.enum";
import { IPeer } from "./interfaces/peer";
import { Message } from "./models";

const peer: IPeer = new Peer(PeerType.VALIDATOR);

async function start() {
    await peer.init("8081", ["145.93.125.33"]);
    const message = new Message("blockchain_and_states_request_response");
    await peer.sendMessageToRandomPeerAsync(message, PeerType.VALIDATOR);
}
start();

