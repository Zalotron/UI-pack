/* ===========================================================================
   REGISTRO DE PACKS
   ---------------------------------------------------------------------------
   Un pack es una estética completa: un CSS + sus settings. Cambiar de pack
   reestiliza todo sin tocar una sola clase, y trae los valores de perilla
   propios de ese estilo.

   Para crear uno nuevo (ej "cfrost"):
     1. cp -r src/styles/packs/_template  src/styles/packs/cfrost
     2. En pack.js: poner id, label y sus settings.
     3. En tokens.css: los valores de la estética (ahí vive el 90%).
     4. Ajustar la piel de los componentes que lo necesiten.
     5. Registrarlo acá abajo (2 líneas).
     6. configure({ STYLE_PACK: 'cfrost' })

   No se toca ni la lógica de los componentes ni su CSS estructural.
   =========================================================================== */

import defaultPack from './default/pack.js';
import glassPack from './glass/pack.js';
import cyberPack from './cyber/pack.js';
import softPack from './soft/pack.js';
import blueprintPack from './blueprint/pack.js';
import editorialPack from './editorial/pack.js';
import clayPack from './clay/pack.js';
import risoPack from './riso/pack.js';
import nocturnePack from './nocturne/pack.js';
import grungePack from './grunge/pack.js';
import minimalPack from './minimal/pack.js';

/** Pack activo si no se configura otro. */
export const DEFAULT_PACK = 'default';

/**
 * Claves de settings que TODO pack debe declarar. Son el minimo comun.
 *
 * THEME esta aca y no es una decision de documento: cada estetica tiene un
 * tema en el que NACE. Un neumorfico vive de una lamina clara con luz encima;
 * una risografia es tinta sobre papel; `nocturne` es un tablero oscuro. Cuando
 * el tema era global, elegir claro para uno se lo imponia a todos, y varios
 * packs se veian en su peor version sin que el usuario lo hubiera pedido.
 */
export const SETTING_KEYS = ['BRAND_COLOR', 'ROUNDNESS', 'THEME'];

/**
 * Como se muestra cada setting comun. Un pack puede sumar los SUYOS propios
 * declarandolos en `settings` y describiendolos en `controls`.
 *
 * Que exista esta descripcion es lo que evita que el catalogo tenga que saber
 * de antemano que perillas hay: las lee del pack y arma un control por cada
 * una. Un pack nuevo con perillas nuevas aparece solo.
 */
export const COMMON_CONTROLS = {
  BRAND_COLOR: { kind: 'color' },
  ROUNDNESS: { kind: 'range', min: 0, max: 3, step: 0.05 },
  /* Un interruptor, no una lista: son DOS valores y ninguno es "otro". Una
     lista desplegable para elegir entre dos cosas hace abrir un menu para
     tomar una decision binaria, y encima esconde la mitad de las opciones.
     Los iconos hacen el resto — un sol y una luna no necesitan rotulo. */
  THEME: {
    kind: 'switch',
    off: { value: 'light', icon: 'sun', label: 'Claro' },
    on: { value: 'dark', icon: 'moon', label: 'Oscuro' },
  },
};

/** Los unicos temas que existen. Siempre explicito: nada de 'system'. */
export const THEMES = ['dark', 'light'];

/**
 * Todas las claves de settings de un pack: las comunes mas las propias, EN EL
 * ORDEN EN QUE SE MUESTRAN.
 *
 * ⛔ THEME VA SIEMPRE PRIMERO, y lo decide esto y no cada pack. Es la perilla
 * que cambia mas cosas a la vez —lo demas se elige mirando el resultado de
 * haberla movido— asi que tiene que estar donde uno la encuentra sin buscarla,
 * y en el MISMO lugar en todos los estilos: una perilla que se muda de sitio al
 * cambiar de pack obliga a buscarla de nuevo cada vez.
 *
 * Dejarlo librado al orden en que cada pack escribe su `settings` es
 * exactamente lo que hace que se desacomode, y no hay forma de que se note
 * hasta que alguien compara dos packs.
 */
export function packSettingKeys(id) {
  const keys = Object.keys(packDefaults(id));
  return ['THEME', ...keys.filter((key) => key !== 'THEME')];
}

/**
 * Descripcion de cada control del pack, lista para que el catalogo la use.
 * Lo que el pack no describa cae a `range`, que es lo mas comun.
 */
export function packControls(id) {
  const pack = packs[id];
  if (!pack) throw new Error(`Pack "${id}" no registrado.`);
  const out = {};
  for (const key of packSettingKeys(id)) {
    /* ⛔ UN SETTING PUEDE ESTAR FIJO. `controls.X = null` quiere decir "este
       pack declara el valor pero no se toca".

       No es lo mismo que no declararlo: el valor sigue existiendo y sigue
       saliendo como variable CSS, asi que el pack funciona igual. Lo que
       desaparece es la perilla. Hace falta para las cosas que son FIRMA del
       estilo y no una preferencia — un plano con las esquinas redondeadas
       deja de ser un plano, asi que blueprint fija ROUNDNESS en 0 y no ofrece
       moverlo. */
    if (pack.controls && pack.controls[key] === null) continue;

    const meta = { ...COMMON_CONTROLS[key], ...(pack.controls?.[key]) };
    out[key] = { kind: 'range', min: 0, max: 1, step: 0.01, ...meta };
  }
  return out;
}

const registry = [defaultPack, glassPack, cyberPack, softPack, blueprintPack,
  editorialPack, clayPack, risoPack, nocturnePack, grungePack, minimalPack];

export const packs = Object.fromEntries(registry.map((pack) => [pack.id, pack]));

/** Lista de packs registrados, para armar un selector. */
export const packList = () => registry;

/** @returns {boolean} */
export const isPack = (id) => Object.prototype.hasOwnProperty.call(packs, id);

/** Settings declarados por un pack (su firma, sin overrides del usuario). */
export function packDefaults(id) {
  const pack = packs[id];
  if (!pack) throw new Error(`Pack "${id}" no registrado.`);
  return { ...pack.settings };
}

// Un pack que no declare todas las claves rompería el selector de settings.
for (const pack of registry) {
  const missing = SETTING_KEYS.filter((key) => !(key in pack.settings));
  if (missing.length) {
    throw new Error(`Pack "${pack.id}": faltan settings ${missing.join(', ')}.`);
  }
}

/**
 * Se asegura de que el CSS del pack esté enlazado y saca el de los otros.
 * Es lo que permite cambiar de estética en vivo.
 *
 * No hace falta llamarla si enlazaste el pack a mano en tu HTML.
 *
 * @returns {HTMLLinkElement|null}
 */
export function ensurePackStylesheet(id) {
  if (typeof document === 'undefined') return null;
  const pack = packs[id];
  if (!pack) throw new Error(`Pack "${id}" no registrado. Disponibles: ${Object.keys(packs).join(', ')}.`);

  let link = document.querySelector(`link[data-ui-pack="${id}"]`);
  if (!link) {
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.dataset.uiPack = id;
    link.href = pack.stylesheet;
    document.head.appendChild(link);
  }

  /* ⚠ LA HOJA VIEJA SE SACA RECIEN CUANDO LA NUEVA YA CARGO.
     Sacarla primero —que es lo que hacia esto— deja a la pagina unos cuadros
     SIN NINGUN PACK: no existe ni un solo --ui-*, asi que el fondo se va a
     blanco y el texto queda en el negro plano del navegador. Al cambiar de
     estilo se veia un pantallazo.

     Que convivan un momento no molesta: las dos hojas declaran los mismos
     tokens en :root, y la nueva esta DESPUES en el <head>, asi que gana ella
     desde el primer cuadro en que existe. */
  const dropOthers = () => {
    for (const other of document.querySelectorAll('link[data-ui-pack]')) {
      if (other !== link) other.remove();
    }
  };

  if (link.sheet) dropOthers();
  else {
    link.addEventListener('load', dropOthers, { once: true });
    // Si la hoja no carga, igual hay que sacar la vieja: quedarse con la
    // anterior para siempre seria peor que quedarse sin ninguna.
    link.addEventListener('error', dropOthers, { once: true });
    setTimeout(dropOthers, STYLESHEET_TIMEOUT);
  }

  return link;
}

/**
 * Promesa que resuelve cuando la hoja del pack está REALMENTE cargada.
 *
 * Hace falta antes de montar. La hoja se inyecta por JS, así que montar justo
 * después de cambiar de pack aplica las clases de entrada cuando todavía no
 * existe ninguna animación definida: no se ve nada, y encima el componente da
 * la entrada por terminada al instante.
 *
 * `link.sheet` deja de ser null recién cuando la hoja se parseó, así que
 * también cubre el caso de que ya estuviera cargada.
 *
 * @returns {Promise<void>}
 */
export function packStylesheetReady(id) {
  const link = ensurePackStylesheet(id);
  if (!link || link.sheet) return Promise.resolve();

  return new Promise((resolve) => {
    // `error` también resuelve: si la hoja no carga, que la UI aparezca igual
    // es mucho mejor que dejarla esperando para siempre.
    link.addEventListener('load', resolve, { once: true });
    link.addEventListener('error', resolve, { once: true });

    /* Y un tope, por si `load` no llega NUNCA. Pasa de verdad: en un entorno
       que no baja hojas de estilo (jsdom, un render de prueba) el evento no se
       dispara jamás y la página se quedaría sin montar para siempre.
       Esperar la hoja es para que se vea bien una animación — una cuestión
       cosmética no puede bloquear que la UI aparezca. */
    setTimeout(resolve, STYLESHEET_TIMEOUT);
  });
}

/** Cuánto se espera, como mucho, a que cargue la hoja de un pack. */
const STYLESHEET_TIMEOUT = 600;
