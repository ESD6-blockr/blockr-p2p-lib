import { logger } from "@blockr/blockr-logger";
import { Peer } from "./concrete/peer";
import { RESPONSE_TYPE } from "./interfaces/peer";
import { Message } from "./models/message";

export { IPeer } from "./interfaces/peer";
export { Peer } from "./concrete/peer";


async function start() {
    const peer = new Peer();
    await peer.init();
    peer.registerReceiveHandlerForMessageType("test", (message: Message, sender: string, response: RESPONSE_TYPE) => {
        message = message;
        sender = sender;
        logger.info(`recieved test message`);
        response(new Message("test", ""));
    });

    await peer.sendBroadcast("test", "text",  () => {
        logger.info(`recieved test message response`);
    });
    
}

start();

