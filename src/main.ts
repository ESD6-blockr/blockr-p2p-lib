import { Peer } from "./concretes/peer";
import { IPeer } from "./interfaces/peer";

const peer: IPeer = new Peer("initialPeer");
peer.init();
