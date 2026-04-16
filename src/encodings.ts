export const defaultTextDecoder = new TextDecoder("utf-8");

/**
 * Mapping of encoding labels to terminator byte sequences.
 * Keys should match the `TextDecoder.encoding` property.
 */
export type EncodingMap = Record<string, number[] | undefined>;

const singleByteTerminator = [0x00];
const twoByteTerminator = [0x00, 0x00];

export const encodingMap: EncodingMap = {
    "utf-8": singleByteTerminator,
    "utf-16le": twoByteTerminator,
    "utf-16be": twoByteTerminator,
    "windows-874": singleByteTerminator,
    "windows-1250": singleByteTerminator,
    "windows-1251": singleByteTerminator,
    "windows-1252": singleByteTerminator,
    "windows-1253": singleByteTerminator,
    "windows-1254": singleByteTerminator,
    "windows-1255": singleByteTerminator,
    "windows-1256": singleByteTerminator,
    "windows-1257": singleByteTerminator,
    "windows-1258": singleByteTerminator,
    "iso-8859-2": singleByteTerminator,
    "iso-8859-3": singleByteTerminator,
    "iso-8859-4": singleByteTerminator,
    "iso-8859-5": singleByteTerminator,
    "iso-8859-6": singleByteTerminator,
    "iso-8859-7": singleByteTerminator,
    "iso-8859-8": singleByteTerminator,
    "iso-8859-8-i": singleByteTerminator,
    "iso-8859-10": singleByteTerminator,
    "iso-8859-13": singleByteTerminator,
    "iso-8859-14": singleByteTerminator,
    "iso-8859-15": singleByteTerminator,
    "iso-8859-16": singleByteTerminator,
    "koi8-r": singleByteTerminator,
    "koi8-u": singleByteTerminator,
    "macintosh": singleByteTerminator,
    "ibm866": singleByteTerminator,
    "x-mac-cyrillic": singleByteTerminator,
    "gbk": singleByteTerminator,
    "gb18030": singleByteTerminator,
    "big5": singleByteTerminator,
    "euc-jp": singleByteTerminator,
    "iso-2022-jp": singleByteTerminator,
    "shift_jis": singleByteTerminator,
    "euc-kr": singleByteTerminator,
    "x-user-defined": singleByteTerminator,
};
