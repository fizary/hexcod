Fast and easy to use binary reader.

## Example usage

```typescript
const source = new Uint8Array([74, 26, 19, 55, 47, 13, 68, 4, 81, 54, 92, 33, 17, 69, 21, 70]);

// Create BinaryStream instance
const stream = new BinaryStream(source, { byteOffset: 2, byteLength: 12 });

// Read data
console.log(stream.read("u32"));

// Create a substream
const substream = stream.substream(8);

while (substream.remaining > 0)
    console.log(stream.read("i16", 2));

// Output:
// 221198099
// Int16Array [1092, 13905]
// Int16Array [8540, 17681]
```

```
