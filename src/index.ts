import { logger } from "@blockr/blockr-logger";
import { Peer } from "./concrete/peer";
import { RESPONSE_TYPE } from "./interfaces/peer";
import { Message } from "./models/message.model";
import { HostIp } from "./util/hostIp.util";
import { RoutingTable } from "./models/routingTable.model";

export { IPeer } from "./interfaces/peer";
export { Peer } from "./concrete/peer";


async function start() {
    // HostIp.getIp();
    // const peer = new Peer("validator");
    // await peer.init("8081", ["207.180.205.126"]);
    // console.log("=====================finished init2 =====================");
    // console.log("====================peer of type====================",peer.getPeerOfType("validator"));
    // // peer.registerReceiveHandlerForMessageType("test", (message: Message, sender: string, response: RESPONSE_TYPE) => {
    // //     message = message;
    // //     sender = sender;
    // //     logger.info(`recieved test message`);
    // //     response(new Message("test", ""));
    // // });

    // // console.log("send broadcast");
    // const message = new Message("test", "", "test");
    // await peer.sendBroadcast(message,  () => {
    //      logger.info(`==================recieved test message response`);
    //  });
    const table = new RoutingTable();
    table.addPeer("123", "127.0.0.1", "validator");
    console.log(table.getPeerOfType("validator"));
    
}

start();

