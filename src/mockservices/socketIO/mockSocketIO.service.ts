import {IMessageListener} from "../../interfaces/messageListener";
import {Message} from "../../models";
import {ICommunicationProtocol} from "../../services/interfaces/communicationProtocol.service";
import {MockSocketIOReceiver} from "./mockSocketIOReceiver.service";
import {MockSocketIOSender} from "./mockSocketIOSender.service";

/**
 * Handles the sending of messages during tests.
 */
export class MockSocketIOCommunicationProtocol implements ICommunicationProtocol {
    private readonly sender: MockSocketIOSender;
    private readonly receiver: MockSocketIOReceiver;

    /**
     * Creates an instance of socket io.
     * @param messageListener The listener for new messages
     * @param port The communication port
     */
    constructor(messageListener: IMessageListener, port: string) {
        this.receiver = new MockSocketIOReceiver(messageListener, port);
        this.sender = new MockSocketIOSender(port);
    }

    /**
     * Emits the given message to the given destinationIp and adds the message to the history.
     *
     * @param message - The message
     * @param destinationIp - The destinationIp ip
     */
    public sendMessageAsync(message: Message, destinationIp: string): Promise<void> {
        return this.sender.sendMessageAsync(message, destinationIp);
    }

    /**
     * Send an acknowledge message to the given destinationIp, based on the given message.
     *
     * @param originalMessage - The message
     * @param destinationIp - The destinationIp
     */
    public sendAcknowledgementAsync(originalMessage: Message, destinationIp: string): Promise<void> {
        return this.sender.sendAcknowledgementAsync(originalMessage, destinationIp);
    }

}
