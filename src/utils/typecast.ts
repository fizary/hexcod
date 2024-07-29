const buffer = new ArrayBuffer(8),
    i8 = new Int8Array(buffer),
    u8 = new Uint8Array(buffer),
    i16 = new Int16Array(buffer),
    u16 = new Uint16Array(buffer),
    i32 = new Int32Array(buffer),
    u32 = new Uint32Array(buffer),
    f32 = new Float32Array(buffer),
    f64 = new Float64Array(buffer),
    i64 = new BigInt64Array(buffer),
    u64 = new BigUint64Array(buffer);

export function uint8ToInt8(input: Uint8Array, offset: number): number {
    u8[0] = input[offset];

    return i8[0];
}

export function uint8ToInt16(input: Uint8Array, offset: number): number {
    u8[0] = input[offset];
    u8[1] = input[offset + 1];

    return i16[0];
}

export function uint8ToUint16(input: Uint8Array, offset: number): number {
    u8[0] = input[offset];
    u8[1] = input[offset + 1];

    return u16[0];
}

export function uint8ToInt32(input: Uint8Array, offset: number): number {
    u8[0] = input[offset];
    u8[1] = input[offset + 1];
    u8[2] = input[offset + 2];
    u8[3] = input[offset + 3];

    return i32[0];
}

export function uint8ToUint32(input: Uint8Array, offset: number): number {
    u8[0] = input[offset];
    u8[1] = input[offset + 1];
    u8[2] = input[offset + 2];
    u8[3] = input[offset + 3];

    return u32[0];
}

export function uint8ToFloat32(input: Uint8Array, offset: number): number {
    u8[0] = input[offset];
    u8[1] = input[offset + 1];
    u8[2] = input[offset + 2];
    u8[3] = input[offset + 3];

    return f32[0];
}

export function uint8ToFloat64(input: Uint8Array, offset: number): number {
    u8[0] = input[offset];
    u8[1] = input[offset + 1];
    u8[2] = input[offset + 2];
    u8[3] = input[offset + 3];
    u8[4] = input[offset + 4];
    u8[5] = input[offset + 5];
    u8[6] = input[offset + 6];
    u8[7] = input[offset + 7];

    return f64[0];
}

export function uint8ToBigInt64(input: Uint8Array, offset: number): bigint {
    u8[0] = input[offset];
    u8[1] = input[offset + 1];
    u8[2] = input[offset + 2];
    u8[3] = input[offset + 3];
    u8[4] = input[offset + 4];
    u8[5] = input[offset + 5];
    u8[6] = input[offset + 6];
    u8[7] = input[offset + 7];

    return i64[0];
}

export function uint8ToBigUint64(input: Uint8Array, offset: number): bigint {
    u8[0] = input[offset];
    u8[1] = input[offset + 1];
    u8[2] = input[offset + 2];
    u8[3] = input[offset + 3];
    u8[4] = input[offset + 4];
    u8[5] = input[offset + 5];
    u8[6] = input[offset + 6];
    u8[7] = input[offset + 7];

    return u64[0];
}
