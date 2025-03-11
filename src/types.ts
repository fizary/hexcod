export type Source =
    | ArrayBuffer
    | Int8Array
    | Uint8Array
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array
    | BigInt64Array
    | BigUint64Array;

export type NumberDataType = "i8" | "u8" | "i16" | "u16" | "i32" | "u32" | "f32" | "f64";
export type BigNumberDataType = "i64" | "u64";
export type DataType = NumberDataType | BigNumberDataType;
export type PrimitiveValue<T extends DataType> = T extends BigNumberDataType ? bigint : number;

export type TypedArrayMap = {
    i8: Int8Array;
    u8: Uint8Array;
    i16: Int16Array;
    u16: Uint16Array;
    i32: Int32Array;
    u32: Uint32Array;
    f32: Float32Array;
    f64: Float64Array;
    i64: BigInt64Array;
    u64: BigUint64Array;
};
export type TypedArray<T extends DataType> = TypedArrayMap[T];
