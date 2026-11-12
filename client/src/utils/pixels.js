/** Icônes en pixels 8 × 8 (charte graphique) et avatars générés depuis un nom. */
export const ICONS = {
  log: ['11111110', '00000000', '11101110', '00000000', '10111110', '00000000', '11110110', '00000000'],
  key: ['00111000', '01000100', '01000100', '00111000', '00010000', '00010000', '00011100', '00010100'],
  clk: ['00111100', '01000010', '10010001', '10010001', '10001101', '10000001', '01000010', '00111100'],
  shd: ['11111111', '10000001', '10011001', '10111101', '10011001', '01000010', '00100100', '00011000'],
};

/** Avatar symétrique 8 × 8 déterministe (même nom → même avatar). */
export function identRows(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const rows = [];
  for (let y = 0; y < 8; y++) {
    let l = '';
    for (let x = 0; x < 4; x++) {
      h = (h * 1103515245 + 12345) >>> 0;
      l += (h >> 16) & 1 ? '1' : '0';
    }
    rows.push(l + l.split('').reverse().join(''));
  }
  return rows;
}
