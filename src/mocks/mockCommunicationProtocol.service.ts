import {IMessageListener} from "../interfaces/messageListener";
import {Message} from "../models";
import {ICommunicationProtocol} from "../services/interfaces/communicationProtocol.service";
import {MessageType} from "../enums/messageType.enum";

/**
 * Handles the sending of messages during tests.
 */
export class MockCommunicationProtocol implements ICommunicationProtocol {
    private readonly messageListener: IMessageListener;
    private readonly receivedMessages: string[];
    private readonly port: string;

    /**
     * Creates an instance of socket io.
     * @param messageListener The listener for new messages
     * @param port The communication port
     */
    constructor(messageListener: IMessageListener, port: string) {
        this.messageListener = messageListener;
        this.port = port;
        this.receivedMessages = [];
    }

    /**
     * Emits the given message to the given destinationIp and adds the message to the history.
     *
     * @param message - The message
     * @param destinationIp - The destinationIp ip
     */
    public sendMessageAsync(message: Message, destinationIp: string): Promise<void> {
        return new Promise((resolve) => {
            if (!this.receivedMessages.includes(message.guid)) {
                message.senderIp = destinationIp;
                this.receivedMessages.push(message.guid);
                this.messageListener.onMessageAsync(message);
            }
            resolve();
        });
    }

    /**
     * Send an acknowledge message to the given destinationIp, based on the given message.
     *
     * @param originalMessage - The message
     * @param destinationIp - The destinationIp
     */
    public sendAcknowledgementAsync(originalMessage: Message, destinationIp: string): Promise<void> {
        const message = new Message(
            MessageType.ACKNOWLEDGE,
            originalMessage.originalSenderGuid,
            originalMessage.guid,
        );

        return this.sendMessageAsync(message, destinationIp);
    }

}
