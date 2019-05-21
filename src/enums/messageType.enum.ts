
/**
 * Message type
 */
export enum MessageType {
    PING = "ping",
    PING_RESPONSE = "ping_res",
    JOIN = "join",
    JOIN_RESPONSE = "join_res",
    ACKNOWLEDGE = "ack",
    NEW_PEER = "new_peer",
    LEAVE = "leave",
}
