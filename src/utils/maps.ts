import {
    uint8ToInt8,
    uint8ToInt16,
    uint8ToUint16,
    uint8ToInt32,
    uint8ToUint32,
    uint8ToFloat32,
    uint8ToFloat64,
    uint8ToBigInt64,
    uint8ToBigUint64,
} from "./typecast.ts";

export const typedArrayMap = {
    i8: Int8Array,
    u8: Uint8Array,
    i16: Int16Array,
    u16: Uint16Array,
    i32: Int32Array,
    u32: Uint32Array,
    f32: Float32Array,
    f64: Float64Array,
    i64: BigInt64Array,
    u64: BigUint64Array,
};

export const typecastMap = {
    i8: uint8ToInt8,
    u8: undefined,
    i16: uint8ToInt16,
    u16: uint8ToUint16,
    i32: uint8ToInt32,
    u32: uint8ToUint32,
    f32: uint8ToFloat32,
    f64: uint8ToFloat64,
    i64: uint8ToBigInt64,
    u64: uint8ToBigUint64,
};
