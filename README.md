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
