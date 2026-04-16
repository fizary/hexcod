const SUPPORTS_FLOAT_16_ARRAY = typeof Float16Array === "function";

export const dataTypeMap = {
    i8: {
        TypedArray: Int8Array,
        method: "getInt8",
        littleEndian: undefined,
    },
    u8: {
        TypedArray: Uint8Array,
        method: "getUint8",
        littleEndian: undefined,
    },
    i16le: {
        TypedArray: Int16Array,
        method: "getInt16",
        littleEndian: true,
    },
    i16be: {
        TypedArray: Int16Array,
        method: "getInt16",
        littleEndian: false,
    },
    u16le: {
        TypedArray: Uint16Array,
        method: "getUint16",
        littleEndian: true,
    },
    u16be: {
        TypedArray: Uint16Array,
        method: "getUint16",
        littleEndian: false,
    },
    ...(SUPPORTS_FLOAT_16_ARRAY ? {
        f16le: {
            TypedArray: Float16Array,
            method: "getFloat16",
            littleEndian: true,
        },
        f16be: {
            TypedArray: Float16Array,
            method: "getFloat16",
            littleEndian: false,
        },
    } as const : {}),
    i32le: {
        TypedArray: Int32Array,
        method: "getInt32",
        littleEndian: true,
    },
    i32be: {
        TypedArray: Int32Array,
        method: "getInt32",
        littleEndian: false,
    },
    u32le: {
        TypedArray: Uint32Array,
        method: "getUint32",
        littleEndian: true,
    },
    u32be: {
        TypedArray: Uint32Array,
        method: "getUint32",
        littleEndian: false,
    },
    f32le: {
        TypedArray: Float32Array,
        method: "getFloat32",
        littleEndian: true,
    },
    f32be: {
        TypedArray: Float32Array,
        method: "getFloat32",
        littleEndian: false,
    },
    i64le: {
        TypedArray: BigInt64Array,
        method: "getBigInt64",
        littleEndian: true,
    },
    i64be: {
        TypedArray: BigInt64Array,
        method: "getBigInt64",
        littleEndian: false,
    },
    u64le: {
        TypedArray: BigUint64Array,
        method: "getBigUint64",
        littleEndian: true,
    },
    u64be: {
        TypedArray: BigUint64Array,
        method: "getBigUint64",
        littleEndian: false,
    },
    f64le: {
        TypedArray: Float64Array,
        method: "getFloat64",
        littleEndian: true,
    },
    f64be: {
        TypedArray: Float64Array,
        method: "getFloat64",
        littleEndian: false,
    },
} as const;
