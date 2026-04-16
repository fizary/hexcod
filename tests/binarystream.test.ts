import { describe, it, expect } from "vitest";
import { BinaryStream } from "../src/binarystream.ts";
import { defaultTextDecoder, encodingMap } from "../src/encodings.ts";
import { PLATFORM_LITTLE_ENDIAN } from "../src/endianness.ts";
import { OutOfBoundsError, UnknownDataTypeError, UnknownEncodingError, TerminatorNotFoundError } from "../src/errors.ts";
import { buffer } from "./fixtures/data.ts";
import { FakeTextDecoder } from "./utils/fake-text-decoder.ts";

const reInitBuffer = new ArrayBuffer(8);
const view = new Uint8Array(buffer, 288, 32);

const twoByteTerminator = [0x00, 0x00];
const customEncodingMap = { "custom-encoding": twoByteTerminator };

const windows1250Decoder = new TextDecoder("windows-1250");
const utf16leDecoder = new TextDecoder("utf-16le");
const utf16beDecoder = new TextDecoder("utf-16be");
const customDecoder = new FakeTextDecoder("custom-encoding");

describe("BinaryStream.bufferOffset", () => {
    it("returns 0 for ArrayBuffer source", () => {
        const stream = new BinaryStream(buffer);

        expect(stream.bufferOffset).toBe(0);
    });

    it("returns view byte offset for ArrayBufferView source", () => {
        const stream = new BinaryStream(view);

        expect(stream.bufferOffset).toBe(view.byteOffset);
    });

    it("adds cursor position to base offset", () => {
        const stream = new BinaryStream(view);

        stream.offset = 16;
        expect(stream.bufferOffset).toBe(view.byteOffset + 16);
    });
});

describe("BinaryStream.byteLength", () => {
    it("returns buffer byte length for ArrayBuffer source", () => {
        const stream = new BinaryStream(buffer);

        expect(stream.byteLength).toBe(buffer.byteLength);
    });

    it("returns view byte length for ArrayBufferView source", () => {
        const stream = new BinaryStream(view);

        expect(stream.byteLength).toBe(view.byteLength);
    });
});

describe("BinaryStream.remaining", () => {
    it("returns buffer byte length for ArrayBuffer source at cursor position 0", () => {
        const stream = new BinaryStream(buffer);

        expect(stream.remaining).toBe(buffer.byteLength);
    });

    it("returns view byte length for ArrayBufferView source at cursor position 0", () => {
        const stream = new BinaryStream(view);

        expect(stream.remaining).toBe(view.byteLength);
    });

    it("subtracts cursor position from byte length", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 32;
        expect(stream.remaining).toBe(buffer.byteLength - 32);
    });
});

describe("BinaryStream.constructor", () => {
    it("sets internal buffers from ArrayBuffer source", () => {
        const stream = new BinaryStream(buffer);

        expect(stream.buffer === buffer).toBe(true);
        expect(stream.view.buffer === buffer).toBe(true);
        expect(stream.dataview.buffer === buffer).toBe(true);
    });

    it("sets internal buffers from ArrayBufferView source", () => {
        const stream = new BinaryStream(view);

        expect(stream.buffer === view.buffer).toBe(true);
        expect(stream.view.buffer === view.buffer).toBe(true);
        expect(stream.dataview.buffer === view.buffer).toBe(true);
    });

    it("sets encoding map to provided value", () => {
        const stream = new BinaryStream(buffer, { encodingMap: customEncodingMap });

        expect(stream.encodingMap === customEncodingMap).toBe(true);
    });

    it("defaults to built-in map when encoding map is not provided", () => {
        const stream = new BinaryStream(buffer);

        expect(stream.encodingMap === encodingMap).toBe(true);
    });

    it("sets text decoder to provided value", () => {
        const stream = new BinaryStream(buffer, { textDecoder: customDecoder });

        expect(stream.textDecoder === customDecoder).toBe(true);
    });

    it("defaults to utf-8 decoder when text decoder is not provided", () => {
        const stream = new BinaryStream(buffer);

        expect(stream.textDecoder === defaultTextDecoder).toBe(true);
    });

    it("sets cursor to 0", () => {
        const stream = new BinaryStream(buffer);

        expect(stream.offset).toBe(0);
    });

    it("sets bounds using provided byte offset", () => {
        const byteOffset = view.byteOffset + 16;
        const byteLength = view.byteLength - 16;
        const stream = new BinaryStream(view, { byteOffset });

        expect(stream.view.byteOffset).toBe(byteOffset);
        expect(stream.view.byteLength).toBe(byteLength);
        expect(stream.dataview.byteOffset).toBe(byteOffset);
        expect(stream.dataview.byteLength).toBe(byteLength);
    });

    it("sets bounds using provided byte length", () => {
        const byteOffset = view.byteOffset;
        const byteLength = view.byteLength - 16;
        const stream = new BinaryStream(view, { byteLength });

        expect(stream.view.byteOffset).toBe(byteOffset);
        expect(stream.view.byteLength).toBe(byteLength);
        expect(stream.dataview.byteOffset).toBe(byteOffset);
        expect(stream.dataview.byteLength).toBe(byteLength);
    });

    it("sets bounds using provided byte offset and byte length", () => {
        const byteOffset = view.byteOffset + 16;
        const byteLength = 8;
        const stream = new BinaryStream(view, { byteOffset, byteLength });

        expect(stream.view.byteOffset).toBe(byteOffset);
        expect(stream.view.byteLength).toBe(byteLength);
        expect(stream.dataview.byteOffset).toBe(byteOffset);
        expect(stream.dataview.byteLength).toBe(byteLength);
    });

    it("defaults to buffer bounds for ArrayBuffer source", () => {
        const byteOffset = 0;
        const byteLength = buffer.byteLength;
        const stream = new BinaryStream(buffer);

        expect(stream.view.byteOffset).toBe(byteOffset);
        expect(stream.view.byteLength).toBe(byteLength);
        expect(stream.dataview.byteOffset).toBe(byteOffset);
        expect(stream.dataview.byteLength).toBe(byteLength);
    });

    it("defaults to view bounds for ArrayBufferView source", () => {
        const byteOffset = view.byteOffset;
        const byteLength = view.byteLength;
        const stream = new BinaryStream(view);

        expect(stream.view.byteOffset).toBe(byteOffset);
        expect(stream.view.byteLength).toBe(byteLength);
        expect(stream.dataview.byteOffset).toBe(byteOffset);
        expect(stream.dataview.byteLength).toBe(byteLength);
    });

    it("throws when provided byte offset is outside source bounds", () => {
        expect(() => new BinaryStream(view, { byteOffset: view.byteOffset - 1 })).toThrow(OutOfBoundsError);
        expect(() => new BinaryStream(view, { byteOffset: view.byteOffset + view.byteLength + 1 })).toThrow(OutOfBoundsError);
    });

    it("throws when provided byte length is outside source bounds", () => {
        expect(() => new BinaryStream(view, { byteLength: -1 })).toThrow(OutOfBoundsError);
        expect(() => new BinaryStream(view, { byteLength: view.byteLength + 1 })).toThrow(OutOfBoundsError);
    });

    it("throws when provided byte offset and byte length are outside source bounds", () => {
        expect(() => new BinaryStream(view, { byteOffset: view.byteOffset + 16, byteLength: 32 })).toThrow(OutOfBoundsError);
    });
});

describe("BinaryStream.reInit", () => {
    it("sets internal buffers from ArrayBuffer source", () => {
        const stream = new BinaryStream(reInitBuffer);

        stream.reInit(buffer);
        expect(stream.buffer === buffer).toBe(true);
        expect(stream.view.buffer === buffer).toBe(true);
        expect(stream.dataview.buffer === buffer).toBe(true);
    });

    it("sets internal buffers from ArrayBufferView source", () => {
        const stream = new BinaryStream(reInitBuffer);

        stream.reInit(view);
        expect(stream.buffer === view.buffer).toBe(true);
        expect(stream.view.buffer === view.buffer).toBe(true);
        expect(stream.dataview.buffer === view.buffer).toBe(true);
    });

    it("sets encoding map to provided value", () => {
        const stream = new BinaryStream(reInitBuffer);

        stream.reInit(buffer, { encodingMap: customEncodingMap });
        expect(stream.encodingMap === customEncodingMap).toBe(true);
    });

    it("defaults to built-in map when encoding map is not provided", () => {
        const stream = new BinaryStream(reInitBuffer, { encodingMap: customEncodingMap });

        stream.reInit(buffer);
        expect(stream.encodingMap === encodingMap).toBe(true);
    });

    it("sets text decoder to provided value", () => {
        const stream = new BinaryStream(reInitBuffer);

        stream.reInit(buffer, { textDecoder: customDecoder });
        expect(stream.textDecoder === customDecoder).toBe(true);
    });

    it("defaults to utf-8 decoder when text decoder is not provided", () => {
        const stream = new BinaryStream(reInitBuffer, { textDecoder: customDecoder });

        stream.reInit(buffer);
        expect(stream.textDecoder === defaultTextDecoder).toBe(true);
    });

    it("sets cursor to 0", () => {
        const stream = new BinaryStream(reInitBuffer);

        stream.offset = 32;
        stream.reInit(buffer);
        expect(stream.offset).toBe(0);
    });

    it("sets bounds using provided byte offset", () => {
        const byteOffset = view.byteOffset + 16;
        const byteLength = view.byteLength - 16;
        const stream = new BinaryStream(reInitBuffer);

        stream.reInit(view, { byteOffset });
        expect(stream.view.byteOffset).toBe(byteOffset);
        expect(stream.view.byteLength).toBe(byteLength);
        expect(stream.dataview.byteOffset).toBe(byteOffset);
        expect(stream.dataview.byteLength).toBe(byteLength);
    });

    it("sets bounds using provided byte length", () => {
        const byteOffset = view.byteOffset;
        const byteLength = view.byteLength - 16;
        const stream = new BinaryStream(reInitBuffer);

        stream.reInit(view, { byteLength });
        expect(stream.view.byteOffset).toBe(byteOffset);
        expect(stream.view.byteLength).toBe(byteLength);
        expect(stream.dataview.byteOffset).toBe(byteOffset);
        expect(stream.dataview.byteLength).toBe(byteLength);
    });

    it("sets bounds using provided byte offset and byte length", () => {
        const byteOffset = view.byteOffset + 16;
        const byteLength = 8;
        const stream = new BinaryStream(reInitBuffer);

        stream.reInit(view, { byteOffset, byteLength });
        expect(stream.view.byteOffset).toBe(byteOffset);
        expect(stream.view.byteLength).toBe(byteLength);
        expect(stream.dataview.byteOffset).toBe(byteOffset);
        expect(stream.dataview.byteLength).toBe(byteLength);
    });

    it("defaults to buffer bounds for ArrayBuffer source", () => {
        const byteOffset = 0;
        const byteLength = buffer.byteLength;
        const stream = new BinaryStream(reInitBuffer);

        stream.reInit(buffer);
        expect(stream.view.byteOffset).toBe(byteOffset);
        expect(stream.view.byteLength).toBe(byteLength);
        expect(stream.dataview.byteOffset).toBe(byteOffset);
        expect(stream.dataview.byteLength).toBe(byteLength);
    });

    it("defaults to view bounds for ArrayBufferView source", () => {
        const byteOffset = view.byteOffset;
        const byteLength = view.byteLength;
        const stream = new BinaryStream(reInitBuffer);

        stream.reInit(view);
        expect(stream.view.byteOffset).toBe(byteOffset);
        expect(stream.view.byteLength).toBe(byteLength);
        expect(stream.dataview.byteOffset).toBe(byteOffset);
        expect(stream.dataview.byteLength).toBe(byteLength);
    });

    it("throws when provided byte offset is outside source bounds", () => {
        expect(() => new BinaryStream(reInitBuffer).reInit(view, { byteOffset: view.byteOffset - 1 })).toThrow(OutOfBoundsError);
        expect(() => new BinaryStream(reInitBuffer).reInit(view, { byteOffset: view.byteOffset + view.byteLength + 1 })).toThrow(OutOfBoundsError);
    });

    it("throws when provided byte length is outside source bounds", () => {
        expect(() => new BinaryStream(reInitBuffer).reInit(view, { byteLength: -1 })).toThrow(OutOfBoundsError);
        expect(() => new BinaryStream(reInitBuffer).reInit(view, { byteLength: view.byteLength + 1 })).toThrow(OutOfBoundsError);
    });

    it("throws when provided byte offset and byte length are outside source bounds", () => {
        expect(() => new BinaryStream(reInitBuffer).reInit(view, { byteOffset: view.byteOffset + 16, byteLength: 32 })).toThrow(OutOfBoundsError);
    });
});

describe("BinaryStream.substream", () => {
    it("returns new stream covering requested range", () => {
        const byteOffset = view.byteOffset;
        const byteLength = 16;
        const stream = new BinaryStream(view);
        const substream = stream.substream(byteLength);

        expect(substream.view.byteOffset).toBe(byteOffset);
        expect(substream.view.byteLength).toBe(byteLength);
        expect(substream.dataview.byteOffset).toBe(byteOffset);
        expect(substream.dataview.byteLength).toBe(byteLength);
    });

    it("sets cursor to 0", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 32;
        const substream = stream.substream(32);

        expect(substream.offset).toBe(0);
    });

    it("sets encoding map to provided value", () => {
        const stream = new BinaryStream(buffer);
        const substream = stream.substream(32, { encodingMap: customEncodingMap });

        expect(substream.encodingMap === customEncodingMap).toBe(true);
    });

    it("defaults to parent stream value when encoding map is not provided", () => {
        const stream = new BinaryStream(buffer, { encodingMap: customEncodingMap });
        const substream = stream.substream(32);

        expect(substream.encodingMap === customEncodingMap).toBe(true);
    });

    it("sets text decoder to provided value", () => {
        const stream = new BinaryStream(buffer);
        const substream = stream.substream(32, { textDecoder: customDecoder });

        expect(substream.textDecoder === customDecoder).toBe(true);
    });

    it("defaults to parent stream value when text decoder is not provided", () => {
        const stream = new BinaryStream(buffer, { textDecoder: customDecoder });
        const substream = stream.substream(32);

        expect(substream.textDecoder === customDecoder).toBe(true);
    });

    it("shares same buffer as parent stream", () => {
        const stream = new BinaryStream(buffer);
        const substream = stream.substream(32);

        expect(substream.buffer === buffer).toBe(true);
        expect(substream.view.buffer === buffer).toBe(true);
        expect(substream.dataview.buffer === buffer).toBe(true);
    });

    it("advances parent stream cursor by substream byte length", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 64;

        stream.substream(32);
        expect(stream.offset).toBe(96);
    });

    it("throws when requested range is outside parent stream bounds", () => {
        const stream = new BinaryStream(view);

        expect(() => stream.substream(-1)).toThrow(OutOfBoundsError);
        expect(() => stream.substream(view.byteLength + 1)).toThrow(OutOfBoundsError);
    });
});

describe("BinaryStream.setEncodingMap", () => {
    it("sets encoding map to provided value", () => {
        const stream = new BinaryStream(buffer);

        stream.setEncodingMap(customEncodingMap);
        expect(stream.encodingMap === customEncodingMap).toBe(true);
    });
});

describe("BinaryStream.setTextDecoder", () => {
    it("sets text decoder to provided value", () => {
        const stream = new BinaryStream(buffer);

        stream.setTextDecoder(customDecoder);
        expect(stream.textDecoder === customDecoder).toBe(true);
    });
});

describe("BinaryStream.seek", () => {
    it("moves cursor to provided offset", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 64;

        stream.seek(32);
        expect(stream.offset).toBe(32);
    });

    it("throws when new cursor position is outside stream bounds", () => {
        const stream = new BinaryStream(view);

        expect(() => stream.seek(-1)).toThrow(OutOfBoundsError);
        expect(() => stream.seek(view.byteLength + 1)).toThrow(OutOfBoundsError);
    });
});

describe("BinaryStream.seekBy", () => {
    it("moves cursor forward by provided byte length", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 64;

        stream.seekBy(32);
        expect(stream.offset).toBe(96);
    });

    it("moves cursor backward by provided byte length", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 64;

        stream.seekBy(-32);
        expect(stream.offset).toBe(32);
    });

    it("throws when new cursor position is outside stream bounds", () => {
        const stream = new BinaryStream(view);

        expect(() => stream.seekBy(-1)).toThrow(OutOfBoundsError);
        expect(() => stream.seekBy(view.byteLength + 1)).toThrow(OutOfBoundsError);
    });
});

describe("BinaryStream.read", () => {
    it("reads i64le element", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 0;
        expect(stream.read("i64le")).toBe(-1234567890123456789n);
        expect(stream.offset).toBe(8);
    });

    it("reads i64be element", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 32;
        expect(stream.read("i64be")).toBe(-5678901234567890123n);
        expect(stream.offset).toBe(40);
    });

    it("reads u64le element", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 64;
        expect(stream.read("u64le")).toBe(1234567890123456789n);
        expect(stream.offset).toBe(72);
    });

    it("reads u64be element", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 96;
        expect(stream.read("u64be")).toBe(5678901234567890123n);
        expect(stream.offset).toBe(104);
    });

    it("reads f64le element", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 128;
        expect(stream.read("f64le")).toBe(1.000);
        expect(stream.offset).toBe(136);
    });

    it("reads f64be element", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 160;
        expect(stream.read("f64be")).toBe(1.500);
        expect(stream.offset).toBe(168);
    });

    it("reads i32le element", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 192;
        expect(stream.read("i32le")).toBe(-123456789);
        expect(stream.offset).toBe(196);
    });

    it("reads i32be element", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 208;
        expect(stream.read("i32be")).toBe(-567890123);
        expect(stream.offset).toBe(212);
    });

    it("reads u32le element", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 224;
        expect(stream.read("u32le")).toBe(123456789);
        expect(stream.offset).toBe(228);
    });

    it("reads u32be element", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 240;
        expect(stream.read("u32be")).toBe(567890123);
        expect(stream.offset).toBe(244);
    });

    it("reads f32le element", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 256;
        expect(stream.read("f32le")).toBe(1.000);
        expect(stream.offset).toBe(260);
    });

    it("reads f32be element", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 272;
        expect(stream.read("f32be")).toBe(1.500);
        expect(stream.offset).toBe(276);
    });

    it("reads i16le element", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 288;
        expect(stream.read("i16le")).toBe(-1234);
        expect(stream.offset).toBe(290);
    });

    it("reads i16be element", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 296;
        expect(stream.read("i16be")).toBe(-5678);
        expect(stream.offset).toBe(298);
    });

    it("reads u16le element", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 304;
        expect(stream.read("u16le")).toBe(1234);
        expect(stream.offset).toBe(306);
    });

    it("reads u16be element", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 312;
        expect(stream.read("u16be")).toBe(5678);
        expect(stream.offset).toBe(314);
    });

    it("reads f16le element", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 320;
        expect(stream.read("f16le")).toBe(1.000);
        expect(stream.offset).toBe(322);
    });

    it("reads f16be element", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 328;
        expect(stream.read("f16be")).toBe(1.500);
        expect(stream.offset).toBe(330);
    });

    it("reads i8 element", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 336;
        expect(stream.read("i8")).toBe(-100);
        expect(stream.offset).toBe(337);
    });

    it("reads u8 element", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 340;
        expect(stream.read("u8")).toBe(100);
        expect(stream.offset).toBe(341);
    });

    it("reads i64le array", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 0;
        const value = stream.read("i64le", 4);

        expect(stream.offset).toBe(32);
        expect(value).toBeInstanceOf(BigInt64Array);
        expect(value.length).toBe(4);
        expect(value[0]).toBe(-1234567890123456789n);
        expect(value[1]).toBe(-2345678901234567890n);
        expect(value[2]).toBe(-3456789012345678901n);
        expect(value[3]).toBe(-4567890123456789012n);
    });

    it("reads i64be array", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 32;
        const value = stream.read("i64be", 4);

        expect(stream.offset).toBe(64);
        expect(value).toBeInstanceOf(BigInt64Array);
        expect(value.length).toBe(4);
        expect(value[0]).toBe(-5678901234567890123n);
        expect(value[1]).toBe(-6789012345678901234n);
        expect(value[2]).toBe(-7890123456789012345n);
        expect(value[3]).toBe(-8901234567890123456n);
    });

    it("reads u64le array", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 64;
        const value = stream.read("u64le", 4);

        expect(stream.offset).toBe(96);
        expect(value).toBeInstanceOf(BigUint64Array);
        expect(value.length).toBe(4);
        expect(value[0]).toBe(1234567890123456789n);
        expect(value[1]).toBe(2345678901234567890n);
        expect(value[2]).toBe(3456789012345678901n);
        expect(value[3]).toBe(4567890123456789012n);
    });

    it("reads u64be array", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 96;
        const value = stream.read("u64be", 4,);

        expect(stream.offset).toBe(128);
        expect(value).toBeInstanceOf(BigUint64Array);
        expect(value.length).toBe(4);
        expect(value[0]).toBe(5678901234567890123n);
        expect(value[1]).toBe(6789012345678901234n);
        expect(value[2]).toBe(7890123456789012345n);
        expect(value[3]).toBe(8901234567890123456n);
    });

    it("reads f64le array", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 128;
        const value = stream.read("f64le", 4);

        expect(stream.offset).toBe(160);
        expect(value).toBeInstanceOf(Float64Array);
        expect(value.length).toBe(4);
        expect(value[0]).toBe(1.000);
        expect(value[1]).toBe(1.125);
        expect(value[2]).toBe(1.250);
        expect(value[3]).toBe(1.375);
    });

    it("reads f64be array", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 160;
        const value = stream.read("f64be", 4);

        expect(stream.offset).toBe(192);
        expect(value).toBeInstanceOf(Float64Array);
        expect(value.length).toBe(4);
        expect(value[0]).toBe(1.500);
        expect(value[1]).toBe(1.625);
        expect(value[2]).toBe(1.750);
        expect(value[3]).toBe(1.875);
    });

    it("reads i32le array", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 192;
        const value = stream.read("i32le", 4);

        expect(stream.offset).toBe(208);
        expect(value).toBeInstanceOf(Int32Array);
        expect(value.length).toBe(4);
        expect(value[0]).toBe(-123456789);
        expect(value[1]).toBe(-234567890);
        expect(value[2]).toBe(-345678901);
        expect(value[3]).toBe(-456789012);
    });

    it("reads i32be array", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 208;
        const value = stream.read("i32be", 4);

        expect(stream.offset).toBe(224);
        expect(value).toBeInstanceOf(Int32Array);
        expect(value.length).toBe(4);
        expect(value[0]).toBe(-567890123);
        expect(value[1]).toBe(-678901234);
        expect(value[2]).toBe(-789012345);
        expect(value[3]).toBe(-890123456);
    });

    it("reads u32le array", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 224;
        const value = stream.read("u32le", 4);

        expect(stream.offset).toBe(240);
        expect(value).toBeInstanceOf(Uint32Array);
        expect(value.length).toBe(4);
        expect(value[0]).toBe(123456789);
        expect(value[1]).toBe(234567890);
        expect(value[2]).toBe(345678901);
        expect(value[3]).toBe(456789012);
    });

    it("reads u32be array", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 240;
        const value = stream.read("u32be", 4);

        expect(stream.offset).toBe(256);
        expect(value).toBeInstanceOf(Uint32Array);
        expect(value.length).toBe(4);
        expect(value[0]).toBe(567890123);
        expect(value[1]).toBe(678901234);
        expect(value[2]).toBe(789012345);
        expect(value[3]).toBe(890123456);
    });

    it("reads f32le array", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 256;
        const value = stream.read("f32le", 4);

        expect(stream.offset).toBe(272);
        expect(value).toBeInstanceOf(Float32Array);
        expect(value.length).toBe(4);
        expect(value[0]).toBe(1.000);
        expect(value[1]).toBe(1.125);
        expect(value[2]).toBe(1.250);
        expect(value[3]).toBe(1.375);
    });

    it("reads f32be array", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 272;
        const value = stream.read("f32be", 4);

        expect(stream.offset).toBe(288);
        expect(value).toBeInstanceOf(Float32Array);
        expect(value.length).toBe(4);
        expect(value[0]).toBe(1.500);
        expect(value[1]).toBe(1.625);
        expect(value[2]).toBe(1.750);
        expect(value[3]).toBe(1.875);
    });

    it("reads i16le array", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 288;
        const value = stream.read("i16le", 4);

        expect(stream.offset).toBe(296);
        expect(value).toBeInstanceOf(Int16Array);
        expect(value.length).toBe(4);
        expect(value[0]).toBe(-1234);
        expect(value[1]).toBe(-2345);
        expect(value[2]).toBe(-3456);
        expect(value[3]).toBe(-4567);
    });

    it("reads i16be array", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 296;
        const value = stream.read("i16be", 4);

        expect(stream.offset).toBe(304);
        expect(value).toBeInstanceOf(Int16Array);
        expect(value.length).toBe(4);
        expect(value[0]).toBe(-5678);
        expect(value[1]).toBe(-6789);
        expect(value[2]).toBe(-7890);
        expect(value[3]).toBe(-8901);
    });

    it("reads u16le array", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 304;
        const value = stream.read("u16le", 4);

        expect(stream.offset).toBe(312);
        expect(value).toBeInstanceOf(Uint16Array);
        expect(value.length).toBe(4);
        expect(value[0]).toBe(1234);
        expect(value[1]).toBe(2345);
        expect(value[2]).toBe(3456);
        expect(value[3]).toBe(4567);
    });

    it("reads u16be array", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 312;
        const value = stream.read("u16be", 4);

        expect(stream.offset).toBe(320);
        expect(value).toBeInstanceOf(Uint16Array);
        expect(value.length).toBe(4);
        expect(value[0]).toBe(5678);
        expect(value[1]).toBe(6789);
        expect(value[2]).toBe(7890);
        expect(value[3]).toBe(8901);
    });

    it("reads f16le array", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 320;
        const value = stream.read("f16le", 4);

        expect(stream.offset).toBe(328);
        expect(value).toBeInstanceOf(Float16Array);
        expect(value.length).toBe(4);
        expect(value[0]).toBe(1.000);
        expect(value[1]).toBe(1.125);
        expect(value[2]).toBe(1.250);
        expect(value[3]).toBe(1.375);
    });

    it("reads f16be array", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 328;
        const value = stream.read("f16be", 4);

        expect(stream.offset).toBe(336);
        expect(value).toBeInstanceOf(Float16Array);
        expect(value.length).toBe(4);
        expect(value[0]).toBe(1.500);
        expect(value[1]).toBe(1.625);
        expect(value[2]).toBe(1.750);
        expect(value[3]).toBe(1.875);
    });

    it("reads i8 array", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 336;
        const value = stream.read("i8", 4);

        expect(stream.offset).toBe(340);
        expect(value).toBeInstanceOf(Int8Array);
        expect(value.length).toBe(4);
        expect(value[0]).toBe(-100);
        expect(value[1]).toBe(-101);
        expect(value[2]).toBe(-110);
        expect(value[3]).toBe(-111);
    });

    it("reads u8 array", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 340;
        const value = stream.read("u8", 4);

        expect(stream.offset).toBe(344);
        expect(value).toBeInstanceOf(Uint8Array);
        expect(value.length).toBe(4);
        expect(value[0]).toBe(100);
        expect(value[1]).toBe(101);
        expect(value[2]).toBe(110);
        expect(value[3]).toBe(111);
    });

    it("returns array referencing underlying buffer for single-byte data types", () => {
        const stream = new BinaryStream(buffer);

        expect(stream.read("i8", 2).buffer === buffer).toBe(true);
        expect(stream.read("u8", 2).buffer === buffer).toBe(true);
    });

    it("returns array referencing underlying buffer when using native endianness and offset is aligned", () => {
        const stream = new BinaryStream(buffer);
        const endianness = PLATFORM_LITTLE_ENDIAN ? "le" : "be";

        expect(stream.read(`i64${endianness}`, 2).buffer === buffer).toBe(true);
        expect(stream.read(`u64${endianness}`, 2).buffer === buffer).toBe(true);
        expect(stream.read(`f64${endianness}`, 2).buffer === buffer).toBe(true);
        expect(stream.read(`i32${endianness}`, 2).buffer === buffer).toBe(true);
        expect(stream.read(`u32${endianness}`, 2).buffer === buffer).toBe(true);
        expect(stream.read(`f32${endianness}`, 2).buffer === buffer).toBe(true);
        expect(stream.read(`i16${endianness}`, 2).buffer === buffer).toBe(true);
        expect(stream.read(`u16${endianness}`, 2).buffer === buffer).toBe(true);
        expect(stream.read(`f16${endianness}`, 2).buffer === buffer).toBe(true);
    });

    it("returns array backed by new buffer when endianness differs from native", () => {
        const stream = new BinaryStream(buffer);
        const endianness = PLATFORM_LITTLE_ENDIAN ? "be" : "le";

        expect(stream.read(`i64${endianness}`, 2).buffer === buffer).toBe(false);
        expect(stream.read(`u64${endianness}`, 2).buffer === buffer).toBe(false);
        expect(stream.read(`f64${endianness}`, 2).buffer === buffer).toBe(false);
        expect(stream.read(`i32${endianness}`, 2).buffer === buffer).toBe(false);
        expect(stream.read(`u32${endianness}`, 2).buffer === buffer).toBe(false);
        expect(stream.read(`f32${endianness}`, 2).buffer === buffer).toBe(false);
        expect(stream.read(`i16${endianness}`, 2).buffer === buffer).toBe(false);
        expect(stream.read(`u16${endianness}`, 2).buffer === buffer).toBe(false);
        expect(stream.read(`f16${endianness}`, 2).buffer === buffer).toBe(false);
    });

    it("returns array backed by new buffer when offset it not aligned", () => {
        const stream = new BinaryStream(buffer);
        const endianness = PLATFORM_LITTLE_ENDIAN ? "le" : "be";

        stream.offset = 1;

        expect(stream.read(`i64${endianness}`, 2).buffer === buffer).toBe(false);
        expect(stream.read(`u64${endianness}`, 2).buffer === buffer).toBe(false);
        expect(stream.read(`f64${endianness}`, 2).buffer === buffer).toBe(false);
        expect(stream.read(`i32${endianness}`, 2).buffer === buffer).toBe(false);
        expect(stream.read(`u32${endianness}`, 2).buffer === buffer).toBe(false);
        expect(stream.read(`f32${endianness}`, 2).buffer === buffer).toBe(false);
        expect(stream.read(`i16${endianness}`, 2).buffer === buffer).toBe(false);
        expect(stream.read(`u16${endianness}`, 2).buffer === buffer).toBe(false);
        expect(stream.read(`f16${endianness}`, 2).buffer === buffer).toBe(false);
    });

    it("throws when type is not supported", () => {
        const stream = new BinaryStream(buffer);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => stream.read("unknown-type" as any)).toThrow(UnknownDataTypeError);
    });

    it("throws when read outside stream bounds", () => {
        const stream = new BinaryStream(view);

        stream.offset = 32;

        expect(() => stream.read("i64le")).toThrow(OutOfBoundsError);
        expect(() => stream.read("i64be")).toThrow(OutOfBoundsError);
        expect(() => stream.read("u64le")).toThrow(OutOfBoundsError);
        expect(() => stream.read("u64be")).toThrow(OutOfBoundsError);
        expect(() => stream.read("f64le")).toThrow(OutOfBoundsError);
        expect(() => stream.read("f64be")).toThrow(OutOfBoundsError);
        expect(() => stream.read("i32le")).toThrow(OutOfBoundsError);
        expect(() => stream.read("i32be")).toThrow(OutOfBoundsError);
        expect(() => stream.read("u32le")).toThrow(OutOfBoundsError);
        expect(() => stream.read("u32be")).toThrow(OutOfBoundsError);
        expect(() => stream.read("f32le")).toThrow(OutOfBoundsError);
        expect(() => stream.read("f32be")).toThrow(OutOfBoundsError);
        expect(() => stream.read("i16le")).toThrow(OutOfBoundsError);
        expect(() => stream.read("i16be")).toThrow(OutOfBoundsError);
        expect(() => stream.read("u16le")).toThrow(OutOfBoundsError);
        expect(() => stream.read("u16be")).toThrow(OutOfBoundsError);
        expect(() => stream.read("f16le")).toThrow(OutOfBoundsError);
        expect(() => stream.read("f16be")).toThrow(OutOfBoundsError);
        expect(() => stream.read("i8")).toThrow(OutOfBoundsError);
        expect(() => stream.read("u8")).toThrow(OutOfBoundsError);

        expect(() => stream.read("i64le", 2)).toThrow(OutOfBoundsError);
        expect(() => stream.read("i64be", 2)).toThrow(OutOfBoundsError);
        expect(() => stream.read("u64le", 2)).toThrow(OutOfBoundsError);
        expect(() => stream.read("u64be", 2)).toThrow(OutOfBoundsError);
        expect(() => stream.read("f64le", 2)).toThrow(OutOfBoundsError);
        expect(() => stream.read("f64be", 2)).toThrow(OutOfBoundsError);
        expect(() => stream.read("i32le", 2)).toThrow(OutOfBoundsError);
        expect(() => stream.read("i32be", 2)).toThrow(OutOfBoundsError);
        expect(() => stream.read("u32le", 2)).toThrow(OutOfBoundsError);
        expect(() => stream.read("u32be", 2)).toThrow(OutOfBoundsError);
        expect(() => stream.read("f32le", 2)).toThrow(OutOfBoundsError);
        expect(() => stream.read("f32be", 2)).toThrow(OutOfBoundsError);
        expect(() => stream.read("i16le", 2)).toThrow(OutOfBoundsError);
        expect(() => stream.read("i16be", 2)).toThrow(OutOfBoundsError);
        expect(() => stream.read("u16le", 2)).toThrow(OutOfBoundsError);
        expect(() => stream.read("u16be", 2)).toThrow(OutOfBoundsError);
        expect(() => stream.read("f16le", 2)).toThrow(OutOfBoundsError);
        expect(() => stream.read("f16be", 2)).toThrow(OutOfBoundsError);
        expect(() => stream.read("i8", 2)).toThrow(OutOfBoundsError);
        expect(() => stream.read("u8", 2)).toThrow(OutOfBoundsError);
    });
});

describe("BinaryStream.readTerminatedString", () => {
    it("reads terminated string with default utf-8 decoder", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 344;
        expect(stream.readTerminatedString()).toBe("źródło");
        expect(stream.offset).toBe(354);
    });

    it("reads terminated string with default custom-encoding decoder and terminator bytes inferred from custom encoding map", () => {
        const stream = new BinaryStream(buffer, { encodingMap: customEncodingMap, textDecoder: customDecoder });

        stream.offset = 408;
        expect(stream.readTerminatedString()).toBe("źródło");
        expect(stream.offset).toBe(422);
    });

    it("reads terminated string with provided windows-1250 decoder", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 376;
        expect(stream.readTerminatedString(windows1250Decoder)).toBe("źródło");
        expect(stream.offset).toBe(383);
    });

    it("reads terminated string with provided utf-16le decoder", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 392;
        expect(stream.readTerminatedString(utf16leDecoder)).toBe("źródło");
        expect(stream.offset).toBe(406);
    });

    it("reads terminated string with provided utf-16be decoder", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 408;
        expect(stream.readTerminatedString(utf16beDecoder)).toBe("źródło");
        expect(stream.offset).toBe(422);
    });

    it("reads terminated string with provided custom-encoding decoder and terminator bytes", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 408;
        expect(stream.readTerminatedString(customDecoder, twoByteTerminator)).toBe("źródło");
        expect(stream.offset).toBe(422);
    });

    it("reads terminated string with provided custom-encoding decoder and terminator bytes inferred from custom encoding map", () => {
        const stream = new BinaryStream(buffer, { encodingMap: customEncodingMap });

        stream.offset = 408;
        expect(stream.readTerminatedString(customDecoder)).toBe("źródło");
        expect(stream.offset).toBe(422);
    });

    it("throws when terminator bytes cannot be resolved", () => {
        expect(() => new BinaryStream(buffer).readTerminatedString(customDecoder)).toThrow(UnknownEncodingError);
    });

    it("throws when terminator bytes are not found", () => {
        expect(() => new BinaryStream(view).readTerminatedString()).toThrow(TerminatorNotFoundError);
    });
});

describe("BinaryStream.readString", () => {
    it("reads string with default utf-8 decoder", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 344;
        expect(stream.readString(16)).toBe("źródło");
        expect(stream.offset).toBe(360);
    });

    it("reads string with default custom-encoding decoder and terminator bytes inferred from custom encoding map", () => {
        const stream = new BinaryStream(buffer, { encodingMap: customEncodingMap, textDecoder: customDecoder });

        stream.offset = 408;
        expect(stream.readString(16)).toBe("źródło");
        expect(stream.offset).toBe(424);
    });

    it("reads string with provided windows-1250 decoder", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 376;
        expect(stream.readString(16, windows1250Decoder)).toBe("źródło");
        expect(stream.offset).toBe(392);
    });

    it("reads string with provided utf-16le decoder", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 392;
        expect(stream.readString(16, utf16leDecoder)).toBe("źródło");
        expect(stream.offset).toBe(408);
    });

    it("reads string with provided utf-16be decoder", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 408;
        expect(stream.readString(16, utf16beDecoder)).toBe("źródło");
        expect(stream.offset).toBe(424);
    });

    it("reads string with provided custom-encoding decoder and terminator bytes", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 408;
        expect(stream.readString(16, customDecoder, twoByteTerminator)).toBe("źródło");
        expect(stream.offset).toBe(424);
    });

    it("reads string with provided custom-encoding decoder and terminator bytes inferred from custom encoding map", () => {
        const stream = new BinaryStream(buffer, { encodingMap: customEncodingMap });

        stream.offset = 408;
        expect(stream.readString(16, customDecoder)).toBe("źródło");
        expect(stream.offset).toBe(424);
    });

    it("trims only trailing terminator bytes", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 360;
        expect(stream.readString(16)).toBe("kod\0źródłowy");
        expect(stream.offset).toBe(376);
    });

    it("skips trimming when terminator bytes are set to false", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 392;
        expect(stream.readString(14, utf16leDecoder, false)).toBe("źródło\0");
        expect(stream.offset).toBe(406);
    });

    it("skips trimming when string byte length is not aligned to code unit size", () => {
        const stream = new BinaryStream(buffer);

        stream.offset = 392;
        expect(stream.readString(15, utf16leDecoder)).toBe("źródło\0\uFFFD");
        expect(stream.offset).toBe(407);
    });

    it("throws when terminator bytes cannot be resolved", () => {
        expect(() => new BinaryStream(buffer).readString(16, customDecoder)).toThrow(UnknownEncodingError);
    });

    it("throws when read outside stream bounds", () => {
        const stream = new BinaryStream(view);

        expect(() => stream.readString(-1)).toThrow(OutOfBoundsError);
        expect(() => stream.readString(view.byteLength + 1)).toThrow(OutOfBoundsError);
    });
});
