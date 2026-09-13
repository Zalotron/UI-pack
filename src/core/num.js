/**
 * Utilidades numéricas compartidas por los controles que manejan valores
 * (Spinner, Slider, y los que vengan). Viven acá para que no se dupliquen
 * ni se desincronicen entre componentes.
 */

/** Máximo razonable de decimales (`toFixed` no acepta más de 100). */
export const MAX_PRECISION = 12;

/**
 * Cantidad de decimales que necesita un número. Soporta notación 1e-7.
 *   decimalsOf(0.05) -> 2
 *   decimalsOf(1)    -> 0
 */
export function decimalsOf(value) {
  if (!Number.isFinite(value)) return 0;
  const text = String(Math.abs(value));
  if (text.includes('e-')) {
    const [mantissa, exponent] = text.split('e-');
    return (mantissa.split('.')[1]?.length || 0) + Number(exponent);
  }
  return text.split('.')[1]?.length || 0;
}

/** Decimales válidos para `toFixed`. */
export const clampPrecision = (decimals) =>
  Math.min(Math.max(Math.trunc(decimals) || 0, 0), MAX_PRECISION);

/**
 * Redondeo estable: evita que 0.1 + 0.1 + 0.1 quede en 0.30000000000000004.
 * `toFixed` ya resuelve bien el caso; multiplicar por 10**n no.
 */
export function round(value, decimals) {
  if (!Number.isFinite(value)) return value;
  return Number(value.toFixed(clampPrecision(decimals)));
}

/**
 * Texto del número.
 * @param {boolean} fixed - true deja siempre los decimales pedidos ("0.00").
 */
export function format(value, decimals, fixed = false) {
  const places = clampPrecision(decimals);
  return fixed ? value.toFixed(places) : String(round(value, places));
}

/** Acota a un rango. `null`/`undefined` en un extremo = sin límite de ese lado. */
export function clamp(value, min, max) {
  let n = Number(value);
  if (!Number.isFinite(n)) n = min ?? 0;
  if (min !== null && min !== undefined) n = Math.max(min, n);
  if (max !== null && max !== undefined) n = Math.min(max, n);
  return n;
}
