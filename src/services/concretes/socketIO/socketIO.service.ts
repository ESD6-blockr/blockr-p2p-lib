import { IMessageListener } from "../../../interfaces/messageListener";
import { Message } from "../../../models/message.model";
import { ICommunicationProtocol } from "../../interfaces/communicationProtocol.service";
import { SocketIOReceiver } from "./socketIOReceiver.service";
import { SocketIOSender } from "./socketIOSender.service";

/**
 * Handles the sending of messages.
 */
export class SocketIOCommunicationProtocol implements ICommunicationProtocol {
    private readonly sender: SocketIOSender;
    private readonly receiver: SocketIOReceiver;

    /**
     * Creates an instance of socket io.
     * @param messageListener The listener for new messages
     * @param port The communication port
     */
    constructor(messageListener: IMessageListener, port: string) {
        this.receiver = new SocketIOReceiver(messageListener, port);
        this.sender = new SocketIOSender(port);
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
