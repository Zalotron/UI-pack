# Web UI

Contenedor de elementos UI reutilizables. **No es una app ni un sitio web**: es una
librería de clases pensada para importar desde cualquier proyecto futuro.

- Vanilla JS (ES Modules). **Cero dependencias, cero build step.**
- Cada componente es una clase que extiende `UIComponent`.
- Estilos con design tokens (variables CSS) → theming y re-branding sin tocar componentes.
- `index.html` es solo el **catálogo de visualización**. Se puede borrar sin romper nada.

---

## Ver el catálogo

Los ES Modules no funcionan con `file://`, así que hace falta un servidor.

**Para mirarlo y nada más: doble click en `CATALOG.exe`.**

Trae el servidor adentro —no hace falta tener Node instalado— y **se abre como
una ventana**, no como una pestaña: sin barra de direcciones ni marcadores
alrededor, con su propio icono en la barra de tareas. Usa el Edge o el Chrome
que ya tengas; si no encuentra ninguno, cae al navegador de siempre.

**Se apaga solo** cuando cerrás la ventana, y no abre ninguna consola. No es un
temporizador que adivina: la página sostiene una conexión abierta mientras
existe, y el navegador la corta al cerrarla. Funciona igual si el navegador se
muere de golpe — probado.

Se abre **adelante**: Windows no deja que un proceso sin ventanas se ponga en
primer plano, así que sin ayuda la ventana aparecía debajo de la carpeta desde
la que la abriste.

**Siempre abre fresco**: el servidor prohíbe cachear y cada apertura estrena
URL, así que no hay forma de que te levante la versión de ayer.

Antes de arrancar **baja cualquier servidor anterior**: otro `CATALOG.exe`
aunque esté en otro puerto, y lo que sea que esté ocupando el suyo, incluido un
`npm run dev` olvidado. Es a propósito: si dejara al anterior sirviendo, el
catálogo quedaría en manos de algo que no sabe apagarse.

```bash
CATALOG.exe            # → http://localhost:5173
CATALOG.exe 8080       # otro puerto
CATALOG.exe --tab      # en una pestaña normal
CATALOG.exe --no-open  # solo el servidor

# recompilarlo (solo si se toca tools/catalog/main.go)
go build -ldflags "-H=windowsgui -s -w" -o CATALOG.exe ./tools/catalog
```

**Para programar: `npm run dev`.**

```bash
npm run dev            # → http://localhost:5173
node serve.mjs 8080    # otro puerto
```

Este NO se apaga solo, y es a propósito: un servidor que se muere mientras uno
programa es una molestia, no una ayuda. `serve.mjs` usa solo módulos nativos de
Node: no instala nada y anda offline.
Alternativas: extensión *Live Server* de VS Code, o `python -m http.server 5173`.

Atajos del catálogo: `/` enfoca el buscador, el botón de arriba a la derecha
cicla el tema (system → light → dark).

---

## Estructura

```
Web UI/
├── index.html                  ← catálogo (solo visualización)
├── serve.mjs                   ← dev server, módulos nativos de Node
├── package.json
├── CLAUDE.md                   ← convenciones del proyecto
│
├── src/                        ← LA LIBRERÍA. Esto es lo exportable.
│   ├── config.js               ← ⚙ CONFIG GLOBAL (BRAND_COLOR, ROUNDNESS)
│   ├── index.js                ← barrel: punto de entrada público
│   ├── core/
│   │   ├── UIComponent.js      ← clase base (ciclo de vida + eventos)
│   │   ├── EventEmitter.js
│   │   ├── dom.js              ← helpers el() / cx() / append()
│   │   └── index.js
│   ├── components/
│   │   ├── Button/             ← un componente = una carpeta
│   │   │   ├── Button.js
│   │   │   ├── Button.css
│   │   │   └── index.js
│   │   └── _template/          ← molde para copiar
│   └── styles/
│       ├── tokens.css          ← variables (seguro de importar en cualquier lado)
│       ├── base.css            ← reset opcional
│       ├── components.css      ← @import de cada CSS de componente
│       └── index.css           ← todo junto
│
└── catalog/                    ← motor del catálogo. NO es parte de la librería.
    ├── catalog.js
    ├── catalog.css
    └── demos/
        ├── index.js            ← manifiesto
        └── Button.demo.js
```

**Regla de oro:** `src/` nunca importa nada de `catalog/`. La dependencia va en un
solo sentido, así la librería se puede copiar/publicar sola.

---

## Cómo se usa desde otro proyecto

### Sin build (HTML plano)

```html
<link rel="stylesheet" href="./web-ui/src/styles/index.css">
<script type="module">
  import { Button } from './web-ui/src/index.js';

  new Button({ label: 'Guardar', variant: 'primary' })
    .on('click', () => console.log('click'))
    .mount('#app');
</script>
```

### Con bundler (Vite / webpack / etc.)

```js
import 'web-ui/styles';
import { Button } from 'web-ui';

const btn = new Button({ label: 'Guardar' });
btn.mount(document.querySelector('#app'));
```

### Solo un componente

```js
import { Button } from 'web-ui/components/Button';
```

---

## API de `UIComponent`

Todo componente hereda esto:

| Miembro | Qué hace |
|---|---|
| `new X(options)` | Mergea `options` sobre `static defaults` (heredados de toda la cadena). |
| `.element` | Nodo raíz. Se renderiza perezosamente la primera vez. |
| `.mount(target)` | Inserta en el DOM. `target` = selector, nodo u otro componente. |
| `.unmount()` | Saca del DOM sin destruir. Se puede volver a montar. |
| `.update(patch)` | Cambia opciones y re-renderiza en el lugar, manteniendo la instancia. |
| `.option(key[, value])` | Lee o escribe una sola opción. |
| `.destroy()` | Saca del DOM y limpia listeners e hijos adoptados. |
| `.on / .once / .off / .emit` | Sistema de eventos propio (`'*'` escucha todo). |
| `.listen(node, type, fn)` | `addEventListener` con limpieza automática. **Usar siempre este.** |
| `.adopt(child)` | Registra un subcomponente para que muera con el padre. |

Hooks opcionales que puede definir una subclase: `onMount()`, `onUnmount()`,
`onUpdate(patch, prev)` (devolver `true` saltea el re-render), `onDestroy()`.

---

## Crear un componente nuevo

1. Copiar `src/components/_template/` → `src/components/<Nombre>/`
2. Renombrar archivos y clase.
3. Prefijar las clases CSS con `ui-<nombre>` (BEM: `__parte`, `--variante`, `.is-estado`).
4. Agregar el `@import` en [src/styles/components.css](src/styles/components.css)
5. Exportar la clase en [src/index.js](src/index.js)
6. Crear `catalog/demos/<Nombre>.demo.js` y sumarlo a [catalog/demos/index.js](catalog/demos/index.js)

---

## Configuración global — `src/config.js`

**Fuente de verdad única.** Cambiar un valor acá afecta a todos los componentes
de una, sin tocar ningún CSS ni ninguna clase.

```js
export const defaults = {
  BRAND_COLOR: '#4f46e5',   // color principal
  ROUNDNESS: 0,             // multiplicador de redondeo: 0 = recto, 1 = escala base, 2 = doble
};
```

### Cómo se propaga

`config.js` escribe **solo tres variables** en `<html>`, y
[tokens.css](src/styles/tokens.css) **deriva todo el resto** de ellas:

```
BRAND_COLOR ─→ --ui-brand ─┬─→ --ui-brand-subtle / soft / base / hover / active   (color-mix)
                           ├─→ --ui-accent · --ui-accent-hover · --ui-accent-subtle
                           └─→ --ui-focus-ring
            ─→ --ui-on-brand ─→ --ui-on-accent      (calculado por contraste WCAG)

ROUNDNESS   ─→ --ui-roundness ─→ --ui-radius-xs/sm/md/lg/xl/full   (calc multiplicador)
```

Por eso **nunca hay dos fuentes de verdad**: ningún componente hardcodea un color
ni un radio, todos leen `var(--ui-*)`.

Dos detalles que resuelve solo:
- **`--ui-on-brand`** se recalcula por contraste. Si ponés un brand claro (amarillo),
  el texto sobre el botón primario pasa a oscuro automáticamente.
- **`--ui-radius-circle`** (spinners, avatares, puntos) **no** depende de `ROUNDNESS`,
  así el spinner no se vuelve un cuadrado cuando `ROUNDNESS` es 0.

### Cambiar en runtime

```js
import { config, configure, resetConfig } from 'web-ui';

configure({ BRAND_COLOR: '#ff5c35', ROUNDNESS: 1.5 });
config.BRAND_COLOR;   // '#ff5c35'  (solo lectura)
resetConfig();        // vuelve a los defaults del archivo
```

Como todo viaja por variables CSS, **los componentes ya montados se actualizan al
instante sin re-renderizarse**. El catálogo tiene controles en vivo en la topbar
para probarlo (son preview: para que sea permanente, editá `src/config.js`).

`config` es de solo lectura a propósito — `config.ROUNDNESS = 2` tira un error que
te manda a `configure()`, en vez de fallar en silencio.

Para componentes que necesiten el valor del lado de JS (canvas, SVG generado):

```js
import { onConfigChange } from 'web-ui';
const off = onConfigChange((cfg) => redibujar(cfg.BRAND_COLOR));
```

### Overrides puntuales

Si necesitás desviarte del sistema en un lugar, pisá la semántica en tu CSS:

```css
.mi-seccion { --ui-accent: #00aa88; --ui-radius-md: 2px; }
```

Modo oscuro: `data-theme="dark"` o `"light"` en `<html>`. Sin atributo, sigue la
preferencia del sistema.

> Requiere `color-mix()` (Chrome 111+, Safari 16.2+, Firefox 113+).
