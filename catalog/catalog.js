/* ===========================================================================
   Catálogo — DOS COLUMNAS, cada una con su propio scroll.
   Está construido con las MISMAS clases que muestra: cada bloque de acá es un
   Container o un Separator reales. Si una clase se rompe, se rompe el visor.
   No forma parte de la librería: `src/` no importa nada de esta carpeta.
   =========================================================================== */

import {
  Container, Separator, Scroll, Select, Slider, ColorPicker, Button, Icon, Toggle,
  config, configure, resetConfig, packSettings, onConfigChange, el,
} from '../src/index.js';
import { packList, packControls, packStylesheetReady } from '../src/styles/packs/index.js';
import { demos } from './demos/index.js';
import { keepalive } from './keepalive.js';
import { docButton } from './doc.js';
import { pintarMarco } from './frame.js';

const app = document.getElementById('app');

// ------------------------------------------------------------- controles ---
/* Ya son clases de la libreria: el catalogo solo las instancia. */

/* Los settings se LLAMAN con guion bajo —`BRAND_COLOR`, `GRID_OPACITY`— porque
   son claves de una API, y ahi el guion bajo separa palabras sin ambiguedad.
   Pero eso es el nombre interno: en pantalla es ruido. Se muestra con espacios.

   La traduccion vive ACA, en el unico lugar que dibuja un rotulo de setting, y
   no en cada pack: renombrar una perilla no deberia obligar a acordarse de
   escribir su version linda en otro lado. */
const rotulo = (clave) => String(clave).replace(/_/g, ' ');

const field = (label, control, extra = {}) =>
  new Container({
    layout: 'stack', gap: 'xs', variant: 'ghost', padding: 'none',
    align: 'start', items: 'stretch',
    content: [el('span', { class: 'cat-label', text: rotulo(label) }), control],
    ...extra,
  });

// --------------------------------------------------------------- bloques ---

const title = (text, level = 'h2') => el(level, { class: `cat-title cat-title--${level}`, text });

/**
 * Un ejemplo: el render, con título chico solo si aporta algo.
 * Sin caja: lo que separa es el Separator.
 */
function example({ title: name, render }) {
  let body;
  try {
    body = render();
  } catch (error) {
    console.error(error);
    body = el('pre', { class: 'cat-error', text: String(error) });
  }
  return name ? [el('h3', { class: 'cat-title cat-title--h3', text: name }), body] : [body];
}

/**
 * Una sección: título + ejemplos.
 * Sin separadores adentro: todo lo de una sección es la misma categoría.
 * El Separator solo corta ENTRE componentes.
 */
function section(demo) {
  const body = demo.examples.flatMap(example);

  return new Container({
    tag: 'section', layout: 'stack', gap: 'md', variant: 'ghost', padding: 'none',
    align: 'start', items: 'stretch', fullWidth: true,
    dataset: { section: demo.id },
    content: [title(demo.name), ...body],
  });
}

// ------------------------------------------------------------------ página ---

let packSelect;
/** Los controles de las perillas del pack activo, por clave. */
let knobs = new Map();

/**
 * Un solo contenedor: arriba el selector de estilo a ancho completo, un corte,
 * y debajo las perillas DE ese estilo.
 */
function controlPanel() {
  const current = packSettings();

  packSelect = new Select({
    options: packList().map((p) => ({ value: p.id, label: p.label })),
    value: config.STYLE_PACK,
    ariaLabel: 'Paquete de estilo',
    // Remonta para que se vean las animaciones de entrada del pack nuevo.
    // `remount()` espera a que cargue la hoja antes de tocar el DOM, así que
    // para cuando destruye este Select su propio evento ya terminó.
    onChange: (STYLE_PACK) => {
      configure({ STYLE_PACK });
      remount();
    },
  });

  /* Las perillas se ARMAN LEYENDO EL PACK, no están escritas acá.
     Cada pack declara sus settings y cómo se muestran (`controls` en su
     pack.js), así que uno con perillas propias —Blueprint tiene GRID_OPACITY
     y GRID_SCALE— aparece solo, sin tocar el catálogo. */
  knobs = new Map();
  const knobFields = Object.entries(packControls(config.STYLE_PACK)).map(([key, meta]) => {
    const onChange = (value) => configure({ [key]: value });
    let control;

    if (meta.kind === 'color') {
      control = new ColorPicker({ value: current[key], uppercase: true, ariaLabel: key, onChange });
    } else if (meta.kind === 'switch') {
      /* THEME entra por acá: es un setting del pack como cualquier otro, así
         que el catálogo no sabe que existe — le arma un control porque el pack
         lo declaró, igual que con GRID_SCALE o BOUNCE.

         El interruptor va flanqueado por los dos iconos, que son los que
         dicen qué significa cada lado. Es un `Container` con un `Toggle` y dos
         `Icon` adentro: tres clases de la librería, sin nada a medida.

         ⛔ NO REMONTA, a diferencia del selector de estilo. Cambiar de tema
         cambia todos los tokens, sí, pero son VARIABLES CSS: se actualizan en
         el lugar, sin volver a crear un solo nodo. Remontar ahí no aportaba
         nada y encima repetía la animación de entrada de la página entera cada
         vez que tocabas el interruptor — que es justo lo que no querés cuando
         estás comparando un estilo en claro y en oscuro.

         El pack sí necesita remontar, pero por otro motivo: hay que esperar a
         que cargue su hoja de estilos. */
      const toggle = new Toggle({
        checked: current[key] === meta.on.value,
        ariaLabel: key,
        onChange: (activo) => onChange(activo ? meta.on.value : meta.off.value),
      });

      control = new Container({
        layout: 'row', gap: 'sm', variant: 'ghost', padding: 'none',
        items: 'center', justify: 'flex-start',
        content: [
          new Icon({ name: meta.off.icon, label: meta.off.label }),
          toggle,
          new Icon({ name: meta.on.icon, label: meta.on.label }),
        ],
      });

      /* En el mapa va el TOGGLE, no el envoltorio: `syncSettings()` llama a
         `.set(valor)` y el que sabe hacer eso es él. Y con un adaptador,
         porque el setting es 'dark'/'light' y el toggle piensa en booleanos. */
      knobs.set(key, { set: (valor) => toggle.set(valor === meta.on.value) });
      return field(key, control);
    } else {
      control = new Slider({
        min: meta.min, max: meta.max, step: meta.step, value: current[key],
        editableValue: true,
        ariaLabel: key,
        onChange,
      });
    }

    knobs.set(key, control);
    return field(key, control);
  });


  /* Repetir la entrada sin tener que cambiar de estilo y volver.
     Va para TODOS los packs y no solo para Clay: la entrada existe en los
     siete y querer verla de nuevo vale igual en Glass o en Blueprint. Hacerlo
     propio de un pack ademas obligaria al catalogo a saber de packs.

     Remonta, que es lo mismo que hace el selector de estilo: `.is-entering` la
     pone UIComponent al montar, asi que la unica forma de repetirla es volver
     a montar. `remount()` espera la hoja antes de tocar el DOM, o sea que para
     cuando destruye este boton su propio click ya termino. */
  replayButton = new Button({
    label: 'Play',
    /* El icono es un `Icon` de la librería, así que sale con el trazo del pack
       activo: fino y en punta en Blueprint, gordo y redondeado en Clay, a dos
       tintas en Riso. El botón que repite la animación muestra, de paso, otra
       pieza del estilo que se está mirando.

       Se pasa como COMPONENTE y no como `.element`: `Button` lo adopta, así
       que muere con él y entra animado con él. */
    icon: new Icon({ name: 'play' }),
    variant: 'secondary',
    ariaLabel: 'Ver la animacion de salida y la de entrada',
    onClick: () => replay(),
  });

  return new Container({
    layout: 'stack', gap: 'none', padding: 'md',
    align: 'start', items: 'stretch', fullWidth: true,
    dataset: { settings: '' },
    /* MINIMO y no alto fijo: ocupa toda la columna cuando sobra lugar, y
       crece —dejando scrollear— cuando un pack trae muchas perillas. */
    minHeight: '100%',
    content: [
      /* Arriba de todo: la documentacion. Es lo primero que alguien busca
         cuando abre esto por primera vez, asi que no va escondida abajo. */
      docButton(),

      new Separator({ space: 'sm' }),

      field('STYLE_PACK', packSelect, { fullWidth: true, dataset: { packSelector: '' } }),

      new Separator({ space: 'sm' }),

      new Container({
        layout: 'grid', columnMin: '200px', gap: 'md',
        variant: 'ghost', padding: 'none',
        align: 'start', items: 'stretch', fullWidth: true,
        dataset: { packKnobs: '' },
        content: [
          ...knobFields,
              field('ENTRADA', replayButton),
        ],
      }),
    ],
  });
}

/** Vuelve a poner en los controles los valores vigentes del pack activo. */
function syncSettings() {
  const current = packSettings();
  for (const [key, control] of knobs) control.set(current[key]);
  packSelect.set(config.STYLE_PACK);
}

/** La columna de componentes: todas las secciones, separadas entre si. */
function buildSections() {
  return new Container({
    layout: 'stack', gap: 'none', variant: 'ghost',
    padding: 'lg', align: 'start', items: 'stretch',
    maxWidth: '1120px', marginInline: 'auto',
    // Separador ancho para pasar de un componente a otro.
    content: demos.flatMap((demo, i) => [
      ...(i === 0 ? [] : [new Separator({ space: 'xl' })]),
      section(demo),
    ]),
  });
}

function build() {
  sections = buildSections();

  sectionsColumn = new Scroll({
    tag: 'main',
    ariaLabel: 'Componentes',
    height: '100dvh',
    /* `grow` y no un ancho: se queda con lo que sobre después del panel, sea
       cual sea el ancho de la ventana. */
    grow: true,
    content: sections,
  });

  /* Dos columnas, cada una con SU scroll. El panel de settings tiene ancho
     fijo y se queda quieto; las secciones scrollean al lado sin arrastrarlo.

     Las dos regiones son `Scroll` de verdad, no divs con overflow: además de
     la barra del pack traen el rol y el foco de teclado que una región
     scrolleable necesita. */
  return new Container({
    tag: 'div', layout: 'row', wrap: false, gap: 'none',
    variant: 'ghost', padding: 'none',
    height: '100dvh', fullWidth: true, items: 'stretch', justify: 'flex-start',
    content: [
      new Scroll({
        tag: 'aside',
        ariaLabel: 'Ajustes del estilo',
        height: '100dvh',
        width: 'var(--cat-panel-w)',
        /* Se reserva el lugar de la barra: si aparece y desaparece al cambiar
           de pack, el panel entero se corre unos píxeles. */
        stableGutter: true,
        /* El aire va en la COLUMNA, no en un envoltorio: así el panel no
           arranca pegado a los bordes de la página y, al mismo tiempo, puede
           seguir pidiendo `minHeight: 100%` — un envoltorio en el medio le
           cortaría la cadena de altura. */
        padding: 'sm',
        content: controlPanel(),
      }),

      new Separator({ orientation: 'vertical', space: 'none' }),

      sectionsColumn,
    ],
  });
}

// ---------------------------------------------------------------- arranque ---

let page = null;
/** La columna de componentes y su contenido, para poder repetirla sola. */
let sectionsColumn = null;
let sections = null;
/* Candado del boton de Play: mientras una pasada corre, no arranca otra. */
let reproduciendo = false;
/* El boton mismo, para poder apagarlo mientras corre. Lo arma `controlPanel()`. */
let replayButton = null;

/* Se espera la hoja del pack ANTES de montar. Si no, las clases de entrada se
   aplican cuando todavia no hay ninguna animacion definida — no se ve nada. */
await packStylesheetReady(config.STYLE_PACK);
page = build();
page.mount(app);
pintarMarco();

/* El marco de la ventana sigue al pack y al tema. Va con `onConfigChange` y no
   pegado a cada perilla porque lo que lo cambia son VARIAS: el pack entero, el
   tema, y hasta el color de marca — de donde salen todos los demas.

   Un cuadro de espera porque el color se LEE del DOM ya pintado: preguntarselo
   en el mismo cuadro en que cambio devuelve el anterior. */
onConfigChange(() => {
  /* Un cuadro de espera y no una llamada directa: el color se LEE del DOM ya
     pintado, y preguntarlo en el mismo cuadro en que cambio devuelve el
     anterior. El respaldo con `setTimeout` es para un entorno sin cuadros —un
     render de prueba—: teñir el marco no puede ser motivo para que el catalogo
     no arranque. */
  const proximoCuadro = globalThis.requestAnimationFrame ?? ((fn) => setTimeout(fn, 0));
  proximoCuadro(pintarMarco);
});

/**
 * Vuelve a montar la página entera, SIN despedida.
 *
 * Es lo que corresponde al cambiar de estilo: la página que está puesta es de
 * otro pack, y hacerle la animación de salida DE ESE pack antes de traer la
 * del nuevo mezcla dos estéticas en la misma transición.
 */
async function remount() {
  await packStylesheetReady(config.STYLE_PACK);
  page.destroy();
  page = build();
  page.mount(app);
  pintarMarco();
}

/**
 * SALIDA y después ENTRADA, solo de la columna de componentes.
 *
 * Es lo que hace el botón Play, y existe porque las animaciones de salida no
 * se ven en ningún otro lado. Cada pack define las suyas para los dieciséis
 * componentes —hay un guard que lo verifica— y si no fuera por acá quedarían
 * solo declaradas: `destroy()` es inmediato y cambiar de estilo no despide
 * nada.
 *
 * ⛔ EL PANEL DE AJUSTES NO ENTRA. Dos razones, y las dos bastan:
 *   · No es lo que se está mirando. Repetir la animación es para ver los
 *     componentes, y que los controles se vayan y vuelvan es ruido.
 *   · El botón que dispara esto VIVE en ese panel. Despedir el panel entero
 *     era destruir el botón a mitad de su propio click.
 *
 * `leave()` devuelve una promesa que resuelve cuando termino de animarse toda
 * la rama, y recién ahí destruye. Así que esperar acá alcanza para que las dos
 * animaciones no se pisen.
 */
async function replay() {
  /* ⛔ UNA POR VEZ, Y EL BOTON SE APAGA MIENTRAS TANTO.
     Esto es `async`: cada click arrancaba otra pasada encima de la anterior.
     La segunda le pedia `leave()` a una columna que ya se estaba yendo, y
     mientras tanto `sections` se reasignaba, asi que la primera terminaba
     montando sobre algo que ya no era suyo. Apretarlo a repeticion dejaba el
     catalogo vacio y el boton sin efecto para siempre.

     El candado va con la bandera Y con `disabled`: la bandera es la que
     garantiza que no entren dos, y apagar el boton es para que se VEA que no
     hay que insistir. */
  if (reproduciendo) return;
  reproduciendo = true;
  replayButton.update({ disabled: true });

  try {
    await packStylesheetReady(config.STYLE_PACK);
    await sections.leave();

    sections = buildSections();
    /* Se vuelve a adoptar para que siga muriendo con su columna. `adopt()` saca
       de la lista al que se acaba de ir, así que no se acumulan cadáveres. */
    sectionsColumn.adopt(sections);
    sections.mount(sectionsColumn.element);

    /* Y se espera a que la entrada termine DE VERDAD, hasta el ultimo hijo
       escalonado: si se soltara el candado al montar, el segundo click cortaria
       una animacion que todavia se esta viendo. */
    await sections.whenEntered();
  } finally {
    reproduciendo = false;
    replayButton.update({ disabled: false });
  }
}

// Para volver a la firma del pack desde la consola: resetPack()
window.resetPack = () => { resetConfig(); syncSettings(); };

/* Le avisa al servidor de CATALOG.exe que todavia hay alguien mirando. Contra
   cualquier otro servidor se apaga solo. Ver catalog/keepalive.js. */
keepalive();
