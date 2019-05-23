/**
 * Unknown destination exception
 */
export class UnknownDestinationException extends Error {
    
    /**
     * Creates an instance of unknown destination exception.
     * @param message 
     */
    constructor(message: string) {
        super(message);
    }
}
