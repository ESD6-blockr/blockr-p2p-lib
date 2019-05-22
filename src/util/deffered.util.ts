/** Implements a Deferred, a simple way to create promises. 
 *  This class is used to wait on a resolve of a promise that happens in a different thread.
 */
export class Deferred<T> {
    public promise: Promise<T>;
    public resolve?: (result: T | PromiseLike<T>) => void;
    public reject?: (reason: Error) => void;

    /**
     * Creates an instance of deferred.
     */
    constructor() {
        this.promise = new Promise<T>((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
