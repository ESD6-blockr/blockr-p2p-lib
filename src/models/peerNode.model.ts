export class PeerNode {
    public readonly ip: string;
    public readonly type: string;

    public constructor(ip: string, type: string) {
        this.ip = ip;
        this.type = type;
    }
}
