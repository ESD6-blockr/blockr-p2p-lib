import "reflect-metadata";
import { Peer } from "./concretes/peer";
import { PeerType } from "./enums";
import { IPeer } from "./interfaces/peer";

const peer: IPeer = new Peer(PeerType.INITIAL_PEER);

async function start() {
    await peer.init();
}
start();
