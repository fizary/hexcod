import type { Source } from "../types.ts";

const decoder = new TextDecoder();

export function decode(source: Source, nullTerminated = true): string {
    const decodedString = decoder.decode(source);

    if (nullTerminated) {
        const terminatorIndex = decodedString.indexOf("\x00");
        return terminatorIndex >= 0
            ? decodedString.slice(0, terminatorIndex)
            : decodedString;
    }

    return decodedString;
}
