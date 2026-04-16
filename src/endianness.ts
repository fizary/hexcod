function detectPlatformEndianness(): boolean {
    const buffer = new ArrayBuffer(2);
    const dataview = new DataView(buffer);
    const u8 = new Uint8Array(buffer);

    dataview.setUint16(0, 0x0100, true);

    return u8[0] === 0;
}

/**
 * Indicates whether the current platform uses little-endian byte order natively.
 */
export const PLATFORM_LITTLE_ENDIAN = detectPlatformEndianness();
