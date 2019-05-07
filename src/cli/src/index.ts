const chalk = require("chalk");
const figlet = require("figlet");
const readline = require("readline");
const commandLine = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// TODO: Start listener via peer
commandLine.on("line", (line: any) => {
    const lineInput = line.trim();
    if (lineInput.startsWith("send")) {
        // TODO: Implement send message when blockr-p2p-lib has a working version.
        const splitInput = lineInput.split(" ");
        console.log("Arguments: " + splitInput[1] + " | " + splitInput[2]);
    } else if (lineInput.startsWith("help")) {
        console.log("You can send a message using the following command and arguments:" +
            " send <destination> <messageType>");
    } else {
        console.log("Unrecognized command. Use help for information about the available commands");
    }
    commandLine.prompt();
}).on("close", () => {
    console.log("Have a great day!");
    process.exit(0);
});

console.log(
    chalk.yellow(
        figlet.textSync("p2p-cli", {horizontalLayout: "full"}),
    ),
);
console.log("Send a message using the following command and arguments: send <destination> <messageType>");


