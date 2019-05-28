/**
 * Peer not present exception
 */
export class PeerNotPresentException extends Error {
    
    /**
     * Creates an instance of unknown destination exception.
     * @param message 
     */
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, PeerNotPresentException.prototype);
    }
}
