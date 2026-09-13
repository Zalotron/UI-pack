/* ===========================================================================
   CONFIGURACION
   ---------------------------------------------------------------------------
   Dos niveles:

     STYLE_PACK  -> GLOBAL. Que paquete estetico usa la UI.
     settings    -> POR PACK. Las perillas que se mueven DENTRO de un estilo
                    (BRAND_COLOR, ROUNDNESS). Cada pack trae las suyas, asi
                    que cambiar de pack tambien cambia sus valores.

   Como se propaga:
     1. Los settings del pack activo se escriben como variables CSS en <html>.
     2. El tokens.css del pack DERIVA todo el resto de esas variables.
     3. Como son variables CSS, cambiarlas actualiza todo lo montado al
        instante, sin re-renderizar nada.

   Uso:
     - Permanente: editar `settings` en src/styles/packs/<pack>/pack.js
     - Runtime:    configure({ ROUNDNESS: 1 })
                   configure({ STYLE_PACK: 'cfrost' })
   =========================================================================== */

import {
  packs,
  THEMES,
  isPack,
  packDefaults,
  packSettingKeys,
  packControls,
  ensurePackStylesheet,
  DEFAULT_PACK,
  SETTING_KEYS,
} from './styles/packs/index.js';

export { SETTING_KEYS, packDefaults, packSettingKeys, packControls };

// ---------------------------------------------------------------- estado ---

const state = {
  /** Pack activo. */
  pack: DEFAULT_PACK,
  /** Overrides del usuario por pack: { [packId]: { BRAND_COLOR, ... } } */
  overrides: Object.create(null),
};

const listeners = new Set();

/** Settings efectivos de un pack: su firma + lo que el usuario haya cambiado. */
export function packSettings(id = state.pack) {
  return { ...packDefaults(id), ...(state.overrides[id] || {}) };
}

/** Snapshot completo: el pack activo y sus settings efectivos. */
export function snapshot() {
  return { STYLE_PACK: state.pack, ...packSettings(state.pack) };
}

/**
 * Config activa, de SOLO LECTURA.
 *   config.STYLE_PACK    -> pack activo
 *   config.BRAND_COLOR   -> valor efectivo EN EL PACK ACTIVO
 *   configure({ ... })   -> escribir
 *
 * Asignar directo tira un error con el mensaje correcto en vez de fallar en
 * silencio (que seria el bug facil de cometer).
 */
export const config = new Proxy(Object.create(null), {
  get(_target, key) {
    if (key === 'STYLE_PACK') return state.pack;
    if (packSettingKeys(state.pack).includes(key)) return packSettings(state.pack)[key];
    if (key === Symbol.toStringTag) return 'UIConfig';
    return undefined;
  },
  set(_target, key) {
    throw new Error(
      `config.${String(key)} es de solo lectura. Usa configure({ ${String(key)}: ... }).`,
    );
  },
  deleteProperty(_target, key) {
    throw new Error(`No se puede borrar config.${String(key)}.`);
  },
  has(_target, key) {
    return key === 'STYLE_PACK' || packSettingKeys(state.pack).includes(key);
  },
  ownKeys() {
    // Las del pack ACTIVO: un pack puede tener perillas que otro no tiene.
    return ['STYLE_PACK', ...packSettingKeys(state.pack)];
  },
  getOwnPropertyDescriptor() {
    return { enumerable: true, configurable: true };
  },
});

// ------------------------------------------------------------ validacion ---

const validators = {
  BRAND_COLOR(value) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new TypeError('BRAND_COLOR debe ser un color CSS valido (ej: "#1262e2").');
    }
    return value.trim();
  },
  ROUNDNESS(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) throw new TypeError('ROUNDNESS debe ser un numero.');
    return Math.max(0, n);
  },
  THEME(value) {
    if (!THEMES.includes(value)) {
      throw new TypeError(`THEME debe ser uno de: ${THEMES.join(', ')}.`);
    }
    return value;
  },
};

/**
 * Validacion para las perillas PROPIAS de un pack, que no tienen validador con
 * nombre. Se apoya en el tipo del valor declarado: si el pack la declaro como
 * numero, tiene que seguir siendo un numero.
 */
function validateSetting(key, value, declared) {
  if (validators[key]) return validators[key](value);
  if (typeof declared === 'number') {
    const n = Number(value);
    if (!Number.isFinite(n)) throw new TypeError(`${key} debe ser un numero.`);
    return n;
  }
  return value;
}

/**
 * Nombre de la variable CSS de una perilla: GRID_OPACITY -> --ui-grid-opacity.
 * Las dos comunes tienen nombre propio por historia (--ui-brand, no
 * --ui-brand-color), asi que se mapean aparte en toCssVars().
 */
const cssVarName = (key) => `--ui-${key.toLowerCase().replace(/_/g, '-')}`;

// ------------------------------------------------------------------ color ---

/**
 * Convierte un color CSS a [r, g, b]. Devuelve null si no se puede.
 * Resuelve hex y rgb() sin tocar el DOM; para el resto (nombrados, hsl,
 * oklch...) delega en el motor de estilos del browser.
 */
function toRgb(color) {
  const value = String(color).trim();

  const hex = /^#([0-9a-f]{3,8})$/i.exec(value);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }

  const rgb = /^rgba?\(([^)]+)\)$/i.exec(value);
  if (rgb) {
    const parts = rgb[1].split(/[\s,/]+/).filter(Boolean).slice(0, 3).map(Number);
    if (parts.length === 3 && parts.every(Number.isFinite)) return parts;
  }

  // Notaciones que no vale la pena parsear a mano: las resuelve el browser.
  if (typeof document === 'undefined') return null;
  const view = document.defaultView;
  if (!view?.getComputedStyle) return null;

  const probe = document.createElement('span');
  probe.style.cssText = `display:none;color:${value}`;
  document.documentElement.appendChild(probe);
  const computed = view.getComputedStyle(probe).color;
  probe.remove();

  return computed && computed !== value ? toRgb(computed) : null;
}

/** Luminancia relativa segun WCAG. */
function luminance([r, g, b]) {
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

const contrastRatio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/**
 * Utilidad de contraste. Los dos candidatos son valores de MEDICION, no
 * colores que se emitan a la pagina: quien pinta usa `onBrandToken()`.
 *
 * Elige, entre `light` y `dark`, el color de texto que MAS contrasta sobre
 * `background` (ratio WCAG). Asi el texto sobre el boton primario sigue siendo
 * legible con CUALQUIER BRAND_COLOR, incluso uno claro como el amarillo.
 *
 * Ojo: gana el contraste medido, no la convencion. Con algunos tonos medios
 * puede elegir texto oscuro donde uno esperaria blanco, porque objetivamente
 * se lee mejor. Para forzarlo, pisa --ui-on-accent, o pasa otros candidatos.
 */
export function readableOn(background, light = '#ffffff', dark = '#0f172a') {
  const rgb = toRgb(background);
  if (!rgb) return light;

  const bg = luminance(rgb);
  const onLight = contrastRatio(bg, luminance(toRgb(light)));
  const onDark = contrastRatio(bg, luminance(toRgb(dark)));
  return onLight >= onDark ? light : dark;
}

// --------------------------------------------------------------- aplicar ---

/**
 * Elige a cual de los dos tokens de texto sobre el brand hay que apuntar.
 * Devuelve una REFERENCIA a token, nunca un color: la regla del proyecto es
 * que el unico color declarado sea BRAND_COLOR, y los dos candidatos ya salen
 * de el en el CSS del pack (--ui-on-brand-light / -dark).
 *
 * Para medir el contraste usa blanco y casi-negro como aproximacion de esos
 * dos tokens (98% y 9% de claridad): la decision es la misma y evita tener que
 * resolver estilos computados.
 */
export function onBrandToken(brandColor) {
  return readableOn(brandColor) === '#ffffff'
    ? 'var(--ui-on-brand-light)'
    : 'var(--ui-on-brand-dark)';
}

/** Traduce los settings a variables CSS. Son las unicas "perillas" raiz. */
export function toCssVars(settings = packSettings(state.pack)) {
  const vars = {
    '--ui-brand': settings.BRAND_COLOR,
    '--ui-on-brand': onBrandToken(settings.BRAND_COLOR),
    '--ui-roundness': String(settings.ROUNDNESS),
  };

  /* Las perillas PROPIAS del pack salen solas, con el nombre derivado de su
     clave. Asi un pack puede inventarse una perilla y usarla en su CSS sin
     tocar una linea de este archivo. */
  for (const [key, value] of Object.entries(settings)) {
    if (key === 'BRAND_COLOR' || key === 'ROUNDNESS') continue;
    /* THEME no es una variable CSS: es un ATRIBUTO. Los tokens de cada pack
       reaccionan a `[data-theme]`, no a un `var()`. Lo escribe applyConfig(). */
    if (key === 'THEME') continue;
    vars[cssVarName(key)] = String(value);
  }
  return vars;
}

/**
 * Escribe el pack y sus settings en el documento (por defecto en <html>).
 * Se llama sola al importar este modulo. Se puede apuntar a otro nodo para
 * tener settings distintos en una subseccion del DOM (el pack no: es una
 * decision de documento, porque es una hoja de estilos).
 */
export function applyConfig(target) {
  const node = target || (typeof document !== 'undefined' ? document.documentElement : null);
  if (!node) return snapshot(); // entorno sin DOM (SSR, tests de node puro)

  for (const [name, value] of Object.entries(toCssVars())) {
    node.style.setProperty(name, value);
  }

  if (node === document.documentElement) {
    node.setAttribute('data-ui-pack', state.pack);
    /* El tema es del PACK, no del documento: cada estetica nace clara u
       oscura. Se escribe como atributo porque los tokens de un pack lo leen
       con `:root[data-theme="dark"]`, no con una variable. */
    node.setAttribute('data-theme', packSettings(state.pack).THEME);
    ensurePackStylesheet(state.pack);
  }

  return snapshot();
}

/**
 * Cambia el pack activo y/o settings del pack activo, y los aplica al instante.
 *
 *   configure({ ROUNDNESS: 1 })                  // perilla del pack activo
 *   configure({ STYLE_PACK: 'cfrost' })          // cambia de estilo
 *   configure({ STYLE_PACK: 'cfrost', ROUNDNESS: 2 })
 *
 * Al cambiar de pack, los settings que NO se pasen toman el valor de ESE pack.
 */
export function configure(patch = {}) {
  const { STYLE_PACK, ...settings } = patch;

  /* Se valida contra las claves del pack DESTINO, no del activo: si en la
     misma llamada se cambia de pack y se toca una perilla suya, esa perilla
     todavia no existe en el pack de salida. */
  const target = STYLE_PACK !== undefined && isPack(STYLE_PACK) ? STYLE_PACK : state.pack;
  const valid = packSettingKeys(target);
  for (const key of Object.keys(settings)) {
    if (!valid.includes(key)) {
      throw new Error(
        `configure(): "${key}" no existe en el pack "${target}". ` +
        `Claves validas: STYLE_PACK, ${valid.join(', ')}.`,
      );
    }
  }

  if (STYLE_PACK !== undefined) {
    if (!isPack(STYLE_PACK)) {
      throw new Error(
        `STYLE_PACK "${STYLE_PACK}" no existe. Packs registrados: ${Object.keys(packs).join(', ')}.`,
      );
    }
    state.pack = STYLE_PACK;
  }

  if (Object.keys(settings).length) setPackSettings(state.pack, settings);

  applyConfig();
  const snap = snapshot();
  for (const listener of [...listeners]) listener(snap);
  return snap;
}

/**
 * Cambia settings de un pack SIN activarlo. Util para preconfigurar packs.
 * No aplica nada si el pack no es el activo.
 */
export function configurePack(id, settings = {}) {
  if (!isPack(id)) throw new Error(`Pack "${id}" no registrado.`);
  setPackSettings(id, settings);
  if (id === state.pack) return configure({});
  return packSettings(id);
}

function setPackSettings(id, settings) {
  const bucket = state.overrides[id] || (state.overrides[id] = {});
  const declared = packDefaults(id);
  for (const [key, value] of Object.entries(settings)) {
    if (!(key in declared)) {
      throw new Error(
        `Setting "${key}" no existe en el pack "${id}". ` +
        `Validas: ${Object.keys(declared).join(', ')}.`,
      );
    }
    bucket[key] = validateSetting(key, value, declared[key]);
  }
}

/**
 * Descarta los overrides del pack activo: vuelve a su firma declarada en
 * src/styles/packs/<pack>/pack.js
 */
export function resetConfig() {
  delete state.overrides[state.pack];
  return configure({});
}

/**
 * Escucha cambios. Solo hace falta para componentes que necesiten el valor del
 * lado de JS (canvas, SVG generado). Los que solo usan CSS se actualizan solos.
 * @returns {() => void} funcion para desuscribirse
 */
export function onConfigChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Aplicacion inicial. Idempotente: los modulos ES se evaluan una sola vez.
applyConfig();
