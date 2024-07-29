import { typedArrayMap, typecastMap } from "./utils/maps.ts";
import type { Source, DataType, PrimitiveValue, TypedArray } from "./types.ts";

type Options = {
    byteOffset?: number;
    byteLength?: number;
};

export class BinaryStream {
    buffer: ArrayBuffer;
    view: Uint8Array;
    offset: number;
    remaining: number;

    constructor(source: Source, options: Options = {}) {
        if ("buffer" in source) {
            this.buffer = source.buffer;
            options.byteOffset ??= source.byteOffset;
            options.byteLength ??= source.byteLength - (options.byteOffset - source.byteOffset);

            if (options.byteOffset < source.byteOffset || options.byteOffset + options.byteLength > source.byteOffset + source.byteLength || options.byteLength < 0)
                throw new RangeError("Out of bounds.");
        } else {
            this.buffer = source;
            options.byteOffset ??= 0;
            options.byteLength ??= source.byteLength - options.byteOffset;

            if (options.byteOffset < 0 || options.byteOffset + options.byteLength > source.byteLength || options.byteLength < 0)
                throw new RangeError("Out of bounds.");
        }

        this.view = new Uint8Array(this.buffer, options.byteOffset, options.byteLength);
        this.offset = 0;
        this.remaining = options.byteLength;
    }

    seek(offset: number): void {
        if (offset < 0 || offset > this.view.byteLength)
            throw new RangeError(`Out of bounds access at offset ${offset}.`);

        this.offset = offset;
        this.remaining = this.view.byteLength - offset;
    }

    skip(bytes: number): void {
        if (bytes < 0 || this.remaining < bytes)
            throw new RangeError(`Out of bounds access at offset ${this.offset + bytes}.`);

        this.offset += bytes;
        this.remaining -= bytes;
    }

    substream(bytes: number): BinaryStream {
        const offset = this.offset;

        if (bytes < 0 || this.remaining < bytes)
            throw new RangeError(`Out of bounds access at offset ${offset + bytes}.`);

        this.offset += bytes;
        this.remaining -= bytes;

        return new BinaryStream(this.buffer, {
            byteOffset: this.view.byteOffset + offset,
            byteLength: bytes,
        });
    }

    read<T extends DataType>(type: T): PrimitiveValue<T>;
    read<T extends DataType>(type: T, length: number): TypedArray<T>;
    read<T extends DataType>(type: T, length?: number): PrimitiveValue<T> | TypedArray<T> {
        const TypedArray = typedArrayMap[type];
        const typecast = typecastMap[type];
        const bytes = (length ?? 1) * TypedArray.BYTES_PER_ELEMENT;
        const offset = this.offset;

        if (bytes < 0 || this.remaining < bytes)
            throw new RangeError(`Out of bounds access at offset ${offset + bytes}.`);

        this.offset += bytes;
        this.remaining -= bytes;

        if (length !== undefined) {
            const globalOffset = this.view.byteOffset + offset;

            if (globalOffset % TypedArray.BYTES_PER_ELEMENT === 0)
                return new TypedArray(this.buffer, globalOffset, length) as TypedArray<T>;

            const newTypedArray = new TypedArray(length);

            for (let i = 0; i < length; i++) {
                const iOffset = TypedArray.BYTES_PER_ELEMENT * i + offset;
                newTypedArray[i] = 
                    typecast !== undefined
                        ? typecast(this.view, iOffset)
                        : this.view[iOffset];
            }

            return newTypedArray as TypedArray<T>;
        }

        return (
            typecast !== undefined
                ? typecast(this.view, offset)
                : this.view[offset]
        ) as PrimitiveValue<T>;
    }
}
