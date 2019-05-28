import { Peer } from "./concretes/peer";
import { PeerType } from "./enums";
import { IPeer } from "./interfaces/peer";

const peer: IPeer = new Peer(PeerType.INITIAL_PEER);
peer.init();
