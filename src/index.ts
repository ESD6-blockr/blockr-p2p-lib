import { logger } from "@blockr/blockr-logger";
import { Peer } from "./concrete/peer";
import { Message } from "./models/message";

export { IPeer } from "./interfaces/peer";
export { Peer } from "./concrete/peer";


const peer = new Peer("8081");

peer.registerReceiveHandlerForMessageType("test", (message: Message, sender: string, response: (body: string) => void ) => {
    console.log(message, sender);
    console.log("recieved test message");
    logger.info(`recieved test message`);
    response("test response");
});


    peer.sendBroadcast("test", "text",  (response: Message) => {
        console.log("recieved response")
        console.log(response)
    });
