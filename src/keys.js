/* ===========================================================================
   LOS ATAJOS DE TECLADO DE LA LIBRERIA — TODOS, Y EN UN SOLO LUGAR

   Si viniste a cambiar una tecla, este es el archivo. No hay otro: ningun
   componente escribe `event.key === 'F2'` por su cuenta.

     import { configureKeys } from 'web-ui/keys';

     configureKeys({
       rename: ['F2', 'Ctrl+R'],   // renombrar, con las dos
       closeTab: [],               // apagar el atajo: queda solo la cruz
     });

   ⛔ POR QUE EXISTE ESTE ARCHIVO. Un atajo escrito adentro del componente que
   lo usa es imposible de encontrar sin leer el componente — y quien quiere
   cambiarlo normalmente no sabe cual de los dieciocho lo tiene. Peor: el dia
   que dos componentes necesiten el mismo gesto, cada uno escribe su tecla y se
   desincronizan sin que nadie lo note, porque los dos "andan".

   Acá se leen todos de un vistazo, y cambiar uno es cambiar un renglon.

   ⛔ LO QUE NO ESTA ACA, Y NO ES UN OLVIDO: las FLECHAS, Home y End. Esas no
   son atajos de esta libreria — son el contrato de los patrones de ARIA (una
   fila de pestañas se recorre con flechas, un grupo de opciones tambien).
   Cambiarlas no personaliza nada: rompe lo que un lector de pantalla le
   prometio a quien lo usa. Si hiciera falta tocarlas, el problema es otro.
   =========================================================================== */

/**
 * Los atajos, con su valor de fabrica.
 *
 * Cada uno es una lista: un gesto puede tener mas de una tecla, y una lista
 * vacia lo apaga sin romper nada —lo que el atajo hacia se sigue pudiendo
 * hacer con el mouse—.
 *
 * Formato: `Tecla` o `Modificador+Tecla`, con los modificadores `Ctrl`, `Alt`,
 * `Shift` y `Meta` (Cmd en Mac). El nombre de la tecla es el de `event.key`:
 * `F2`, `Enter`, `Escape`, `Delete`, ` ` para la barra espaciadora.
 */
const FABRICA = {
  /**
   * Renombrar en el lugar la pieza enfocada.
   *
   * La otra via es el doble click SOBRE EL NOMBRE, y esa no se configura: es
   * donde todo el mundo lo busca. Ver `core/rename.js`.
   */
  rename: ['F2'],

  /** Confirmar lo que se esta escribiendo (un nombre, un numero). */
  commit: ['Enter'],

  /** Descartar y volver a lo que habia. */
  cancel: ['Escape'],

  /**
   * Activar lo que esta enfocado, cuando no es un `<button>` de verdad.
   *
   * La barra espaciadora esta porque un boton nativo la acepta: una pieza con
   * `role="button"` que no la acepte se siente rota para quien usa teclado.
   */
  activate: ['Enter', ' '],

  /** Cerrar la pestaña activa. La otra via es la cruz, que no se configura. */
  closeTab: ['Delete'],
};

/** Lo que rige ahora. Arranca como la fabrica y lo cambia `configureKeys`. */
const actual = Object.fromEntries(
  Object.entries(FABRICA).map(([k, v]) => [k, [...v]]),
);

/** Los nombres validos, para avisar cuando alguien escribe uno que no existe. */
export const KEY_ACTIONS = Object.keys(FABRICA);

/**
 * Cambia uno o varios atajos. Lo que no se nombra se queda como estaba.
 *
 * ⚠ AVISA SI EL NOMBRE NO EXISTE. Un `configureKeys({ renombrar: [...] })` sin
 * aviso se aplica a nada y el atajo sigue siendo F2: uno da por hecho que lo
 * cambio y el sintoma aparece mucho despues.
 */
export function configureKeys(patch = {}) {
  for (const [accion, teclas] of Object.entries(patch)) {
    if (!(accion in FABRICA)) {
      console.warn(`configureKeys: "${accion}" no es un atajo de la libreria. Validos: ${KEY_ACTIONS.join(', ')}.`);
      continue;
    }
    actual[accion] = Array.isArray(teclas) ? [...teclas] : [teclas];
  }
  return { ...actual };
}

/** Los atajos que rigen ahora, para mostrarlos en una ayuda o un panel. */
export function currentKeys() {
  return Object.fromEntries(Object.entries(actual).map(([k, v]) => [k, [...v]]));
}

/** Vuelve todo a los valores de fabrica. */
export function resetKeys() {
  for (const [k, v] of Object.entries(FABRICA)) actual[k] = [...v];
  return currentKeys();
}

/** Una tecla escrita (`Ctrl+Enter`) contra un evento de teclado. */
const coincide = (evento, atajo) => {
  const partes = String(atajo).split('+');
  const tecla = partes.pop();
  const pide = (nombre) => partes.some((p) => p.toLowerCase() === nombre);

  /* ⛔ LOS MODIFICADORES SE COMPARAN LOS CUATRO, tambien los que el atajo no
     pide. Mirando solo los que nombra, `Enter` tambien dispararia con
     `Ctrl+Enter` — y ahi dos atajos distintos hacen la misma cosa. */
  if (evento.ctrlKey !== pide('ctrl')) return false;
  if (evento.altKey !== pide('alt')) return false;
  if (evento.shiftKey !== pide('shift')) return false;
  if (evento.metaKey !== pide('meta')) return false;

  /* La barra espaciadora llega como ' ' en los navegadores de hoy y como
     'Spacebar' en los viejos; se aceptan las dos escrituras. */
  if (tecla === ' ') return evento.key === ' ' || evento.key === 'Spacebar';
  return evento.key.toLowerCase() === tecla.toLowerCase();
};

/**
 * Si ese evento de teclado es ese atajo.
 *
 *   if (isKey(event, 'rename')) this.startRename();
 *
 * @param {KeyboardEvent} evento
 * @param {'rename'|'commit'|'cancel'|'activate'|'closeTab'} accion
 */
export function isKey(evento, accion) {
  const teclas = actual[accion];
  if (!teclas || !teclas.length || !evento?.key) return false;
  return teclas.some((atajo) => coincide(evento, atajo));
}
