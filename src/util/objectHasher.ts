import { sha1 } from "object-hash";

/**
 * Utility class for the hashing of objects.
 */
export class ObjectHasher {
    /**
     * Generate sha1 hash of the given object.
     */
    public static generateSha1(object: object): string {
        return sha1(object);
    }
}
