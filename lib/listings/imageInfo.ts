// Pixel size from the file's own header (JPEG and PNG), so the upload check
// does not trust the browser. Returns null for anything else.
export function readImageSize(bytes: Uint8Array): { widthPx: number; heightPx: number; ext: 'jpg' | 'png'; contentType: string } | null {
  const isPng = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b);
  if (isPng && bytes.length >= 24) {
    const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { widthPx: v.getUint32(16), heightPx: v.getUint32(20), ext: 'png', contentType: 'image/png' };
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) { i++; continue; }
      const marker = bytes[i + 1];
      // Start-of-frame markers (not DHT 0xC4, JPG 0xC8, DAC 0xCC) hold the size.
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { heightPx: v.getUint16(i + 5), widthPx: v.getUint16(i + 7), ext: 'jpg', contentType: 'image/jpeg' };
      }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      i += 2 + v.getUint16(i + 2);
    }
  }
  return null;
}
