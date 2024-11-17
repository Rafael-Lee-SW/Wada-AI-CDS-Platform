// utils/encoding.js
import iconv from 'iconv-lite';

// Function to convert EUC-KR encoded ArrayBuffer to UTF-8 string
export const convertEucKrToUtf8 = (arrayBuffer) => {
    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(arrayBuffer);
    // Decode EUC-KR to UTF-8 string
    const decodedString = iconv.decode(buffer, 'euc-kr');
    return decodedString;
};

// Function to convert UTF-8 string back to ArrayBuffer
export const convertUtf8ToArrayBuffer = (utf8String) => {
    const encoder = new TextEncoder();
    return encoder.encode(utf8String).buffer;
};
