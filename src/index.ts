import { logger } from "@blockr/blockr-logger";
import { Peer } from "./concrete/peer";
import { RESPONSE_TYPE } from "./interfaces/peer";
import { Message } from "./models/message.model";

export { IPeer } from "./interfaces/peer";
export { Peer } from "./concrete/peer";


async function start() {
    const peer = new Peer();
    await peer.init("8081", ["145.93.58.247"]);
    // peer.registerReceiveHandlerForMessageType("test", (message: Message, sender: string, response: RESPONSE_TYPE) => {
    //     message = message;
    //     sender = sender;
    //     logger.info(`recieved test message`);
    //     response(new Message("test", ""));
    // });

    // console.log("send broadcast");
    const message = new Message("test", "", "test");
    await peer.sendBroadcast(message,  () => {
         logger.info(`==================recieved test message response`);
     });
    
}

start();

