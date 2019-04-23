import { MessageType } from "./enums";
import { Message } from "./message";

export class Receiver {
    public onMessage(message: Message) {
        switch (message.type) {
            case MessageType.JOIN:
            case MessageType.LEAVE:
            case MessageType.PING:
            case MessageType.GET_ROUTING_TABLE:
        }
    }
}