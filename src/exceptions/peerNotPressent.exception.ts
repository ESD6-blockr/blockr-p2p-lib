/**
 * Peer not pressent exception
 */
export class PeerNotPressentException extends Error {
    
    /**
     * Creates an instance of unknown destination exception.
     * @param message 
     */
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, PeerNotPressentException.prototype);
    }
}
