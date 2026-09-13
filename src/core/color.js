/**
 * Conversiones de color. Viven en core porque no son de un componente:
 * cualquiera que manipule color las necesita.
 *
 * Convenciones:
 *   rgb -> { r, g, b } en 0..255
 *   hsv -> { h } en 0..360, { s, v } en 0..1
 *   hex -> '#rrggbb' en minúscula
 */

const HEX3 = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX6 = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

const clamp01 = (n) => Math.min(1, Math.max(0, n));
const to255 = (n) => Math.min(255, Math.max(0, Math.round(n)));

/** @returns {{r:number,g:number,b:number}|null} */
export function hexToRgb(hex) {
  const text = String(hex ?? '').trim();

  const short = HEX3.exec(text);
  if (short) {
    const [, r, g, b] = short;
    return {
      r: parseInt(r + r, 16),
      g: parseInt(g + g, 16),
      b: parseInt(b + b, 16),
    };
  }

  const long = HEX6.exec(text);
  if (!long) return null;
  return {
    r: parseInt(long[1], 16),
    g: parseInt(long[2], 16),
    b: parseInt(long[3], 16),
  };
}

export function rgbToHex({ r, g, b }) {
  const part = (n) => to255(n).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

export function rgbToHsv({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const span = max - min;

  let h = 0;
  if (span !== 0) {
    if (max === rn) h = ((gn - bn) / span) % 6;
    else if (max === gn) h = (bn - rn) / span + 2;
    else h = (rn - gn) / span + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s: max === 0 ? 0 : span / max, v: max };
}

export function hsvToRgb({ h, s, v }) {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp01(s);
  const val = clamp01(v);

  const c = val * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = val - c;

  const sector = Math.floor(hue / 60) % 6;
  const [r, g, b] = [
    [c, x, 0], [x, c, 0], [0, c, x],
    [0, x, c], [x, 0, c], [c, 0, x],
  ][sector];

  return { r: to255((r + m) * 255), g: to255((g + m) * 255), b: to255((b + m) * 255) };
}

/** @returns {{h:number,s:number,v:number}|null} */
export function hexToHsv(hex) {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsv(rgb) : null;
}

export function hsvToHex(hsv) {
  return rgbToHex(hsvToRgb(hsv));
}

/** Normaliza cualquier hex de 3 o 6 dígitos a '#rrggbb'. null si no es válido. */
export function normalizeHex(value) {
  const rgb = hexToRgb(value);
  return rgb ? rgbToHex(rgb) : null;
}
