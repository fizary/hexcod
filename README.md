Fast and easy to use binary reader.

## Example usage

```typescript
import { BinaryStream, decode } from "hexcod";

const source = new Uint8Array([74, 26, 72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 19, 55, 47, 13, 68, 4, 81, 54, 92, 33, 17, 69, 21, 70]);

// Create BinaryStream instance
const stream = new BinaryStream(source, { byteOffset: 2, byteLength: 23 });

// Read and decode a string
console.log(decode(stream.read("u8", 11)));

// Read some data
console.log(stream.read("u32"));

// Create a substream
const substream = stream.substream(8);

// Read some more data until substream reaches end
while (substream.remaining > 0)
    console.log(substream.read("i16", 2));

// Output:
// Hello World
// 221198099
// Int16Array [1092, 13905]
// Int16Array [8540, 17681]
```

## Installation

This package is not published in any registry and requires manual installation.

```bash
# Clone repository
git clone https://github.com/fizary/hexcod.git
cd hexcod

# Install dependencies
npm i

# Compile source code
npm run build

# Generate type declarations
npm run types:emit

# Create package tarball to be installed in your project
npm pack
```

Last step is to move created tarball into your projects root directory and install it.

```bash
npm i hexcod-0.0.0.tgz
```

## API

```typescript
export type Source = ArrayBuffer | Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | BigInt64Array | BigUint64Array;

export type StreamOptions = {
    byteOffset?: number;
    byteLength?: number;
};

export class BinaryStream {
    // Reference to ArrayBuffer used by stream.
    buffer: ArrayBuffer;

    // Reference to Uint8Array used by stream.
    view: Uint8Array;

    // Offset position in stream from where to perform operations.
    offset: number;

    // Number of bytes remaining in stream.
    remaining: number;

    // Create new instance from binary source with given options.
    constructor(source: Source, options?: StreamOptions);

    // Set offset to given value.
    seek(offset: number): void;

    // Advance offset by given amount of bytes.
    skip(bytes: number): void;

    // Return new instance with new boundry starting from current offset and of specified length.
    substream(bytes: number): BinaryStream;

    // Read data of specified type and length.
    read<T extends DataType>(type: T): PrimitiveValue<T>;
    read<T extends DataType>(type: T, length: number): TypedArray<T>;
}

// Decode binary source into a string. By default returned string is null terminated.
export function decode(source: Source, nullTerminated?: boolean): string;
```

## Types

```typescript
type NumberDataType = "i8" | "u8" | "i16" | "u16" | "i32" | "u32" | "f32" | "f64";
type BigNumberDataType = "i64" | "u64";
type DataType = NumberDataType | BigNumberDataType;

type PrimitiveValue<T extends DataType> = T extends BigNumberDataType ? bigint : number;

type TypedArrayMap = {
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
type TypedArray<T extends DataType> = TypedArrayMap[T];
```
