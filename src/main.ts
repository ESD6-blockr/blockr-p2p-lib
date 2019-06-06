import "reflect-metadata";
import { Peer } from "./concretes/peer";
import { PeerType } from "./enums/peerType.enum";
import { IPeer } from "./interfaces/peer";

const peer: IPeer = new Peer(PeerType.VALIDATOR);

async function start() {
    await peer.init("8081", ["145.93.125.33"]);
}
start();
