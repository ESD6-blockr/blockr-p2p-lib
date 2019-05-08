import chalk from "chalk";
import * as figlet from "figlet";
import * as readline from "readline";
import {Peer} from "./peer";

const commandLine = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const peer = new Peer([], "8081");

commandLine.on("line", (line: any) => {
    const lineInput = line.trim();
    if (lineInput.startsWith("send")) {
        const splitInput = lineInput.split(" ");
        if (!peer.sendMessage(splitInput[1], splitInput[2])) {
            console.log("Invalid send request. Destination or message type cannot be null");
        }
    } else if (lineInput.startsWith("help")) {
        console.log("You can send a message using the following command and arguments:" +
            " send <destination> <messageType>");
    } else {
        console.log("Unrecognized command. Use help for information about the available commands");
    }
    commandLine.prompt();
}).on("close", () => {
    process.exit(0);
});

console.log(
    chalk.yellow(
        figlet.textSync("p2p-cli", {horizontalLayout: "full"}),
    ),
);
console.log("Send a message using the following command and arguments: send <destination> <messageType>");


