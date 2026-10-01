/* ===========================================================================
   RENOMBRAR EN EL LUGAR

   Se le da el nodo que muestra un nombre y lo reemplaza por un campo, ahi
   mismo, hasta que se confirme o se cancele.

     renameInPlace({
       label: nodoDelNombre,
       host:  laPiezaEntera,
       value: 'Cubo',
       onCommit: (nuevo) => guardar(nuevo),
     });

   ⛔ ESTO NO ES UN COMPONENTE, Y POR ESO VIVE EN `core/`. Renombrar no es una
   cosa que se pone en la pantalla: es algo que una pieza con nombre PUEDE
   hacer. Una ficha de catalogo, una pestaña, el titulo de una ventana — las
   tres tienen un nombre y ninguna deja de ser lo que es por dejarse renombrar.
   Quien lo quiere lo declara con `editableLabel: true` y recibe `onRename`.

   ⛔ EL CAMPO OCUPA EL LUGAR DEL NOMBRE Y NADA MAS. Lo que se renombra es el
   nombre: el icono, el borde y el lugar en la grilla se quedan donde estaban.
   Esconder la pieza entera y poner un campo suelto en su lugar hace desaparecer
   la cosa justo cuando uno la esta mirando para decidir como llamarla.

   ⛔ LAS DOS VIAS, SIEMPRE: doble click en el NOMBRE y F2 con la pieza
   enfocada. Media regla no sirve — el que aprendio F2 en un panel lo aprieta en
   el de al lado, no pasa nada, y ahi deja de creerle al atajo: a partir de ese
   momento va al doble click siempre, tambien donde F2 andaba.

   ⛔ Y EL DOBLE CLICK ES EN EL NOMBRE, NO EN LA PIEZA. En un explorador el
   doble click sobre la fila ABRE y el del nombre RENOMBRA: los dos en el mismo
   lugar serian dos cosas distintas para el mismo gesto. Por eso el disparador
   se engancha al rotulo y frena la propagacion.
   =========================================================================== */

import { isKey } from '../keys.js';

/** La clase del campo. Su forma vive en base.css; el color, en el pack. */
const CLASE = 'ui-rename';

/**
 * Reemplaza un rotulo por un campo de texto, en el lugar.
 *
 * @param {object} opciones
 * @param {HTMLElement} opciones.label el nodo que muestra el nombre
 * @param {HTMLElement} [opciones.host] la pieza entera (para suspender el arrastre)
 * @param {string} opciones.value el nombre actual
 * @param {(nuevo: string) => void} opciones.onCommit solo si cambio y no quedo vacio
 * @param {() => void} [opciones.onClose] siempre, se haya confirmado o no
 * @returns {{ field: HTMLInputElement, close: (commit?: boolean) => void } | null}
 */
export function renameInPlace({ label, host, value, onCommit, onClose }) {
  if (!label || !label.parentNode) return null;

  const field = document.createElement('input');
  field.type = 'text';
  field.className = CLASE;
  field.value = value ?? '';
  field.setAttribute('aria-label', value ?? '');

  /* ⚠ MIENTRAS SE ESCRIBE, LA PIEZA NO SE ARRASTRA. Con un ancestro arrastrable
     el navegador se queda con el gesto de seleccionar texto: uno intenta marcar
     una parte del nombre con el mouse y en vez de eso empieza a arrastrar la
     ficha. Se devuelve como estaba al cerrar. */
  const arrastraba = host?.getAttribute('draggable') === 'true';

  let cerrado = false;
  const close = (commit = false) => {
    if (cerrado) return;
    cerrado = true;
    const nuevo = String(field.value ?? '').trim();
    field.replaceWith(label);
    if (arrastraba) host.setAttribute('draggable', 'true');
    host?.classList.remove('is-renaming');
    /* Vacio no es un nombre, y lo mismo de antes no es un cambio: en los dos
       casos lo correcto es no avisar nada. */
    if (commit && nuevo && nuevo !== value) onCommit?.(nuevo);
    onClose?.();
  };

  field.addEventListener('keydown', (event) => {
    if (isKey(event, 'commit')) { event.preventDefault(); close(true); }
    else if (isKey(event, 'cancel')) { event.preventDefault(); close(false); }
    /* ⛔ LAS TECLAS SON DEL CAMPO, no de la pieza ni de la aplicacion. Sin esto
       el `keydown` sube y algun atajo se lleva la tecla mientras uno escribe un
       nombre — empezando por el F2 que abrio esto, y por el Supr que cierra una
       pestaña. */
    event.stopPropagation();
  });
  /* Salirse CONFIRMA. Cancelar es Escape, que es explicito: perder lo escrito
     por clickear al lado es la clase de cosa que uno no vuelve a intentar. */
  field.addEventListener('blur', () => close(true));
  field.addEventListener('click', (event) => event.stopPropagation());
  /* Doble click adentro del campo es elegir una palabra. Si subiera, la pieza lo
     leeria como su propio doble click y se abriria mientras uno esta eligiendo
     que parte del nombre reemplazar. */
  field.addEventListener('dblclick', (event) => event.stopPropagation());

  host?.removeAttribute('draggable');
  host?.classList.add('is-renaming');
  label.replaceWith(field);
  field.focus();
  field.select();

  return { field, close };
}

/**
 * Engancha las DOS vias de siempre a una pieza con nombre.
 *
 * El componente pasa su propio `listen` para que las escuchas se suelten con
 * el, que es lo que evita que queden colgadas de un nodo que ya no existe.
 *
 * @param {object} opciones
 * @param {(nodo: EventTarget, tipo: string, fn: Function) => void} opciones.listen
 * @param {HTMLElement} opciones.host la pieza entera: de ahi se escucha el F2
 * @param {() => HTMLElement} opciones.label como encontrar el rotulo AHORA
 * @param {() => string} opciones.value el nombre actual, al momento de abrir
 * @param {(nuevo: string) => void} opciones.onCommit
 * @returns {() => void} abrir el campo a mano, para quien tenga su propia
 *                       seleccion y quiera atar el F2 a nivel de ventana
 */
export function wireRename({ listen, host, label, value, onCommit }) {
  let abierto = null;

  const start = () => {
    if (abierto) return;
    abierto = renameInPlace({
      label: label(),
      host,
      value: value(),
      onCommit,
      onClose: () => { abierto = null; },
    });
  };

  listen(host, 'dblclick', (event) => {
    /* Solo si el doble click fue EN EL NOMBRE. En la pieza significa otra cosa
       —abrir, entrar a la carpeta— y las dos no pueden compartir gesto. */
    const rotulo = label();
    if (!rotulo || !rotulo.contains(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    start();
  });

  /* La tecla con la pieza enfocada. CUAL es, lo decide `src/keys.js` y no este
     archivo: un atajo escrito adentro del componente que lo usa es imposible de
     encontrar sin leer el componente.

     Quien tenga su propia seleccion —un panel que resalta una fila sin darle el
     foco— puede llamar a `startRename()` desde donde escuche la tecla, que es
     lo mismo por otra puerta. */
  listen(host, 'keydown', (event) => {
    if (!isKey(event, 'rename')) return;
    event.preventDefault();
    start();
  });

  return start;
}
