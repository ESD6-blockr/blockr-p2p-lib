import {logger} from "@blockr/blockr-logger";
import chalk from "chalk";
import * as figlet from "figlet";
import * as readline from "readline";
import {Peer} from "./peer";

const commandLine = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const helpText = "Send a message using the following command and arguments: " +
    "send <destination> <messageType> <messageBody>";

const peer = new Peer([], "8081");

commandLine.on("line", (line: any) => {
    const lineInput = line.trim();
    if (lineInput.startsWith("send")) {
        const splitInput = lineInput.split(" ");
        if (splitInput[1] && splitInput[2]) {
            peer.sendMessage(splitInput[1], splitInput[2], splitInput[3]);
        } else {
            logger.info("Invalid send request. Destination or message type cannot be null");
        }
    } else if (lineInput.startsWith("help")) {
        logger.info(helpText);
    } else {
        logger.info("Unrecognized command. Use help for information about the available commands");
    }
    commandLine.prompt();
}).on("close", () => {
    process.exit(0);
});

logger.info(chalk.yellow(
    figlet.textSync("p2p-cli", {horizontalLayout: "full"}),
    ),
);
logger.info(helpText);


