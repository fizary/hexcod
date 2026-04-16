import { defaultTextDecoder, encodingMap, type EncodingMap } from "./encodings.ts";
import { PLATFORM_LITTLE_ENDIAN } from "./endianness.ts";
import { OutOfBoundsError, UnknownDataTypeError, UnknownEncodingError, TerminatorNotFoundError } from "./errors.ts";
import { dataTypeMap } from "./maps.ts";
import type { DataType, PrimitiveValue, TypedArray } from "./types.ts";

/**
 * Valid stream data source.
 */
export type StreamSource =
    | ArrayBuffer
    | ArrayBufferView<ArrayBuffer>;

/**
 * Configuration options for initializing or reinitializing a stream.
 */
export type StreamOptions = {
    /**
     * Byte offset, which combined with `byteLength` specifies the range covered by the stream.
     *
     * The resulting range must remain within the bounds of the source.
     *
     * Defaults to `source.byteOffset` when an ArrayBufferView is used, otherwise `0`.
     */
    byteOffset?: number;

    /**
     * Byte length, which combined with `byteOffset` specifies the range covered by the stream.
     *
     * The resulting range must remain within the bounds of the source.
     *
     * Defaults to `source.byteLength`.
     */
    byteLength?: number;

    /**
     * Mapping of encoding labels to terminator byte sequences, used when reading strings.
     *
     * Keys should match the `TextDecoder.encoding` property.
     * 
     * Defaults to a built-in map.
     */
    encodingMap?: EncodingMap;

    /**
     * Default text decoder used when reading strings.
     * 
     * Defaults to `new TextDecoder("utf-8")`.
     */
    textDecoder?: TextDecoder;
};

/**
 * Configuration options for creating a substream.
 */
export type SubstreamOptions = {
    /**
     * Mapping of encoding labels to terminator byte sequences, used when reading strings.
     */
    encodingMap?: EncodingMap;

    /**
     * Default text decoder used when reading strings.
     */
    textDecoder?: TextDecoder;
};

/**
 * Binary reader designed to simplify reading from unaligned offsets.
 */
export class BinaryStream {
    /**
     * Underlying buffer.
     */
    buffer: ArrayBuffer;

    /**
     * Uint8Array covering the accessible range.
     */
    view: Uint8Array<ArrayBuffer>;

    /**
     * DataView covering the accessible range.
     */
    dataview: DataView<ArrayBuffer>;

    /**
     * Cursor position relative to the start of the stream.
     */
    offset: number;

    /**
     * Mapping of encoding labels to terminator byte sequences, used when reading strings.
     */
    encodingMap: EncodingMap;

    /**
     * Default text decoder used when reading strings.
     */
    textDecoder: TextDecoder;

    /**
     * Cursor position relative to the start of the underlying buffer.
     */
    get bufferOffset(): number {
        return this.view.byteOffset + this.offset;
    }

    /**
     * Length of the stream in bytes.
     */
    get byteLength(): number {
        return this.view.byteLength;
    }

    /**
     * Number of bytes from the cursor position to the end of the stream.
     */
    get remaining(): number {
        return this.view.byteLength - this.offset;
    }

    /**
     * Creates a new stream over the given source.
     *
     * @param source Stream source.
     * @param options Optional configuration.
     * @throws {OutOfBoundsError} When requested range is outside source bounds.
     */
    constructor(source: StreamSource, options: StreamOptions = {}) {
        let sourceByteOffset = 0;

        if (ArrayBuffer.isView(source)) {
            this.buffer = source.buffer;
            sourceByteOffset = source.byteOffset;
        } else
            this.buffer = source;

        const byteOffset = options.byteOffset ?? sourceByteOffset;
        const byteLength = options.byteLength ?? source.byteLength - (byteOffset - sourceByteOffset);

        if (byteLength < 0 || byteOffset < sourceByteOffset || byteOffset + byteLength > sourceByteOffset + source.byteLength)
            throw new OutOfBoundsError();

        this.view = new Uint8Array(this.buffer, byteOffset, byteLength);
        this.dataview = new DataView(this.buffer, byteOffset, byteLength);
        this.offset = 0;
        this.encodingMap = options.encodingMap ?? encodingMap;
        this.textDecoder = options.textDecoder ?? defaultTextDecoder;
    }

    /**
     * Reinitializes the stream with a new source and options.
     * 
     * @param source Stream source.
     * @param options Optional configuration.
     * @throws {OutOfBoundsError} When requested range is outside source bounds.
     */
    reInit(source: StreamSource, options: StreamOptions = {}): void {
        let sourceByteOffset = 0;

        if (ArrayBuffer.isView(source)) {
            this.buffer = source.buffer;
            sourceByteOffset = source.byteOffset;
        } else
            this.buffer = source;

        const byteOffset = options.byteOffset ?? sourceByteOffset;
        const byteLength = options.byteLength ?? source.byteLength - (byteOffset - sourceByteOffset);

        if (byteLength < 0 || byteOffset < sourceByteOffset || byteOffset + byteLength > sourceByteOffset + source.byteLength)
            throw new OutOfBoundsError();

        this.view = new Uint8Array(this.buffer, byteOffset, byteLength);
        this.dataview = new DataView(this.buffer, byteOffset, byteLength);
        this.offset = 0;
        this.encodingMap = options.encodingMap ?? encodingMap;
        this.textDecoder = options.textDecoder ?? defaultTextDecoder;
    }

    /**
     * Creates a substream over the next range of bytes.
     * 
     * Advances the parent cursor by `byteLength`.
     *
     * @param byteLength Number of bytes in the substream.
     * @param options Optional configuration. Inferred from parent stream when not provided.
     * @returns A new stream covering the requested range.
     * @throws {OutOfBoundsError} When requested range is outside parent stream bounds.
     */
    substream(byteLength: number, options: SubstreamOptions = {}): BinaryStream {
        if (byteLength < 0 || byteLength > this.remaining)
            throw new OutOfBoundsError();

        const offset = this.bufferOffset;
        this.offset += byteLength;

        return new BinaryStream(this.view, {
            byteOffset: offset,
            byteLength,
            encodingMap: options.encodingMap ?? this.encodingMap,
            textDecoder: options.textDecoder ?? this.textDecoder,
        });
    }

    /**
     * Sets the encoding map.
     * 
     * @param encodingMap Encoding map to use.
     */
    setEncodingMap(encodingMap: EncodingMap): void {
        this.encodingMap = encodingMap;
    }

    /**
     * Sets the text decoder.
     * 
     * @param textDecoder Text decoder to use.
     */
    setTextDecoder(textDecoder: TextDecoder): void {
        this.textDecoder = textDecoder;
    }

    /**
     * Moves the cursor to an absolute position.
     *
     * @param offset New cursor position.
     * @throws {OutOfBoundsError} When new cursor position is outside stream bounds.
     */
    seek(offset: number): void {
        if (offset < 0 || offset > this.byteLength)
            throw new OutOfBoundsError();

        this.offset = offset;
    }

    /**
     * Moves the cursor relative to the current position.
     *
     * @param byteLength Number of bytes to move the cursor by. Negative values move the cursor backward.
     * @throws {OutOfBoundsError} When new cursor position is outside stream bounds.
     */
    seekBy(byteLength: number): void {
        const offset = this.offset + byteLength;

        if (offset < 0 || offset > this.byteLength)
            throw new OutOfBoundsError();

        this.offset = offset;
    }

    /**
     * Reads a single element.
     * 
     * The cursor advances by the size of the requested element.
     *
     * @param type Data type of the element.
     * @returns The requested element.
     * @throws {UnknownDataTypeError} When `type` is not supported.
     * @throws {OutOfBoundsError} When read outside stream bounds.
     */
    read<T extends DataType>(type: T): PrimitiveValue<T>;

    /**
     * Reads an array of elements.
     *
     * Performs zero-copy when alignment and endianness allow it.
     * Otherwise data is copied.
     * 
     * The cursor advances by the size of the requested array.
     *
     * @param type Data type of the array.
     * @param length Length of the array.
     * @returns The requested array.
     * @throws {UnknownDataTypeError} When `type` is not supported.
     * @throws {OutOfBoundsError} When read outside stream bounds.
     */
    read<T extends DataType>(type: T, length: number): TypedArray<T>;

    read<T extends DataType>(type: T, length?: number): PrimitiveValue<T> | TypedArray<T> {
        if (dataTypeMap[type] === undefined)
            throw new UnknownDataTypeError(type);

        const { TypedArray, method, littleEndian } = dataTypeMap[type];
        const elementSize = TypedArray.BYTES_PER_ELEMENT;
        const bytes = (length ?? 1) * elementSize;

        if (bytes < 0 || bytes > this.remaining)
            throw new OutOfBoundsError();

        let result;

        if (length === undefined)
            result = type === "u8"
                ? this.view[this.offset]
                : this.dataview[method](this.offset, littleEndian);
        else if (elementSize === 1 || (PLATFORM_LITTLE_ENDIAN === littleEndian && this.bufferOffset % elementSize === 0))
            result = new TypedArray(this.buffer, this.bufferOffset, length);
        else {
            result = new TypedArray(length);

            let offset = this.offset;

            for (let i = 0; i < length; i++) {
                result[i] = this.dataview[method](offset, littleEndian);
                offset += elementSize;
            }
        }

        this.offset += bytes;

        return result as PrimitiveValue<T> | TypedArray<T>;
    }

    /**
     * Reads a string terminated by a byte sequence.
     * 
     * The cursor advances past the terminator.
     * 
     * @param decoder Text decoder used for decoding. Defaults to stream `textDecoder`.
     * @param terminatorBytes Terminator byte sequence. Inferred from `encodingMap` when not provided.
     * Its length is treated as the code unit size.
     * @returns The decoded string.
     * @throws {UnknownEncodingError} When `terminatorBytes` cannot be resolved.
     * @throws {TerminatorNotFoundError} When no terminator is found in the remaining data.
     */
    readTerminatedString(decoder: TextDecoder = this.textDecoder, terminatorBytes: number[] | undefined = this.encodingMap[decoder.encoding]): string {
        if (terminatorBytes === undefined)
            throw new UnknownEncodingError(decoder.encoding);

        const start = this.offset;
        const end = start + this.remaining;
        const codeUnitSize = terminatorBytes.length;
        let terminatorIndex = -1;

        for (let i = start, j = 0; i < end;) {
            if (this.view[i] !== terminatorBytes[j]) {
                i += codeUnitSize - j;
                j = 0;
                continue;
            }

            i++;
            j++;

            if (j === codeUnitSize) {
                terminatorIndex = i - j;
                break;
            }
        }

        if (terminatorIndex < 0)
            throw new TerminatorNotFoundError();

        this.offset = terminatorIndex + codeUnitSize;

        return decoder.decode(this.view.subarray(start, terminatorIndex));
    }

    /**
     * Reads a fixed-length string.
     * 
     * Optionally trims repeated trailing terminator byte sequences.
     * Trimming is skipped when `terminatorBytes` is `false` or when `byteLength` is not aligned to the code unit size.
     * 
     * The cursor advances by `byteLength`.
     * 
     * @param byteLength Number of bytes to read.
     * @param decoder Text decoder used for decoding. Defaults to stream `textDecoder`.
     * @param terminatorBytes Terminator byte sequence. Inferred from `encodingMap` when not provided.
     * Its length is treated as the code unit size.  
     * Use `false` to disable trimming.
     * @returns The decoded string.
     * @throws {UnknownEncodingError} When `terminatorBytes` cannot be resolved.
     * @throws {OutOfBoundsError} When read outside stream bounds.
     */
    readString(byteLength: number, decoder: TextDecoder = this.textDecoder, terminatorBytes: number[] | false | undefined = this.encodingMap[decoder.encoding]): string {
        if (terminatorBytes === undefined)
            throw new UnknownEncodingError(decoder.encoding);
        else if (byteLength < 0 || byteLength > this.remaining)
            throw new OutOfBoundsError();

        const start = this.offset;
        const end = start + byteLength;
        let terminatorIndex = end;

        if (typeof terminatorBytes === "object" && byteLength % terminatorBytes.length === 0)
            for (let i = end - 1, j = terminatorBytes.length - 1; i >= start; i--, j--) {
                if (this.view[i] !== terminatorBytes[j])
                    break;
                else if (j === 0) {
                    terminatorIndex = i;
                    j = terminatorBytes.length;
                }
            }

        this.offset = end;

        return decoder.decode(this.view.subarray(start, terminatorIndex));
    }
}
