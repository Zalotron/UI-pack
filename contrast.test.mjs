/* ===========================================================================
   CONTRASTE — el contraste del texto se MIDE, no se estima.
   ---------------------------------------------------------------------------
       node contrast.test.mjs            todos los packs
       node contrast.test.mjs grunge     uno solo
       node contrast.test.mjs -v         además, lo que solo avisa

   DESCUBRE LOS PACKS SOLO: importa src/styles/packs/index.js, así que un pack
   nuevo entra en la medición en cuanto se registra, sin tocar este archivo.

   ⚠ MIDE CON EL BRAND_COLOR DE pack.js, no con el fallback de tokens.css. Es
   el color que el usuario ve, y de paso el test avisa si los dos se separaron
   — que es un error fácil de cometer y muy difícil de ver.

   Lo que hace falta para medir un pack de este proyecto es resolver COLOR
   RELATIVO: acá casi ningún token es un color, son transformaciones de
   --ui-brand escritas como `hsl(from var(--ui-brand) h calc(s * 0.24) 7%)`.
   Abajo hay un resolvedor mínimo para eso. No es un motor de CSS: entiende lo
   que estos packs usan y falla ruidosamente con lo que no.

   QUE HACE FALLAR (exit 1)
     · Texto por debajo de 4.5:1 contra el fondo donde vive.
     · Anillo de foco por debajo de 3:1 — WCAG 2.2, y no es negociable: un
       control sin foco visible deja de poder usarse con teclado.

   QUE SOLO AVISA (-v para verlo)
     · Texto no esencial (--ui-text-subtle) por debajo de 4.5:1.
     · Contornos por debajo de 3:1. Varios packs los quieren tenues a
       propósito, así que es información, no veredicto.

   ⛔ LO QUE ESTO NO PUEDE VER, Y HAY QUE MEDIR A MANO
   Mide los TOKENS, así que solo ve colores planos. Cuando una piel pinta una
   capa ENCIMA del relleno —el `--btn-gloss` de la mecánica, la laca de
   `grunge`, el degradé del acento de `nocturne`, la trama de `riso`— el color
   real debajo del rótulo no está en ningún token: depende de dónde caiga cada
   tope del degradé. Ahí el peor punto se calcula aparte, y el resultado se
   anota en el tokens.css del pack al lado del valor que lo obliga.
   Lo mismo con las mallas de fondo: acá se mide la capa de abajo y nada más.
   =========================================================================== */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));

/* ======================================================================= */
/*  COLOR                                                                  */
/* ======================================================================= */

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function hexToRgb(hex) {
  let h = hex.slice(1);
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
  const v = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return { r: v[0], g: v[1], b: v[2], a };
}

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  let s = 0, h = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hslToRgb({ h, s, l }) {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const t = h / 60;
  const v = t < 1 ? [c, x, 0] : t < 2 ? [x, c, 0] : t < 3 ? [0, c, x]
          : t < 4 ? [0, x, c] : t < 5 ? [x, 0, c] : [c, 0, x];
  return { r: Math.round((v[0] + m) * 255), g: Math.round((v[1] + m) * 255), b: Math.round((v[2] + m) * 255) };
}

function luminance({ r, g, b }) {
  const ch = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/** Compone `fg` (que puede ser translúcido) sobre `bg`, que es opaco. */
function flatten(fg, bg) {
  const a = fg.a ?? 1;
  if (a >= 1) return fg;
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
    a: 1,
  };
}

function contrast(fg, bg) {
  const [hi, lo] = [luminance(flatten(fg, bg)), luminance(bg)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}

/* ======================================================================= */
/*  EL RESOLVEDOR                                                          */
/*  Convierte el valor de un token en un color concreto. Entiende var(),   */
/*  hex, rgb()/hsl() y —lo que de verdad importa acá— color relativo.      */
/* ======================================================================= */

/** Parte por comas de nivel superior (no las de adentro de un parentesis). */
function splitTop(str, sep) {
  const out = [];
  let depth = 0, cur = '';
  for (const c of str) {
    if (c === '(') depth++;
    else if (c === ')') depth--;
    if (c === sep && depth === 0) { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur);
  return out;
}

/** Contenido de `fn(...)` si `value` es exactamente esa función. */
function fnArgs(value, name) {
  const v = value.trim();
  if (!v.toLowerCase().startsWith(name + '(') || !v.endsWith(')')) return null;
  return v.slice(name.length + 1, -1);
}

/** Evalúa un calc() (o un número suelto) con h/s/l/r/g/b en el contexto. */
function evalNumber(expr, ctx, scope, seen) {
  let e = expr.trim();
  const inner = fnArgs(e, 'calc');
  if (inner !== null) e = inner;

  // var() adentro de una cuenta: resolver a número primero.
  e = e.replace(/var\(\s*(--[\w-]+)\s*(?:,([^()]*))?\)/g, (_, name, fallback) => {
    const raw = scope.get(name);
    if (raw !== undefined) return `(${evalNumber(raw, ctx, scope, seen)})`;
    if (fallback !== undefined) return `(${evalNumber(fallback, ctx, scope, seen)})`;
    throw new Error(`no se puede resolver ${name}`);
  });

  e = e.replace(/calc\(/g, '(');
  // Porcentajes: acá el 100% de s y l ya es 100, así que se cae el símbolo.
  e = e.replace(/%/g, '');
  e = e.replace(/\b(deg|px|rem|em)\b/g, '');
  // Los componentes del color relativo, como identificadores.
  e = e.replace(/\b(alpha|none)\b/g, (m) => (m === 'none' ? '0' : String(ctx.alpha ?? 1)));
  e = e.replace(/(?<![\w.])([hslrgb])(?![\w.(])/g, (m) => {
    if (ctx[m] === undefined) throw new Error(`componente "${m}" fuera de un color relativo`);
    return `(${ctx[m]})`;
  });

  if (!/^[-+*/()0-9.eE\s]*$/.test(e)) throw new Error(`no entiendo la cuenta: ${expr.trim()}`);
  // eslint-disable-next-line no-new-func
  const n = Function(`"use strict";return (${e || 0})`)();
  if (!Number.isFinite(n)) throw new Error(`la cuenta no da un número: ${expr.trim()}`);
  return n;
}

function resolveColor(value, scope, seen = new Set()) {
  const v = String(value).trim();

  // var(--x) / var(--x, fallback)
  const varM = /^var\(\s*(--[\w-]+)\s*(?:,([\s\S]*))?\)$/.exec(v);
  if (varM) {
    const [, name, fallback] = varM;
    if (seen.has(name)) throw new Error(`ciclo en ${name}`);
    const raw = scope.get(name);
    if (raw !== undefined) return resolveColor(raw, scope, new Set([...seen, name]));
    if (fallback !== undefined) return resolveColor(fallback, scope, seen);
    throw new Error(`token sin declarar: ${name}`);
  }

  if (v.startsWith('#')) return hexToRgb(v);
  if (v === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

  // hsl(from <color> h s l [/ a])  y  rgb(from <color> r g b [/ a])
  for (const [fn, rel] of [['hsl', true], ['rgb', false], ['hsla', true], ['rgba', false]]) {
    const args = fnArgs(v, fn);
    if (args === null) continue;

    const [head, alphaPart] = splitTop(args, '/');
    let parts = head.trim().split(/[\s,]+/).filter(Boolean);
    let ctx = {};
    let origin = null;

    if (parts[0] === 'from') {
      // El color de origen puede ser var(...) u otra función: re-armarlo.
      const rest = head.trim().slice(4).trim();
      const m = /^(var\([^()]*(?:\([^()]*\)[^()]*)*\)|#[0-9a-fA-F]+|[a-zA-Z]+\([^()]*(?:\([^()]*\)[^()]*)*\)|[a-zA-Z]+)\s*([\s\S]*)$/.exec(rest);
      if (!m) throw new Error(`no entiendo el origen de: ${v}`);
      origin = resolveColor(m[1], scope, seen);
      parts = splitArgs(m[2]);
      const hsl = rgbToHsl(origin);
      ctx = rel
        ? { h: hsl.h, s: hsl.s, l: hsl.l, alpha: origin.a ?? 1 }
        : { r: origin.r, g: origin.g, b: origin.b, alpha: origin.a ?? 1 };
    } else {
      parts = splitArgs(head);
    }

    const n = parts.map((p) => evalNumber(p, ctx, scope, seen));
    const a = alphaPart === undefined ? (origin && parts.length === 3 ? 1 : 1)
                                      : evalNumber(alphaPart, ctx, scope, seen);
    const out = rel ? hslToRgb({ h: n[0], s: n[1], l: n[2] })
                    : { r: clamp(n[0], 0, 255), g: clamp(n[1], 0, 255), b: clamp(n[2], 0, 255) };
    return { ...out, a: clamp(a, 0, 1) };
  }

  throw new Error(`no entiendo el color: ${v}`);
}

/**
 * Un FONDO puede no ser un color: `glass` pinta --ui-bg con una malla de
 * degradés. Para medir hace falta el color plano que queda DEBAJO de todo, que
 * es el último tope de la última capa — en `background`, la última capa es la
 * de más abajo, y es la única que en un fondo de página es opaca.
 *
 * Es una aproximación y el test lo dice: sobre una malla el peor punto depende
 * de dónde caiga el texto, y eso no se resuelve leyendo tokens. Lo que sí
 * garantiza es que la capa base no sea el problema.
 */
function resolveBackdrop(value, scope) {
  try {
    return { color: resolveColor(value, scope), exact: true };
  } catch (err) {
    const v = String(value).trim();
    if (!/gradient\(/i.test(v)) throw err;
    const layers = splitTop(v, ',').map((s) => s.trim()).filter(Boolean);
    const last = layers[layers.length - 1].replace(/\s+(fixed|scroll|local)$/i, '');
    // El último tope del degradé: se prueba de atrás para adelante.
    const inner = /gradient\(([\s\S]*)\)$/.exec(last);
    const stops = inner ? splitTop(inner[1], ',') : [last];
    for (let i = stops.length - 1; i >= 0; i--) {
      const stop = stops[i].trim().replace(/\s+-?[\d.]+%?$/, '');
      try {
        return { color: resolveColor(stop, scope), exact: false };
      } catch { /* seguir buscando hacia atrás */ }
    }
    throw err;
  }
}

/** Separa los componentes de un color respetando calc(...) con espacios. */
function splitArgs(str) {
  const out = [];
  let depth = 0, cur = '';
  for (const c of str.trim()) {
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (/\s|,/.test(c) && depth === 0) {
      if (cur) { out.push(cur); cur = ''; }
    } else cur += c;
  }
  if (cur) out.push(cur);
  return out;
}

/* ======================================================================= */
/*  LEER UN tokens.css                                                     */
/* ======================================================================= */

/** Todas las declaraciones `--x: valor;` de un texto CSS, en orden. */
function parseDecls(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const out = [];
  const re = /(--[\w-]+)\s*:/g;
  let m;
  while ((m = re.exec(clean))) {
    let i = re.lastIndex, depth = 0;
    while (i < clean.length) {
      const c = clean[i];
      if (c === '(') depth++;
      else if (c === ')') depth--;
      else if ((c === ';' || c === '}') && depth === 0) break;
      i++;
    }
    out.push([m[1], clean.slice(re.lastIndex, i).trim()]);
    re.lastIndex = i;
  }
  return out;
}

/** Cuerpo de cada bloque cuyo selector matchea `test`. */
function blocks(css, test) {
  const out = [];
  const re = /([^{}]+)\{/g;
  let m;
  while ((m = re.exec(css))) {
    const sel = m[1].replace(/\/\*[\s\S]*?\*\//g, ' ').trim();
    let i = re.lastIndex, depth = 1;
    while (i < css.length && depth) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') depth--;
      i++;
    }
    const body = css.slice(re.lastIndex, i - 1);
    if (test(sel)) out.push(body);
    // No avanzar el índice: los bloques anidados (@media) se recorren igual.
  }
  return out;
}

/**
 * El scope de un pack para un tema. Se aplican en orden de cascada: primero
 * `*` y `:root`, después —solo en oscuro— los bloques de tema, que pisan.
 */
function scopeFor(css, settings, theme) {
  const scope = new Map();
  const put = (body) => { for (const [k, v] of parseDecls(body)) scope.set(k, v); };

  for (const b of blocks(css, (s) => s === '*' || s === ':root')) put(b);
  if (theme === 'dark') {
    for (const b of blocks(css, (s) => /^:root(:not\(\[data-theme="light"\]\)|\[data-theme="dark"\])$/.test(s))) put(b);
  }

  /* Las perillas las escribe src/config.js como variables CSS en <html>, o sea
     que pisan lo que diga tokens.css. Medir sin ellas es medir otro pack. */
  for (const [key, value] of Object.entries(settings)) {
    if (key === 'THEME') continue;
    if (key === 'BRAND_COLOR') scope.set('--ui-brand', String(value));
    else if (key === 'ROUNDNESS') scope.set('--ui-roundness', String(value));
    else scope.set('--ui-' + key.toLowerCase().replace(/_/g, '-'), String(value));
  }
  return scope;
}

/* ======================================================================= */
/*  LOS PARES                                                              */
/* ======================================================================= */

/* fg, bg, minimo, y si falla o solo avisa. El bg tiene que ser OPACO: es
   contra lo que de verdad se ve el texto. */
const PAIRS = [
  ['--ui-text',        '--ui-bg',      4.5, 'fail'],
  ['--ui-text',        '--ui-surface', 4.5, 'fail'],
  ['--ui-text-muted',  '--ui-bg',      4.5, 'fail'],
  ['--ui-text-muted',  '--ui-surface', 4.5, 'fail'],
  ['--ui-accent-text', '--ui-bg',      4.5, 'fail'],
  ['--ui-accent-text', '--ui-surface', 4.5, 'fail'],
  ['--ui-on-accent',   '--ui-accent',  4.5, 'fail'],
  ['--ui-on-danger',   '--ui-danger',  4.5, 'fail'],
  ['--ui-danger',      '--ui-bg',      4.5, 'fail'],
  ['--ui-focus-ring',  '--ui-bg',      3,   'fail'],
  ['--ui-focus-ring',  '--ui-surface', 3,   'fail'],
  ['--ui-text-subtle', '--ui-bg',      4.5, 'warn'],
  ['--ui-border',      '--ui-surface', 3,   'warn'],
];

/* ======================================================================= */

const args = process.argv.slice(2);
const verbose = args.includes('-v');
const only = args.filter((a) => !a.startsWith('-'));

const { packList } = await import('./src/styles/packs/index.js');
const packs = packList().filter((p) => !only.length || only.includes(p.id));
if (only.length && !packs.length) {
  console.error(`No hay ningún pack llamado ${only.join(', ')}.`);
  process.exit(2);
}

let fails = 0, warns = 0, checks = 0;
const brandMismatch = [];

for (const pack of packs) {
  const css = readFileSync(join(ROOT, 'src/styles/packs', pack.id, 'tokens.css'), 'utf8');

  // El fallback de tokens.css y el BRAND_COLOR de pack.js tienen que coincidir.
  const declared = parseDecls(css).find(([k]) => k === '--ui-brand')?.[1];
  if (declared && declared.toLowerCase() !== String(pack.settings.BRAND_COLOR).toLowerCase()) {
    brandMismatch.push(`${pack.id}: pack.js dice ${pack.settings.BRAND_COLOR}, tokens.css dice ${declared}`);
  }

  const lines = [];
  for (const theme of ['dark', 'light']) {
    const scope = scopeFor(css, pack.settings, theme);
    const nace = theme === pack.settings.THEME ? ' (el que nace)' : '';
    const rows = [];

    for (const [fgName, bgName, min, level] of PAIRS) {
      let fg, bg, exact = true;
      try {
        fg = resolveColor(`var(${fgName})`, scope);
        const got = resolveBackdrop(scope.get(bgName) ?? `var(${bgName})`, scope);
        bg = got.color;
        exact = got.exact;
      } catch (e) {
        rows.push(['ERROR', `${fgName.replace('--ui-', '')} sobre ${bgName.replace('--ui-', '')}`,
                   e.message, 'fail']);
        fails++;
        continue;
      }
      // Un fondo translúcido se apoya en --ui-bg, que es lo que hay detrás.
      if ((bg.a ?? 1) < 1) {
        bg = flatten(bg, resolveBackdrop(scope.get('--ui-bg') ?? '#000', scope).color);
      }
      const r = contrast(fg, bg);
      checks++;
      const ok = r >= min;
      if (!ok && level === 'fail') fails++;
      if (!ok && level === 'warn') warns++;
      if (!ok || verbose) {
        rows.push([ok ? 'ok' : (level === 'fail' ? 'FALLA' : 'aviso'),
                   `${fgName.replace('--ui-', '')} sobre ${bgName.replace('--ui-', '')}`,
                   `${r.toFixed(2)}:1 (min ${min})${exact ? '' : '  ~ capa base de un degradé'}`,
                   level]);
      }
    }
    if (rows.length) {
      lines.push(`  ${theme}${nace}`);
      for (const [tag, what, got] of rows) {
        lines.push(`    ${tag.padEnd(6)} ${what.padEnd(34)} ${got}`);
      }
    }
  }

  if (lines.length) {
    console.log(`\n${pack.label} (${pack.id})  brand ${pack.settings.BRAND_COLOR}`);
    console.log(lines.join('\n'));
  }
}

console.log('');
if (brandMismatch.length) {
  console.log('⚠ BRAND_COLOR y el fallback de tokens.css no coinciden:');
  for (const m of brandMismatch) console.log('   ' + m);
  fails += brandMismatch.length;
  console.log('');
}
console.log(`${packs.length} packs · ${checks} mediciones · ${fails} fallan · ${warns} avisan`
  + (verbose ? '' : '   (-v para ver todo)'));
process.exit(fails ? 1 : 0);
