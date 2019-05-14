import {logger} from "@blockr/blockr-logger";
import chalk from "chalk";
import * as figlet from "figlet";
import * as readline from "readline";
import {Peer} from "./peer";

const helpText = "Send a message using the following command and arguments: " +
    "send <destination> <messageType> <messageBody>";
const destinationIndex = 1;
const messageTypeIndex = 2;
const messageBodyIndex = 3;

const commandLine = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const peer = new Peer(["145.93.124.211"], "8081", false);

commandLine.on("line", (line: string) => {
    const lineInput = line.trim();
    if (lineInput.startsWith("send")) {
        const splitInput = lineInput.split(" ");
        if (splitInput[destinationIndex] && splitInput[messageTypeIndex]) {
            peer.sendMessage(splitInput[messageTypeIndex], splitInput[destinationIndex], splitInput[messageBodyIndex]);
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


