/* ===========================================================================
   Documentación — el VISOR.

   Se abre como una ventana MODAL en el centro de la pantalla, con el fondo
   oscurecido. No es otra página a propósito: así hereda el pack y el tema que
   estén puestos en ese momento, y cambiar de estilo con la documentación
   abierta la reestiliza igual que a todo lo demás.

   Está armada con las MISMAS clases que documenta: Window, Container, Scroll,
   Button, Icon, Tabs y Separator. Si una clase se rompe, se rompe la
   documentación — que es exactamente lo que uno quiere de un ejemplo.

   El contenido vive en doc-content.js. Acá solo se dibuja.
   =========================================================================== */

import { Window, Container, Scroll, Button, Icon, Tabs, Separator, el } from '../src/index.js';
import { SECTIONS, UI } from './doc-content.js';

/** Idioma elegido. Se recuerda entre visitas. */
const GUARDADO = 'web-ui:doc-lang';

let win = null;       // la ventana, mientras está abierta
let lang = leerIdioma();
let activa = SECTIONS[0].id;

/* Los botones del índice, para poder marcarles el estado sin volver a
   dibujarlos: redibujarlos los haría entrar animados de nuevo en cada click. */
const navButtons = new Map();
let contentScroll = null;

/* Los componentes que vive SOLO la sección que se está mirando —hoy, los
   botones de copiar. Se destruyen al cambiar de sección: si no, cada vuelta
   por la documentación deja una tanda más colgada del árbol de la ventana. */
let piezas = [];

function leerIdioma() {
  try {
    const guardado = localStorage.getItem(GUARDADO);
    if (guardado === 'es' || guardado === 'en') return guardado;
  } catch { /* sin localStorage: se arranca en español y listo */ }
  return 'es';
}

function guardarIdioma(valor) {
  try { localStorage.setItem(GUARDADO, valor); } catch { /* da igual */ }
}

/** Texto en el idioma activo. */
const t = (par) => (par && typeof par === 'object' ? par[lang] : par);

// ------------------------------------------------------------- los bloques --
/* Un bloque es un objeto con UNA clave, que dice qué es. Cada una se dibuja
   distinto, y todas salen con los tokens del pack activo. */

function bloque(b) {
  if (b.h) return el('h3', { class: 'cat-doc__h', html: t(b.h) });

  if (b.p) return el('p', { class: 'cat-doc__p', html: t(b.p) });

  if (b.ul) {
    return el('ul', { class: 'cat-doc__ul' },
      t(b.ul).map((item) => el('li', { html: item })));
  }

  if (b.code) return bloqueCodigo(b.code);

  if (b.table) {
    const head = t(b.table.head);
    /* Una fila puede traer la columna del medio vacía —hay tablas de dos
       columnas— así que se filtra por lo que la cabecera dice que hay. */
    const cols = head.length;
    return el('div', { class: 'cat-doc__tablewrap' }, [
      el('table', { class: 'cat-doc__table' }, [
        el('thead', {}, [el('tr', {}, head.map((h) => el('th', { text: h })))]),
        el('tbody', {}, b.table.rows.map((fila) => {
          const celdas = fila.filter((c) => c !== null && c !== undefined);
          return el('tr', {}, celdas.slice(0, cols).map((celda, i) => {
            const texto = t(celda);
            // La primera columna siempre es un nombre de la API: va en mono.
            return el('td', i === 0
              ? { class: 'cat-doc__api', text: texto }
              : { html: texto });
          }));
        })),
      ]),
    ]);
  }

  return null;
}

/* ⛔ SOLO EL CODIGO SE SELECCIONA.
   La regla del proyecto es que el texto de la interfaz NO se selecciona, como
   en una aplicacion de escritorio, y que lo que si se selecciona es explicito.
   Una documentacion no es la excepcion: leerla no es copiarla. Lo unico que
   esta para copiar es el ejemplo, asi que es lo unico marcado — y encima tiene
   su propio boton, que es como uno lo copia de verdad. */
function bloqueCodigo(lineas) {
  const texto = lineas.join('\n');

  const aviso = el('span', {
    class: 'cat-doc__copied',
    text: UI[lang].copied,
    'aria-hidden': 'true',
  });

  const boton = new Button({
    /* ⚠ `label: ''` NO es de adorno: el rotulo por defecto de Button es la
       palabra "Button", asi que sin pisarlo el boton sale con el icono Y ese
       texto al lado. Y ademas es lo que lo vuelve `icon-only`, o sea cuadrado
       — que es de lo que depende que quede prolijo en la esquina. */
    label: '',
    icon: new Icon({ name: 'copy' }),
    variant: 'ghost',
    size: 'sm',
    ariaLabel: UI[lang].copy,
    className: 'cat-doc__copy',
    onClick: () => copiar(texto, envoltorio, aviso),
  });
  piezas.push(boton);

  /* El aviso y el boton van en una MISMA fila, no posicionados cada uno por su
     cuenta: asi el aviso queda a la izquierda del boton sin que nadie tenga que
     calcular cuanto mide el boton — que es justo lo que se calculo mal y dejaba
     el aviso tapado debajo. */
  const envoltorio = el('div', { class: 'cat-doc__codewrap' }, [
    el('pre', { class: 'cat-doc__code ui-selectable' }, [el('code', { text: texto })]),
    el('div', { class: 'cat-doc__tools' }, [aviso, boton.element]),
  ]);
  return envoltorio;
}

/** Cuanto se queda el aviso de copiado, en ms. */
const AVISO = 1400;
let avisoTimer = null;

async function copiar(texto, envoltorio, aviso) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    /* Sin API de portapapeles —o sin permiso— se copia a la vieja usanza: un
       campo temporal, seleccionado y copiado. Es lo unico que funciona fuera
       de un contexto seguro. */
    const campo = document.createElement('textarea');
    campo.value = texto;
    campo.setAttribute('aria-hidden', 'true');
    campo.style.position = 'fixed';
    campo.style.opacity = '0';
    document.body.append(campo);
    campo.select();
    try { document.execCommand('copy'); } catch { /* no se pudo: sin aviso */ }
    campo.remove();
  }

  aviso.textContent = UI[lang].copied;
  envoltorio.classList.add('is-copied');
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(() => envoltorio.classList.remove('is-copied'), AVISO);
}


/** Todo el cuerpo de una sección. */
function cuerpo(seccion) {
  return el('article', { class: 'cat-doc__body' }, [
    el('h2', { class: 'cat-doc__title', text: t(seccion.title) }),
    ...seccion.blocks.map(bloque).filter(Boolean),
  ]);
}

// --------------------------------------------------------------- el índice --

function pintarActiva() {
  for (const [id, btn] of navButtons) {
    btn.update({ variant: id === activa ? 'secondary' : 'ghost' });
  }
}

function mostrar(id) {
  activa = id;
  pintarActiva();

  for (const pieza of piezas) pieza.destroy();
  piezas = [];

  const seccion = SECTIONS.find((s) => s.id === id);
  const nodo = contentScroll.element;
  const cuerpoNuevo = cuerpo(seccion);
  // Adoptadas DESPUES de armarlas: `cuerpo()` es quien las crea.
  for (const pieza of piezas) win?.adopt(pieza);
  nodo.replaceChildren(cuerpoNuevo);
  // Cambiar de sección arranca de arriba: si no, se entra por la mitad.
  nodo.scrollTop = 0;
}

function indice() {
  navButtons.clear();

  const botones = SECTIONS.map((seccion) => {
    const btn = new Button({
      label: t(seccion.title),
      icon: new Icon({ name: seccion.icon }),
      variant: seccion.id === activa ? 'secondary' : 'ghost',
      size: 'sm',
      block: true,
      className: 'cat-doc__navbtn',
      onClick: () => mostrar(seccion.id),
    });
    navButtons.set(seccion.id, btn);
    return btn;
  });

  const idioma = new Tabs({
    tabs: [{ id: 'es', label: 'ES' }, { id: 'en', label: 'EN' }],
    value: lang,
    size: 'sm',
    stretch: true,
    ariaLabel: 'Idioma / Language',
    onChange: (valor) => {
      lang = valor;
      guardarIdioma(valor);
      // Los rótulos del índice y el contenido, en el idioma nuevo.
      for (const seccion of SECTIONS) {
        navButtons.get(seccion.id).update({ label: t(seccion.title) });
      }
      /* setTitle y NO update: `update()` vuelve a renderizar el nodo entero, y
         reemplazar el nodo de un <dialog> ya abierto lo CIERRA — la ventana
         desaparecía al cambiar de idioma. */
      win?.setTitle(UI[lang].title);
      mostrar(activa);
    },
  });

  return new Scroll({
    tag: 'nav',
    axis: 'y',
    thickness: 'thin',
    ariaLabel: UI[lang].nav,
    width: 'var(--cat-doc-nav-w)',
    padding: 'sm',
    className: 'cat-doc__nav',
    content: new Container({
      layout: 'stack', gap: 'xs', variant: 'ghost', padding: 'none',
      items: 'stretch', fullWidth: true,
      content: [idioma, new Separator({ space: 'xs' }), ...botones],
    }),
  });
}

// -------------------------------------------------------------- la ventana --

/**
 * Abre la documentación. Si ya está abierta no hace nada: dos modales
 * encimados no le sirven a nadie.
 */
export function openDoc() {
  if (win) return win;

  contentScroll = new Scroll({
    axis: 'y',
    grow: true,
    padding: 'lg',
    ariaLabel: UI[lang].title,
    className: 'cat-doc__content',
  });

  const nav = indice();

  /* El contenido va en el CONSTRUCTOR y no con un `update()` después: update
     vuelve a renderizar el nodo raíz, y reemplazar el nodo de un <dialog> lo
     sacaría de la capa superior. */
  win = new Window({
    title: UI[lang].title,
    icon: new Icon({ name: 'book' }),
    modal: true,
    /* Solo la X. Minimizar y maximizar no significan nada acá: la ventana no
       vive en un escritorio, vive encima del catálogo. */
    controls: ['close'],
    draggable: false,
    width: 'var(--cat-doc-w)',
    height: 'var(--cat-doc-h)',
    className: 'cat-doc',
    ariaLabel: UI[lang].title,
    content: new Container({
      layout: 'row', wrap: false, gap: 'none',
      variant: 'ghost', padding: 'none',
      height: '100%', fullWidth: true, items: 'stretch',
      content: [nav, new Separator({ orientation: 'vertical', space: 'none' }), contentScroll],
    }),
  });

  /* Adoptados DESPUES de existir la ventana: así mueren con ella y entran
     escalonados junto a ella. */
  win.adopt(nav);
  win.adopt(contentScroll);
  for (const btn of navButtons.values()) win.adopt(btn);

  win.on('close', cerrar);
  win.mount(document.body);
  mostrar(activa);
  return win;
}

/** Cierra con la animación de salida del pack, y recién ahí se va. */
async function cerrar() {
  if (!win) return;
  const saliendo = win;
  win = null;
  navButtons.clear();
  contentScroll = null;
  piezas = [];
  clearTimeout(avisoTimer);
  await saliendo.leave();
}

/** El botón que la abre. Lo usa el panel de ajustes del catálogo. */
export function docButton() {
  return new Button({
    label: 'DOC',
    icon: new Icon({ name: 'book' }),
    variant: 'secondary',
    block: true,
    ariaLabel: 'Documentación',
    dataset: { doc: '' },
    onClick: () => openDoc(),
  });
}
