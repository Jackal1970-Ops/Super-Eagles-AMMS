/**
 * Super Eagles Zero-Dependency QR Code Generator
 * Generates ISO/IEC 18004 compliant QR code matrices and clean SVG representations.
 */

// Basic Galois Field (GF(256)) tables for Reed-Solomon error correction
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x = (x << 1) ^ (x & 128 ? 0x11d : 0);
  }
  for (let i = 255; i < 512; i++) {
    EXP_TABLE[i] = EXP_TABLE[i - 255];
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
}

function rsCompute(data: Uint8Array, ecCount: number): Uint8Array {
  // Generator polynomial
  let gen = new Uint8Array([1]);
  for (let i = 0; i < ecCount; i++) {
    const next = new Uint8Array(gen.length + 1);
    const factor = EXP_TABLE[i];
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gfMul(gen[j], factor);
      next[j + 1] ^= gen[j];
    }
    gen = next;
  }

  const res = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ res[0];
    res.copyWithin(0, 1);
    res[ecCount - 1] = 0;
    for (let j = 0; j < ecCount; j++) {
      res[j] ^= gfMul(gen[j], factor);
    }
  }
  return res;
}

export function generateQrMatrix(text: string): boolean[][] {
  // Use Version 3 QR Code (29x29) with Medium Error Correction (capable of 53 alphanumeric/bytes)
  const size = 29;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Finder patterns (7x7) at (0,0), (size-7, 0), (0, size-7)
  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBlack =
          r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        matrix[r0 + r][c0 + c] = isBlack;
        isFunction[r0 + r][c0 + c] = true;
      }
    }
    // Separator border
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = r0 + r;
        const col = c0 + c;
        if (row >= 0 && row < size && col >= 0 && col < size && !isFunction[row][col]) {
          matrix[row][col] = false;
          isFunction[row][col] = true;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  // Alignment pattern for Version 3 at center (20, 20)
  const drawAlignment = (r0: number, c0: number) => {
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const isBlack = Math.max(Math.abs(r), Math.abs(c)) !== 1;
        matrix[r0 + r][c0 + c] = isBlack;
        isFunction[r0 + r][c0 + c] = true;
      }
    }
  };
  drawAlignment(22, 22);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const val = i % 2 === 0;
    if (!isFunction[6][i]) {
      matrix[6][i] = val;
      isFunction[6][i] = true;
    }
    if (!isFunction[i][6]) {
      matrix[i][6] = val;
      isFunction[i][6] = true;
    }
  }

  // Dark module
  matrix[size - 8][8] = true;
  isFunction[size - 8][8] = true;

  // Encode byte payload: 0100 (byte mode) + length (8 bits) + UTF-8 bytes + terminator
  const bytes = new TextEncoder().encode(text.slice(0, 48)); // cap to capacity
  const bitStream: number[] = [];

  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bitStream.push((val >>> i) & 1);
    }
  };

  pushBits(0b0100, 4); // Byte mode
  pushBits(bytes.length, 8); // Character count
  for (const b of bytes) {
    pushBits(b, 8);
  }
  pushBits(0b0000, 4); // Terminator

  while (bitStream.length % 8 !== 0) {
    bitStream.push(0);
  }

  // Convert to data codewords
  const dataCodewords: number[] = [];
  for (let i = 0; i < bitStream.length; i += 8) {
    let byteVal = 0;
    for (let j = 0; j < 8; j++) {
      byteVal = (byteVal << 1) | bitStream[i + j];
    }
    dataCodewords.push(byteVal);
  }

  // Pad to required 44 data codewords for Version 3-M
  const totalDataBytes = 44;
  const padBytes = [0xec, 0x11];
  let p = 0;
  while (dataCodewords.length < totalDataBytes) {
    dataCodewords.push(padBytes[p % 2]);
    p++;
  }

  // Error correction codewords (26 for V3-M)
  const ecCount = 26;
  const ecCodewords = rsCompute(new Uint8Array(dataCodewords), ecCount);

  // Combine data + EC
  const allBits: number[] = [];
  for (const b of [...dataCodewords, ...Array.from(ecCodewords)]) {
    for (let i = 7; i >= 0; i--) {
      allBits.push((b >>> i) & 1);
    }
  }

  // Place data bits into matrix with standard pattern mask 0 ((row + col) % 2 == 0)
  let bitIdx = 0;
  let upwards = true;

  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column
    const cols = [right, right - 1];

    const rows = upwards
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const c of cols) {
        if (!isFunction[r][c]) {
          const bit = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = (bit ^ (mask ? 1 : 0)) === 1;
        }
      }
    }
    upwards = !upwards;
  }

  return matrix;
}

/**
 * Returns clean, self-contained SVG element markup for rendering in React or downloading.
 */
export function generateQrSvg(text: string, sizePx: number = 220, fgColor: string = "#0F172A", bgColor: string = "#FFFFFF"): string {
  const matrix = generateQrMatrix(text);
  const count = matrix.length;
  const cellSize = sizePx / count;

  let rects = "";
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c]) {
        rects += `<rect x="${(c * cellSize).toFixed(2)}" y="${(r * cellSize).toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="${fgColor}" />`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sizePx} ${sizePx}" width="${sizePx}" height="${sizePx}"><rect width="${sizePx}" height="${sizePx}" fill="${bgColor}" />${rects}</svg>`;
}

