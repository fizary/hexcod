/**
 * Supported binary data types.
 *
 * Multi-byte types include an explicit endianness suffix: `le` for little-endian and `be` for big-endian.
 */
export type DataType =
    | "i8"
    | "u8"
    | "i16le" | "i16be"
    | "u16le" | "u16be"
    | "f16le" | "f16be"
    | "i32le" | "i32be"
    | "u32le" | "u32be"
    | "f32le" | "f32be"
    | "i64le" | "i64be"
    | "u64le" | "u64be"
    | "f64le" | "f64be";

export type PrimitiveValue<T extends DataType> = {
    i8: number;
    u8: number;
    i16le: number;
    i16be: number;
    u16le: number;
    u16be: number;
    f16le: number;
    f16be: number;
    i32le: number;
    i32be: number;
    u32le: number;
    u32be: number;
    f32le: number;
    f32be: number;
    i64le: bigint;
    i64be: bigint;
    u64le: bigint;
    u64be: bigint;
    f64le: number;
    f64be: number;
}[T];

export type TypedArray<T extends DataType> = {
    i8: Int8Array<ArrayBuffer>;
    u8: Uint8Array<ArrayBuffer>;
    i16le: Int16Array<ArrayBuffer>;
    i16be: Int16Array<ArrayBuffer>;
    u16le: Uint16Array<ArrayBuffer>;
    u16be: Uint16Array<ArrayBuffer>;
    f16le: Float16Array<ArrayBuffer>;
    f16be: Float16Array<ArrayBuffer>;
    i32le: Int32Array<ArrayBuffer>;
    i32be: Int32Array<ArrayBuffer>;
    u32le: Uint32Array<ArrayBuffer>;
    u32be: Uint32Array<ArrayBuffer>;
    f32le: Float32Array<ArrayBuffer>;
    f32be: Float32Array<ArrayBuffer>;
    i64le: BigInt64Array<ArrayBuffer>;
    i64be: BigInt64Array<ArrayBuffer>;
    u64le: BigUint64Array<ArrayBuffer>;
    u64be: BigUint64Array<ArrayBuffer>;
    f64le: Float64Array<ArrayBuffer>;
    f64be: Float64Array<ArrayBuffer>;
}[T];
