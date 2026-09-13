/* ===========================================================================
   Documentación de la librería — CONTENIDO.

   Los textos viven separados del render a propósito: el cambio de idioma es
   entonces elegir una clave, no volver a armar la página.

   Cada bloque es un objeto con UNA sola clave, que dice qué es:
     { h }     subtítulo
     { p }     párrafo
     { ul }    lista
     { code }  ejemplo de código (líneas sueltas)
     { table } tabla de referencia

   Lo que se traduce lleva `{ es, en }`. EL CÓDIGO NO SE TRADUCE: un ejemplo es
   el mismo en los dos idiomas, y tener dos copias del mismo snippet es la
   forma más segura de que una de las dos quede vieja.
   =========================================================================== */

export const UI = {
  es: {
    title: 'Documentación',
    nav: 'Secciones',
    close: 'Cerrar',
    copy: 'Copiar el ejemplo',
    copied: 'Copiado',
  },
  en: {
    title: 'Documentation',
    nav: 'Sections',
    close: 'Close',
    copy: 'Copy the example',
    copied: 'Copied',
  },
};

/** Atajo para una fila de tabla: nombre, valores y qué hace en los dos idiomas. */
const row = (name, values, es, en) => [name, values, { es, en }];

export const SECTIONS = [
  // =========================================================================
  {
    id: 'intro',
    icon: 'info',
    title: { es: 'Qué es', en: 'What it is' },
    blocks: [
      { p: {
        es: 'Una librería de componentes de interfaz en JavaScript puro: sin dependencias, sin paso de compilación y sin framework. Se copia la carpeta <code>src/</code> a cualquier proyecto y funciona.',
        en: 'A UI component library in plain JavaScript: no dependencies, no build step, no framework. Copy the <code>src/</code> folder into any project and it works.',
      } },
      { h: { es: 'La idea central', en: 'The core idea' } },
      { p: {
        es: 'Todo está partido en dos mitades que no se tocan entre sí. La <b>mecánica</b> es la lógica y la caja de cada componente: qué hace, qué eventos emite, cómo se navega con el teclado. La <b>piel</b> es absolutamente toda la apariencia, y vive en un <i>pack</i>.',
        en: 'Everything is split into two halves that never touch. The <b>mechanics</b> are each component logic and box: what it does, which events it emits, how keyboard navigation works. The <b>skin</b> is absolutely all of the appearance, and it lives in a <i>pack</i>.',
      } },
      { p: {
        es: 'Cambiar de pack reestiliza la aplicación entera sin tocar una sola línea de código. No es un tema de colores: cambian las sombras, los bordes, las tipografías, las texturas y hasta cómo entra y sale cada componente de la pantalla.',
        en: 'Switching packs restyles the whole application without touching a single line of code. It is not about colors: shadows, borders, typography, textures and even how each component enters and leaves the screen all change.',
      } },
      { h: { es: 'Qué NO es', en: 'What it is NOT' } },
      { ul: {
        es: [
          'No es un framework: no maneja rutas, ni estado global, ni datos.',
          'No trae build. No hay que compilar nada, ni configurar nada.',
          'No carga recursos externos: ni fuentes, ni CDNs, ni imágenes.',
        ],
        en: [
          'Not a framework: it handles no routing, no global state, no data.',
          'No build. Nothing to compile, nothing to configure.',
          'It loads no external resources: no fonts, no CDNs, no images.',
        ],
      } },
    ],
  },

  // =========================================================================
  {
    id: 'install',
    icon: 'download',
    title: { es: 'Instalación', en: 'Install' },
    blocks: [
      { p: {
        es: 'Copiá la carpeta <code>src/</code> dentro de tu proyecto. Eso es todo lo que hay que llevarse: no depende de nada de lo que quede afuera.',
        en: 'Copy the <code>src/</code> folder into your project. That is everything you need to take: it depends on nothing left behind.',
      } },
      { h: { es: '1. Los estilos', en: '1. The styles' } },
      { p: {
        es: 'Hacen falta tres hojas, y el orden importa: primero la base, después la mecánica y al final el pack, que es el que manda en la apariencia.',
        en: 'Three stylesheets are needed, and order matters: base first, then mechanics, and the pack last — it is the one that rules appearance.',
      } },
      { code: [
        '<link rel="stylesheet" href="./src/styles/base.css">',
        '<link rel="stylesheet" href="./src/styles/structure.css">',
        '<link rel="stylesheet" href="./src/styles/packs/default/pack.css">',
      ] },
      { h: { es: '2. El módulo', en: '2. The module' } },
      { code: [
        '<script type="module">',
        "  import { Button, configure } from './src/index.js';",
        '',
        "  configure({ STYLE_PACK: 'default' });",
        "  new Button({ label: 'Hola' }).mount(document.body);",
        '</script>',
      ] },
      { h: { es: '⚠ Hace falta un servidor', en: '⚠ A server is required' } },
      { p: {
        es: 'Los ES Modules no cargan desde <code>file://</code>. Cualquier servidor estático sirve; este proyecto trae uno sin dependencias.',
        en: 'ES Modules do not load over <code>file://</code>. Any static server works; this project ships one with no dependencies.',
      } },
      { code: ['node serve.mjs', '# -> http://localhost:5173'] },
    ],
  },

  // =========================================================================
  {
    id: 'packs',
    icon: 'image',
    title: { es: 'Estilos (packs)', en: 'Styles (packs)' },
    blocks: [
      { p: {
        es: 'Un pack es una estética completa: un CSS más sus valores. Hoy hay once.',
        en: 'A pack is a complete aesthetic: one CSS file plus its values. There are eleven today.',
      } },
      { ul: {
        es: [
          '<b>default</b> — interfaz sobria, de propósito general.',
          '<b>glass</b> — vidrio esmerilado, con desenfoque detrás.',
          '<b>cyber</b> — neón sobre negro, con resplandor.',
          '<b>soft</b> — neumorfismo: relieve y hueco sobre una lámina.',
          '<b>blueprint</b> — plano técnico dibujado a mano sobre papel cuadriculado.',
          '<b>editorial</b> — tipográfico, con aire de publicación impresa.',
          '<b>clay</b> — plastilina: piezas blandas que se achatan al apretarlas.',
          '<b>riso</b> — risografía: tintas fluo desalineadas y trama de puntos.',
          '<b>nocturne</b> — tablero oscuro, amatista, sin bordes.',
          '<b>grunge</b> — hormigón y laca roja: el canto de cada pieza, comido.',
          '<b>minimal</b> — la interfaz de un editor de código: sobria, densa, sin blancos ni negros puros.',
        ],
        en: [
          '<b>default</b> — sober, general purpose interface.',
          '<b>glass</b> — frosted glass, with blur behind it.',
          '<b>cyber</b> — neon over black, with glow.',
          '<b>soft</b> — neumorphism: relief and hollow on a sheet.',
          '<b>blueprint</b> — hand drawn technical plan on gridded paper.',
          '<b>editorial</b> — typographic, with a printed publication feel.',
          '<b>clay</b> — modelling clay: soft pieces that squash when pressed.',
          '<b>riso</b> — risograph: misregistered fluo inks and halftone.',
          '<b>nocturne</b> — dark dashboard, amethyst, borderless.',
          '<b>grunge</b> — concrete and red lacquer: every piece with its edge eaten away.',
          '<b>minimal</b> — a code editor UI: sober, dense, no pure black or white.',
        ],
      } },
      { h: { es: 'Cambiar de pack en vivo', en: 'Switching packs live' } },
      { p: {
        es: '<code>configure()</code> enlaza la hoja del pack y saca la anterior. Como la hoja se baja por JS, conviene esperarla antes de montar: si no, los componentes se montan cuando todavía no existe ninguna animación definida y la entrada no se ve.',
        en: '<code>configure()</code> links the pack stylesheet and drops the previous one. Since the sheet is fetched by JS, wait for it before mounting: otherwise components mount when no animation exists yet and the entrance is not seen.',
      } },
      { code: [
        "import { configure } from './src/index.js';",
        "import { packStylesheetReady } from './src/styles/packs/index.js';",
        '',
        "configure({ STYLE_PACK: 'blueprint' });",
        "await packStylesheetReady('blueprint');",
        '// recién ahora, montar',
      ] },
      { h: { es: 'Los settings son POR PACK', en: 'Settings are PER PACK' } },
      { p: {
        es: 'Cada pack trae sus propias perillas, y cambiar de pack trae los valores de ese pack. Las tres que tienen todos son <code>THEME</code>, <code>BRAND_COLOR</code> y <code>ROUNDNESS</code>.',
        en: 'Each pack brings its own knobs, and switching packs brings that pack values. The three every pack has are <code>THEME</code>, <code>BRAND_COLOR</code> and <code>ROUNDNESS</code>.',
      } },
      { table: {
        head: { es: ['Setting', 'Valores', 'Qué hace'], en: ['Setting', 'Values', 'What it does'] },
        rows: [
          row('THEME', "'light' | 'dark'",
            'Claro u oscuro. Es del PACK, no del documento: cada estética nace clara u oscura.',
            'Light or dark. It belongs to the PACK, not the document: each aesthetic is born light or dark.'),
          row('BRAND_COLOR', '#rrggbb',
            'El ÚNICO color declarado. Todos los demás, grises incluidos, se derivan de él.',
            'The ONLY declared color. Every other one, greys included, is derived from it.'),
          row('ROUNDNESS', '0 – 3',
            'Multiplica la escala de radios. En 0 todo queda a escuadra.',
            'Multiplies the radius scale. At 0 everything is square.'),
        ],
      } },
      { p: {
        es: 'Un pack puede además declarar perillas propias: <code>blueprint</code> tiene <code>GRID_OPACITY</code> y <code>GRID_SCALE</code>; <code>riso</code> tiene <code>MISREGISTER</code>, <code>INK_SHIFT</code> y <code>HALFTONE</code>; <code>grunge</code> tiene <code>WEAR</code>, <code>GRAIN</code> y <code>FOIL</code>; <code>minimal</code> tiene <code>CONTRAST</code> y <code>DENSITY</code>. También puede FIJAR una: blueprint clava <code>ROUNDNESS</code> en 0, porque un plano con las esquinas redondeadas deja de leerse como un plano.',
        en: 'A pack may also declare its own knobs: <code>blueprint</code> has <code>GRID_OPACITY</code> and <code>GRID_SCALE</code>; <code>riso</code> has <code>MISREGISTER</code>, <code>INK_SHIFT</code> and <code>HALFTONE</code>; <code>grunge</code> has <code>WEAR</code>, <code>GRAIN</code> and <code>FOIL</code>; <code>minimal</code> has <code>CONTRAST</code> and <code>DENSITY</code>. It can also PIN one: blueprint fixes <code>ROUNDNESS</code> at 0, because a plan with rounded corners stops reading as a plan.',
      } },
      { code: [
        "import { configurePack, packSettings, resetConfig } from './src/index.js';",
        '',
        "configurePack({ THEME: 'dark', BRAND_COLOR: '#e8615a' });",
        'packSettings();   // lo que tiene puesto el pack activo',
        'resetConfig();    // vuelve a la firma del pack',
      ] },
      { h: { es: 'Un solo color', en: 'A single color' } },
      { p: {
        es: 'Ningún pack declara más de un color. Todo lo demás sale de <code>--ui-brand</code> con color relativo, así que un brand cálido tiñe los grises hacia el cálido y un brand apagado apaga la interfaz entera junta.',
        en: 'No pack declares more than one color. Everything else derives from <code>--ui-brand</code> using relative color, so a warm brand biases the greys warm and a muted brand mutes the whole interface at once.',
      } },
      { code: [
        '--ui-neutral-600: hsl(from var(--ui-brand) h calc(s * 0.16) 37%);',
        '--ui-line:        rgb(from var(--ui-text) r g b / 0.12);',
      ] },
    ],
  },

  // =========================================================================
  {
    id: 'basics',
    icon: 'play',
    title: { es: 'Uso básico', en: 'Basic usage' },
    blocks: [
      { p: {
        es: 'Todos los componentes se usan igual: se crean con un objeto de opciones, se montan, y después se actualizan o se destruyen.',
        en: 'Every component works the same: create it with an options object, mount it, then update or destroy it.',
      } },
      { code: [
        "import { Button } from './src/index.js';",
        '',
        'const btn = new Button({',
        "  label: 'Guardar',",
        "  variant: 'primary',",
        "  onClick: () => console.log('click'),",
        '});',
        '',
        "btn.mount('#app');        // selector o nodo",
        'btn.update({ loading: true });',
        'await btn.leave();        // sale animado y se va',
      ] },
      { h: { es: 'La API que comparten todos', en: 'The API they all share' } },
      { table: {
        head: { es: ['Miembro', 'Devuelve', 'Qué hace'], en: ['Member', 'Returns', 'What it does'] },
        rows: [
          row('element', 'Node', 'El nodo raíz. Se crea la primera vez que se pide.', 'The root node. Created the first time it is asked for.'),
          row('mount(target)', 'this', 'Lo inserta y dispara la animación de entrada.', 'Inserts it and triggers the enter animation.'),
          row('update(patch)', 'this', 'Cambia opciones y redibuja lo mínimo.', 'Changes options and redraws the minimum.'),
          row('leave()', 'Promise', 'Anima la salida y RECIÉN ahí saca el nodo.', 'Animates the exit and only then removes the node.'),
          row('unmount()', 'this', 'Lo saca del DOM en el acto, sin animar.', 'Removes it from the DOM at once, without animating.'),
          row('destroy()', 'void', 'Lo saca y libera listeners y subcomponentes.', 'Removes it and releases listeners and subcomponents.'),
          row('on(evt, fn)', 'off()', 'Escucha un evento del componente.', 'Listens to a component event.'),
          row('adopt(hijo)', 'hijo', 'Lo hace morir con el padre y entrar junto a él.', 'Makes it die with the parent and enter along with it.'),
          row('option(key)', 'any', 'Lee una opción actual.', 'Reads a current option.'),
        ],
      } },
      { h: { es: 'Eventos', en: 'Events' } },
      { p: {
        es: 'Hay dos formas y son equivalentes: la opción <code>onAlgo</code> al crear, o <code>on()</code> después. La opción es más corta; <code>on()</code> sirve cuando hay varios interesados.',
        en: 'There are two equivalent ways: the <code>onSomething</code> option at creation, or <code>on()</code> afterwards. The option is shorter; <code>on()</code> is for when several parties care.',
      } },
      { code: [
        'const sl = new Slider({ min: 0, max: 100, onChange: (v) => draw(v) });',
        '',
        "const off = sl.on('change', ({ value, previous }) => { /* ... */ });",
        'off();   // deja de escuchar',
      ] },
      { h: { es: '⚠ Limpieza', en: '⚠ Cleanup' } },
      { p: {
        es: 'Si un componente vive adentro de otro, adoptalo con <code>adopt()</code>: así muere con su padre y entra animado junto a él. Los listeners de DOM van siempre con <code>listen()</code>, que los libera solo.',
        en: 'If a component lives inside another, adopt it with <code>adopt()</code>: it then dies with its parent and enters animated along with it. DOM listeners always go through <code>listen()</code>, which releases them for you.',
      } },
    ],
  },

  // =========================================================================
  {
    id: 'components',
    icon: 'grid',
    title: { es: 'Componentes', en: 'Components' },
    blocks: [
      { p: {
        es: 'Dieciséis clases. Todas aceptan <code>className</code> y <code>dataset</code> además de lo que se lista acá. Casi todas aceptan también <code>ariaLabel</code>; las dos excepciones son <code>Icon</code> y <code>Separator</code>, que usan <code>label</code> — en el Icon ese rótulo además decide si es decorativo o no.',
        en: 'Sixteen classes. All of them accept <code>className</code> and <code>dataset</code> on top of what is listed here. Most also accept <code>ariaLabel</code>; the two exceptions are <code>Icon</code> and <code>Separator</code>, which use <code>label</code> — on Icon that label also decides whether it is decorative.',
      } },

      { h: { es: 'Button', en: 'Button' } },
      { table: {
        head: { es: ['Opción', 'Valores', 'Qué hace'], en: ['Option', 'Values', 'What it does'] },
        rows: [
          row('variant', "'primary' | 'secondary' | 'ghost' | 'danger'", 'El peso del botón.', 'The weight of the button.'),
          row('size', "'sm' | 'md' | 'lg'", 'Tamaño.', 'Size.'),
          row('icon', 'Icon | Node | string', 'Icono al lado del rótulo.', 'Icon next to the label.'),
          row('iconPosition', "'start' | 'end'", 'De qué lado va el icono.', 'Which side the icon goes on.'),
          row('loading', 'boolean', 'Muestra un spinner y bloquea el click.', 'Shows a spinner and blocks clicking.'),
          row('block', 'boolean', 'Ocupa todo el ancho disponible.', 'Takes the full available width.'),
          row('href', 'string', 'Lo dibuja como enlace en vez de botón.', 'Renders it as a link instead of a button.'),
        ],
      } },
      { code: ["new Button({ label: 'Guardar', variant: 'primary', icon: new Icon({ name: 'save' }) })"] },

      { h: { es: 'Icon', en: 'Icon' } },
      { p: {
        es: '54 iconos de trazo sobre una grilla de 24. <code>Icon.add(nombre, path)</code> suma los tuyos, y la opción <code>path</code> dibuja uno suelto sin registrarlo.',
        en: '54 stroke icons on a 24 grid. <code>Icon.add(name, path)</code> adds your own, and the <code>path</code> option draws a one-off without registering it.',
      } },
      { code: [
        "new Icon({ name: 'download', size: 'md' })",
        "new Icon({ name: 'trash', label: 'Borrar' })   // deja de ser decorativo",
        "Icon.add('logo', 'M4 4h16v16H4z');",
      ] },

      { h: { es: 'TextField', en: 'TextField' } },
      { table: {
        head: { es: ['Opción', 'Valores', 'Qué hace'], en: ['Option', 'Values', 'What it does'] },
        rows: [
          row('type', "'text' | 'password' | 'email' …", 'Tipo del campo.', 'Field type.'),
          row('multiline', 'boolean', 'Lo convierte en área de texto.', 'Turns it into a textarea.'),
          row('rows', 'number', 'Alto, cuando es multilínea.', 'Height, when multiline.'),
          row('maxLength', 'number', 'Tope de caracteres.', 'Character cap.'),
          row('onInput / onChange', 'fn', 'En cada tecla / al confirmar.', 'On each keystroke / on commit.'),
        ],
      } },

      { h: { es: 'Spinner y Slider', en: 'Spinner and Slider' } },
      { p: {
        es: 'El <b>Spinner</b> es un campo numérico al estilo Blender: se tipea, se arrastra en vertical, se scrollea encima y responde a las flechas. SHIFT lo mueve grueso y CTRL fino. Reserva su ancho para el número MÁS LARGO que puede mostrar, así no se ensancha mientras lo usás.',
        en: 'The <b>Spinner</b> is a Blender style numeric field: type it, drag vertically, scroll over it, or use the arrows. SHIFT steps coarse and CTRL fine. It reserves width for the LONGEST number it can show, so it never widens while you use it.',
      } },
      { table: {
        head: { es: ['Opción', 'Valores', 'Qué hace'], en: ['Option', 'Values', 'What it does'] },
        rows: [
          row('type', "'float' | 'int'", 'Con int no hay decimales.', 'With int there are no decimals.'),
          row('min / max / step', 'number', 'Rango y paso base.', 'Range and base step.'),
          row('shiftMultiplier', 'number', 'Paso con SHIFT (10 por defecto).', 'Step with SHIFT (10 by default).'),
          row('ctrlMultiplier', 'number', 'Paso con CTRL (0.1 por defecto).', 'Step with CTRL (0.1 by default).'),
          row('sensitivity', 'number', 'Píxeles de arrastre por paso.', 'Drag pixels per step.'),
          row('editableValue', 'boolean', 'Slider: el número al lado es un Spinner.', 'Slider: the number beside it is a Spinner.'),
        ],
      } },
      { code: [
        'new Slider({ min: 0, max: 1, step: 0.01, editableValue: true, onChange: (v) => draw(v) })',
      ] },

      { h: { es: 'Select y ColorPicker', en: 'Select and ColorPicker' } },
      { p: {
        es: 'El <b>Select</b> no usa <code>&lt;select&gt;</code> nativo: es un <code>combobox</code> con roles ARIA, navegación con flechas y búsqueda por tecleo. Las opciones son strings o <code>{ value, label, disabled }</code>.',
        en: 'The <b>Select</b> does not use a native <code>&lt;select&gt;</code>: it is an ARIA <code>combobox</code> with arrow navigation and type ahead. Options are strings or <code>{ value, label, disabled }</code>.',
      } },
      { code: [
        "new Select({ options: ['uno', 'dos'], value: 'uno', onChange: (v) => set(v) })",
        "new ColorPicker({ value: '#3b82f6', onChange: (hex) => paint(hex) })",
      ] },

      { h: { es: 'Toggle, Checkbox y RadioGroup', en: 'Toggle, Checkbox and RadioGroup' } },
      { p: {
        es: 'El Checkbox además tiene <code>indeterminate</code>. El RadioGroup toma <code>options</code> y <code>orientation</code>.',
        en: 'Checkbox also has <code>indeterminate</code>. RadioGroup takes <code>options</code> and <code>orientation</code>.',
      } },
      { code: [
        "new Toggle({ label: 'Activo', checked: true, onChange: (on) => set(on) })",
        "new RadioGroup({ options: ['a', 'b'], orientation: 'vertical' })",
      ] },

      { h: { es: 'Progress', en: 'Progress' } },
      { p: {
        es: 'Dos formas en una sola clase: barra o anillo. Con <code>indeterminate</code> no muestra valor y se anima sola.',
        en: 'Two shapes in one class: bar or ring. With <code>indeterminate</code> it shows no value and animates on its own.',
      } },
      { code: [
        "new Progress({ shape: 'linear', value: 40, showValue: true })",
        "new Progress({ shape: 'radial', value: 68, valueInside: true })",
        "new Progress({ shape: 'linear', indeterminate: true })",
      ] },

      { h: { es: 'Tabs', en: 'Tabs' } },
      { p: {
        es: 'Cada pestaña es <code>{ id, label, content, disabled }</code>. El <code>id</code> es lo que viaja en <code>value</code> y en el callback.',
        en: 'Each tab is <code>{ id, label, content, disabled }</code>. The <code>id</code> is what travels in <code>value</code> and in the callback.',
      } },
      { code: [
        'new Tabs({',
        '  tabs: [',
        "    { id: 'a', label: 'General', content: panelA },",
        "    { id: 'b', label: 'Avanzado', content: panelB },",
        '  ],',
        "  value: 'a',",
        '  onChange: (id) => show(id),',
        '})',
      ] },

      { h: { es: 'Window', en: 'Window' } },
      { p: {
        es: 'Un marco de ventana propio, para cuando se esconde el del sistema (Electron con <code>frame: false</code>). <b>No cierra ni mueve nada por su cuenta</b>: emite el evento y el host decide.',
        en: 'Your own window frame, for when the native one is hidden (Electron with <code>frame: false</code>). <b>It closes and moves nothing by itself</b>: it emits the event and the host decides.',
      } },
      { table: {
        head: { es: ['Opción', 'Valores', 'Qué hace'], en: ['Option', 'Values', 'What it does'] },
        rows: [
          row('controls', "['minimize','maximize','close']", 'Qué botones lleva la barra.', 'Which buttons the bar carries.'),
          row('modal', 'boolean', 'Centrada, con el fondo oscurecido y por encima de todo.', 'Centered, with the background dimmed and above everything.'),
          row('draggable', 'boolean', 'La barra es zona de arrastre del sistema.', 'The bar is an OS drag region.'),
          row('maximized', 'boolean', 'Cambia el glifo del botón del medio.', 'Changes the middle button glyph.'),
        ],
      } },
      { p: {
        es: 'Esta misma documentación es un <code>Window</code> con <code>modal: true</code> y un solo control.',
        en: 'This very documentation is a <code>Window</code> with <code>modal: true</code> and a single control.',
      } },
      { code: [
        "const win = new Window({ title: 'Docs', modal: true, controls: ['close'] });",
        "win.on('close', () => win.leave());",
      ] },
    ],
  },

  // =========================================================================
  {
    id: 'layout',
    icon: 'list',
    title: { es: 'Layout', en: 'Layout' },
    blocks: [
      { p: {
        es: 'No hay componentes de layout aparte: se componen los que ya existen. Un contenedor con una grilla adentro son dos <code>Container</code>, no una clase nueva.',
        en: 'There are no separate layout components: you compose the existing ones. A container with a grid inside is two <code>Container</code> instances, not a new class.',
      } },
      { h: { es: 'Container', en: 'Container' } },
      { table: {
        head: { es: ['Opción', 'Valores', 'Qué hace'], en: ['Option', 'Values', 'What it does'] },
        rows: [
          row('variant', "'panel' | 'solid' | 'outline' | 'ghost'", 'Qué superficie es.', 'Which surface it is.'),
          row('layout', "'stack' | 'row' | 'grid'", 'Cómo acomoda lo que tiene adentro.', 'How it arranges its contents.'),
          row('gap', "'none' … 'xl'", 'Separación entre hijos.', 'Spacing between children.'),
          row('padding', "'none' … 'xl'", 'Aire interno. También por eje.', 'Inner air. Per axis too.'),
          row('columns / columnMin', 'number | CSS', 'Grilla fija o responsiva.', 'Fixed or responsive grid.'),
          row('align / justify / items', 'CSS', 'Alineación del contenido.', 'Content alignment.'),
          row('interactive', 'boolean', 'Reacciona al mouse y al foco.', 'Reacts to mouse and focus.'),
        ],
      } },
      { code: [
        'new Container({',
        "  variant: 'panel',",
        "  layout: 'grid',",
        "  columnMin: '220px',",
        "  gap: 'md',",
        "  padding: 'lg',",
        '  content: [tarjetaA, tarjetaB, tarjetaC],',
        '})',
      ] },
      { h: { es: 'Scroll', en: 'Scroll' } },
      { p: {
        es: 'Una región scrolleable de verdad: trae el rol y el foco de teclado que un <code>div</code> con <code>overflow</code> no tiene. <code>grow</code> la hace ocupar lo que sobra de un contenedor flexible.',
        en: 'A real scrollable region: it brings the role and keyboard focus a plain <code>div</code> with <code>overflow</code> does not have. <code>grow</code> makes it take the remaining space of a flex parent.',
      } },
      { code: ["new Scroll({ axis: 'y', grow: true, padding: 'md', content: lista })"] },
      { h: { es: 'Separator', en: 'Separator' } },
      { code: ["new Separator({ space: 'lg' })", "new Separator({ label: 'Ajustes', tone: 'strong' })"] },
    ],
  },

  // =========================================================================
  {
    id: 'lifecycle',
    icon: 'refresh',
    title: { es: 'Entrada y salida', en: 'Enter and leave' },
    blocks: [
      { p: {
        es: 'Todo componente entra y sale animado, en todos los packs. La mecánica decide CUÁNDO; el pack decide QUÉ SE VE. Ningún componente aparece de golpe: todos vienen de alguna forma invisible.',
        en: 'Every component enters and leaves animated, in every pack. The mechanics decide WHEN; the pack decides WHAT YOU SEE. No component ever pops in: they all come from some invisible state.',
      } },
      { ul: {
        es: [
          '<code>mount()</code> pone <code>.is-entering</code> y la saca sola cuando termina.',
          '<code>leave()</code> pone <code>.is-leaving</code>, ESPERA la animación y recién ahí saca el nodo. Devuelve una promesa.',
          '<code>destroy()</code> y <code>unmount()</code> son inmediatos a propósito.',
          'La salida siempre dura menos que la entrada: lo que aparece se presenta, lo que se va no debe hacerte esperar.',
        ],
        en: [
          '<code>mount()</code> adds <code>.is-entering</code> and removes it when done.',
          '<code>leave()</code> adds <code>.is-leaving</code>, WAITS for the animation and only then removes the node. It returns a promise.',
          '<code>destroy()</code> and <code>unmount()</code> are immediate on purpose.',
          'The exit is always shorter than the entrance: what appears introduces itself, what leaves must not make you wait.',
        ],
      } },
      { h: { es: 'Entradas escalonadas', en: 'Staggered entrances' } },
      { p: {
        es: 'Los hijos adoptados entran uno detrás del otro. El retraso crece siguiendo una curva que se aplana: con pocos elementos se nota el escalón, y con muchos el total no se dispara.',
        en: 'Adopted children enter one after another. The delay grows along a curve that flattens out: with few elements the stagger reads, and with many the total does not blow up.',
      } },
      { code: [
        "const panel = new Container({ variant: 'panel' });",
        "panel.adopt(new Button({ label: 'Uno' }));",
        "panel.adopt(new Button({ label: 'Dos' }));",
        "panel.mount('#app');   // entran escalonados",
      ] },
    ],
  },

  // =========================================================================
  {
    id: 'config',
    icon: 'settings',
    title: { es: 'Configuración', en: 'Configuration' },
    blocks: [
      { table: {
        head: { es: ['Función', 'Qué hace'], en: ['Function', 'What it does'] },
        rows: [
          ['configure(patch)', null, { es: 'Cambia el pack y/o los settings, y aplica todo.', en: 'Changes pack and/or settings, and applies everything.' }],
          ['configurePack(patch)', null, { es: 'Cambia solo los settings del pack activo.', en: 'Changes only the active pack settings.' }],
          ['packSettings()', null, { es: 'Los valores que tiene puestos el pack activo.', en: 'The values the active pack currently has.' }],
          ['packDefaults(id)', null, { es: 'La firma de un pack, sin lo que se haya tocado.', en: 'A pack signature, without any overrides.' }],
          ['resetConfig()', null, { es: 'Vuelve todo a la firma del pack.', en: 'Returns everything to the pack signature.' }],
          ['onConfigChange(fn)', null, { es: 'Avisa cada vez que algo cambia.', en: 'Fires whenever something changes.' }],
          ['readableOn(color)', null, { es: 'Devuelve el token de texto que se lee sobre ese color.', en: 'Returns the text token readable on that color.' }],
        ],
      } },
      { code: [
        "import { onConfigChange, config } from './src/index.js';",
        '',
        'onConfigChange((cfg) => console.log(cfg.STYLE_PACK));',
        'console.log(config.STYLE_PACK);',
      ] },
    ],
  },

  // =========================================================================
  {
    id: 'a11y',
    icon: 'eye',
    title: { es: 'Accesibilidad', en: 'Accessibility' },
    blocks: [
      { ul: {
        es: [
          'Cada control trae su rol y sus <code>aria-*</code>: el Select es un <code>combobox</code>, el Spinner un <code>spinbutton</code>, el Progress un <code>progressbar</code>.',
          'Todo se maneja con teclado: flechas, Home, End, Escape y búsqueda por tecleo donde corresponde.',
          'El foco se ve siempre, y el anillo sale de los tokens del pack.',
          'El contraste del texto se MIDE, no se estima: hay un test que recorre todos los packs y los dos temas.',
          'El acento tiene DOS tokens y no son intercambiables: <code>--ui-accent</code> pinta y <code>--ui-accent-text</code> se lee. Un cian saturado puede verse brillante y rendir 2.5:1 como texto.',
        ],
        en: [
          'Every control carries its role and <code>aria-*</code>: Select is a <code>combobox</code>, Spinner a <code>spinbutton</code>, Progress a <code>progressbar</code>.',
          'Everything is keyboard operable: arrows, Home, End, Escape and type ahead where it applies.',
          'Focus is always visible, and the ring comes from the pack tokens.',
          'Text contrast is MEASURED, not estimated: a test walks every pack and both themes.',
          'The accent has TWO tokens and they are not interchangeable: <code>--ui-accent</code> paints and <code>--ui-accent-text</code> is read. A saturated cyan can look bright and score 2.5:1 as text.',
        ],
      } },
      { h: { es: 'Texto no seleccionable', en: 'Text is not selectable' } },
      { p: {
        es: 'Por defecto el texto de la interfaz no se selecciona, como en una aplicación de escritorio. Lo que sí se selecciona es explícito: campos editables y cualquier cosa marcada <code>.ui-selectable</code>.',
        en: 'By default interface text is not selectable, like in a desktop application. What is selectable is explicit: editable fields and anything marked <code>.ui-selectable</code>.',
      } },
    ],
  },

  // =========================================================================
  {
    id: 'extend',
    icon: 'plus',
    title: { es: 'Extender', en: 'Extending' },
    blocks: [
      { h: { es: 'Un pack nuevo', en: 'A new pack' } },
      { ul: {
        es: [
          'Copiar <code>src/styles/packs/_template</code>.',
          'En <code>pack.js</code>: id, label y sus settings.',
          'En <code>tokens.css</code>: los valores. Ahí vive el 90%.',
          'En <code>lifecycle.css</code>: entrada Y salida de los 16 componentes.',
          'Registrarlo en <code>packs/index.js</code>.',
        ],
        en: [
          'Copy <code>src/styles/packs/_template</code>.',
          'In <code>pack.js</code>: id, label and its settings.',
          'In <code>tokens.css</code>: the values. 90% lives there.',
          'In <code>lifecycle.css</code>: enter AND leave for all 16 components.',
          'Register it in <code>packs/index.js</code>.',
        ],
      } },
      { h: { es: 'Un componente nuevo', en: 'A new component' } },
      { p: {
        es: 'Extiende <code>UIComponent</code> y define <code>static defaults</code> más <code>render()</code>. Los listeners van con <code>this.listen()</code> y los hijos con <code>this.adopt()</code>.',
        en: 'Extend <code>UIComponent</code> and define <code>static defaults</code> plus <code>render()</code>. Listeners go through <code>this.listen()</code> and children through <code>this.adopt()</code>.',
      } },
      { code: [
        "import { UIComponent, el, cx } from './src/index.js';",
        '',
        'export class Badge extends UIComponent {',
        "  static componentName = 'badge';",
        "  static defaults = { label: '', tone: 'neutral' };",
        '',
        '  render() {',
        '    const o = this.options;',
        "    return el('span', {",
        "      class: cx('ui-badge', o.tone && 'ui-badge--' + o.tone),",
        '      text: o.label,',
        '    });',
        '  }',
        '}',
      ] },
      { h: { es: 'La regla de oro', en: 'The golden rule' } },
      { p: {
        es: '<b>Nunca hardcodear.</b> Si hace falta controlar algo que la clase no expone, la solución no es forzarlo donde se usa —estilo inline, un <code>!important</code>, un wrapper ad hoc— sino agregarle el parámetro a la clase.',
        en: '<b>Never hardcode.</b> If you need to control something the class does not expose, the fix is not to force it at the call site — inline style, an <code>!important</code>, an ad hoc wrapper — but to add the parameter to the class.',
      } },
    ],
  },
];
