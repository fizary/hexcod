export class OutOfBoundsError extends Error {
    override name = "OutOfBoundsError";

    constructor() {
        super("Operation would go outside the bounds.");
    }
}

export class UnknownDataTypeError extends Error {
    override name = "UnknownDataTypeError";

    constructor(type: string) {
        super(`Unknown data type "${ type }".`);
    }
}

export class UnknownEncodingError extends Error {
    override name = "UnknownEncodingError";

    constructor(encoding: string) {
        super(`Unknown encoding "${ encoding }". Provide "terminatorBytes" or add the encoding to the "encodingMap".`);
    }
}

export class TerminatorNotFoundError extends Error {
    override name = "TerminatorNotFoundError";

    constructor() {
        super("Terminator bytes not found within the remaining bytes.");
    }
}
