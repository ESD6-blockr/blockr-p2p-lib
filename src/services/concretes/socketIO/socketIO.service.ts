import { listen, Socket } from "socket.io";
import { connect } from "socket.io-client";
import { MessageType } from "../../../enums/messageType.enum";
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
    private readonly reciever: SocketIOReceiver;


    /**
     * Creates an instance of socket io.
     * @param messageListener 
     * @param port 
     */
    constructor(messageListener: IMessageListener, port: string) {
        this.reciever = new SocketIOReceiver(messageListener, port);
        this.sender = new SocketIOSender(port);
    }

    /**
     * Emits the given message to the given destinationIp and adds the message to the history.
     *
     * @param message - The message
     * @param destinationIp - The destinationIp ip
     */
    public sendMessage(message: Message, destinationIp: string): Promise<void> {
        return this.sender.sendMessage(message, destinationIp);
    }

    /**
     * Send an acknowledge message to the given destinationIp, based on the given message.
     *
     * @param originalMessage - The message
     * @param destinationIp - The destinationIp
     */
    public sendAcknowledgeMessage(originalMessage: Message, destinationIp: string): Promise<void> {
        return this.sender.sendAcknowledgeMessage(originalMessage, destinationIp);
    }
}