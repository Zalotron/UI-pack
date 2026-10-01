# Web UI — contexto para Claude

Librería de componentes UI. **No es una app ni un sitio.** El objetivo es que
`src/` se pueda copiar/importar en cualquier proyecto futuro sin arrastrar nada.

---

## ⛔ PRINCIPIO RECTOR — leer antes de tocar nada

> **Nunca hardcodear. Si algo no se puede controlar, se expone como parámetro de la clase.**

Cuando aparece la necesidad de controlar algo que una clase todavía no expone, la
solución **no** es forzarlo en el uso puntual (estilo inline, CSS suelto, un wrapper
ad-hoc, un `!important`). La solución es **modificar la clase para que exponga ese
control**.

```
❌ MAL                                    ✅ BIEN
new Container()                           // 1. agregar `padding` a Container.defaults
  .element.style.padding = '40px'         // 2. exponerlo como var CSS
                                          new Container({ padding: 'lg' })
```

Ejemplo textual del usuario: *"si te encontrás con que querés controlar un inner
margin en un contenedor, en vez de forzarlo a mano, hacelo prolijo estableciendo eso
como parámetro de contenedor"*.

**Dónde va cada cosa:**

| Si el control es… | Va en… |
|---|---|
| Elegir la estética entera | `config.STYLE_PACK` |
| Una perilla **dentro de un estilo** | `settings` del pack (`packs/<pack>/pack.js`) |
| Propio del componente | su `static defaults` |
| Un valor concreto (color, medida, tiempo) | un token en `packs/<pack>/tokens.css` |

**Corolarios:**
- Cero literales en el CSS de un componente. Si falta un valor, se crea el token.
- Antes de resolver cualquier pedido de ajuste, preguntarse: *¿esto debería ser un
  parámetro?* Casi siempre la respuesta es sí.
- Las clases se componen entre sí. Un contenedor con un layout adentro son dos
  `Container`, no un componente nuevo.
- No adelantarse: el usuario define las clases de a una. No inventar componentes
  que no pidió.

---

## Reglas duras

- **Vanilla JS, ES Modules, cero dependencias, cero build step.** No agregar
  React/Vue/Tailwind/bundlers salvo pedido explícito.
- **`src/` no carga NINGUN recurso externo.** Ni fuentes, ni imágenes, ni CDNs:
  la carpeta se tiene que poder copiar a otro proyecto y funcionar sola.
  - Un pack **puede nombrar** una familia que no sea del sistema (`blueprint`
    nombra `Handlee`, `grunge` nombra `Protest Revolution`), pero **siempre con fallbacks
    reales detrás** — quien importe la librería y no la cargue tiene que ver
    algo parecido, no una tipografía de sistema al azar.
  - Quien la carga es el **visor**, en `index.html`. Es el mismo reparto que la
    ambientación de fondo: lo que es del catálogo vive en el catálogo.
- **`src/` nunca importa de `catalog/`.** La dependencia va en un solo sentido.
- Todo componente extiende `UIComponent` (`src/core/UIComponent.js`) y define
  `static defaults` + `render()`.
- Listeners de DOM **siempre** con `this.listen(node, type, fn)`, nunca
  `addEventListener` directo — si no, se filtran en `update()` / `destroy()`.
- Subcomponentes **siempre** con `this.adopt(new Otro())`.
- Markup con los helpers `el()` / `cx()` de `src/core/dom.js`. Evitar `innerHTML`
  con datos variables.
- **Un pack = una estética completa.** La lógica de los componentes es
  compartida; la estética es del pack. Hoy hay once packs reales — `default`,
  `glass`, `cyber`, `soft`, `blueprint`, `editorial`, `clay`, `riso`,
  `nocturne`, `grunge` y `minimal` — más el molde `_template`.
  - `src/components/<X>/<X>.css` → **estructura** (caja, layout, escalas,
    interfaz de variables). Agnóstico al estilo, **no se toca al crear un pack**.
  - `src/styles/packs/<pack>/components/<X>.css` → **piel**: TODA la
    apariencia, no solo colores.
  - `src/styles/packs/<pack>/tokens.css` → los **valores**. Ahí vive el 90%.
  - Los settings (`BRAND_COLOR`, `ROUNDNESS`, `THEME`) son **por pack**, no
    globales: se declaran en `packs/<pack>/pack.js`.
  - **`THEME` es del pack, no del documento.** Cada estética nace clara u
    oscura: el neumórfico necesita luz que le pegue encima, la risografía es
    tinta sobre papel, `nocturne` es un tablero oscuro. Cuando el tema era
    global, elegir claro para uno se lo imponía a todos. `config.js` lo escribe
    como `data-theme` en `<html>` — atributo y no variable, porque así lo leen
    los tokens (`:root[data-theme="dark"]`).
- **Un pack puede declarar SETTINGS PROPIOS**, además de los comunes
  (`BRAND_COLOR`, `ROUNDNESS`). Se ponen en su `settings` y se describen en
  `controls` (`packs/<pack>/pack.js`). `config.js` los emite solos como
  variables CSS —`GRID_OPACITY` → `--ui-grid-opacity`— y el catálogo les arma
  un control leyendo esa descripción, así que una perilla nueva aparece sin
  tocar el catálogo. Dos guards: que el CSS del pack la use de verdad, y que
  el pack describa su rango (el default 0..1 casi siempre está mal).
- **⛔ CADA PACK TIENE SUS PROPIOS PARÁMETROS.** Si un estilo necesita una
  propiedad que ningún otro usa (`backdrop-filter`, `filter`, `mask`…), la
  escribe **en su propia piel**. NO se agrega una perilla a la estructura
  compartida para eso: obligaría a todos los demás packs a cargar algo que no
  usan.

  ```
  ❌ MAL — estructura compartida     ✅ BIEN — piel del pack
  .ui-container {                    /* packs/glass/components/Container.css */
    --container-backdrop: none;      .ui-container--panel::before {
    backdrop-filter: var(...);         backdrop-filter: var(--ui-glass-blur-lg);
  }                                  }
  ```
  (va en `::before` y no en `.ui-container--panel` por la regla de BACKDROP
  ROOT, más abajo.)

  Esto **no contradice** el PRINCIPIO RECTOR: ese principio es sobre el lugar
  de USO (el catálogo, una app) forzando algo a mano. Un pack no es un lugar
  de uso — es el dueño legítimo de la apariencia.

  Corolario: si el efecto de un pack causa un problema (p. ej. `backdrop-filter`
  crea contexto de apilamiento y tapa un desplegable), **el arreglo también va
  en el pack**, porque el problema lo creó esa estética.
- **Al agregar un componente hay que crear su piel en TODOS los packs**
  (hoy `default`, `glass`, `cyber`, `soft`, `blueprint`, `editorial`, `clay`,
  `riso`, `nocturne`, `grunge`, `minimal` y `_template`). Hoy son **18**: los dieciséis de
  siempre más `Segmented` y `Tile`.
- **⛔ TODO COMPONENTE ENTRA Y SALE ANIMADO.** `UIComponent` pone
  `.is-entering` al montar y `.is-leaving` en `leave()`, y **espera** a que
  terminen las animaciones antes de sacar el nodo. La mecánica decide CUANDO;
  el pack decide QUE SE VE, en `packs/<pack>/lifecycle.css`.
  - Cada pack define las dos para **los 18 componentes**. Hay guard.
  - **La salida es más corta que la entrada.** Lo que aparece se presenta; lo
    que se va no debe hacerte esperar. Hay guard.
  - La coreografía es del mismo material que el pack: el vidrio se condensa,
    el cyber engancha y pierde señal, el neumórfico sale de la lámina, el
    blueprint se dibuja y se borra.
  - `destroy()` y `unmount()` siguen siendo **inmediatos** a propósito.
    `leave()` es la versión con despedida, y devuelve una promesa.
  - Si un pack no define nada no se rompe: la espera resuelve enseguida. Por
    eso hace falta el guard — la falta no se nota hasta que alguien la mira.
- **⛔ UNA CAPACIDAD NO ES UN COMPONENTE.** Si algo que una pieza puede HACER
  no cambia lo que esa pieza ES, va como parámetro suyo y no como una clase
  nueva que la envuelva. Reordenar arrastrando es el caso: una fila de
  pestañas que se reordena sigue siendo una fila de pestañas, y una lista
  también. El motor vive en `src/core/reorder.js` y lo consumen `Tabs` y
  `Container` con `reorderable: true`.

  ```
  ❌ MAL                              ✅ BIEN
  new ListaOrdenable({ items })       new Container({ reorderable: true })
  ```

  Envuelto en otra caja, esa caja trae su propio layout a pelear con el que la
  lista ya tenía. Y duplicado por componente —que es como empezó: una copia
  horizontal en `Tabs` y otra vertical en `core/`— se arregla un borde de un
  lado y el otro se queda con el error, sin que nadie se entere porque las dos
  "andan". El eje entra como parámetro: es la misma geometría girada.

  Lo mismo con el valor de fábrica de un contenido: **un default que es texto
  visible no es un default, es contenido inventado**. `Button` tenía
  `label: Button` y eso rompía el botón de solo icono.

- **⛔ UN SOLO COLOR DECLARADO POR PACK: `--ui-brand`.** Todos los demás son
  transformaciones suyas con color relativo:
  ```css
  --ui-neutral-600: hsl(from var(--ui-brand) h calc(s * 0.16) 37%);
  --ui-line:        rgb(from var(--ui-text) r g b / 0.12);
  ```
  `calc(h + N)` corre el tono · `calc(s * K)` la fracción de saturación ·
  la claridad va fija. Así los neutros quedan sesgados hacia la marca (brand
  cálido → grises cálidos) y un brand apagado apaga toda la UI junta.
  **Nunca un `#hex` ni un `rgb()` literal nuevo, en ningún archivo.** Si hace
  falta un color, se deriva. La grisura se logra con `calc(s * 0)`, no con hex.
  Lo mismo en JS: si hay que elegir un color, se devuelve una referencia a
  token (`var(--ui-on-brand-light)`), no un valor.
- **Cero valores hardcodeados en CSS.** Todo sale de `var(--ui-*)`
  (`src/styles/packs/<pack>/tokens.css`). Si falta un token, se agrega el token.
- Usar `--ui-radius-circle` (no `--ui-radius-full`) en todo lo que deba ser
  redondo siempre: spinners, avatares, puntos. `full` se aplana con ROUNDNESS 0.
- **El acento tiene DOS tokens y no son intercambiables:** `--ui-accent` es
  color de RELLENO (botón, barra, borde) y `--ui-accent-text` es color de
  LETRA. Un acento vivo puede no tener luminancia para leerse — un cian o un
  violeta saturados rinden ~2.5:1 como texto aunque se vean brillantes. Todo
  pack declara los dos; en varios coinciden, en otros no.
- **`backdrop-filter` en un contenedor lo vuelve BACKDROP ROOT**: sus
  descendientes que también desenfocan solo alcanzan lo pintado adentro, así
  que un desplegable abierto se ve plano. El desenfoque va en una capa
  (`::before`), no en el contenedor.
- **Nada decorativo dibujado con capas de `background` sobrevive a ROUNDNESS**:
  el fondo se recorta a la forma redondeada. Lo que tenga que seguir la esquina
  se dibuja como borde (y se enmascara), no como barra.
- **CSS no interpola entre una `box-shadow` `inset` y una que no lo es**: si la
  lista cambia de forma, SALTA en vez de animar. Un pack cuyo gesto sea pasar
  de relieve a hueco tiene que declarar SIEMPRE las mismas sombras en el mismo
  orden, y apagar con `0 0 0` las que no usa (ver `packs/soft/tokens.css`).
- **⛔ EL MARCO DE UNA VENTANA ES CUADRADO, SIEMPRE.** `--ui-window-radius: 0`
  en TODOS los packs. No sigue ROUNDNESS y **no es una licencia estética**: un
  pack no puede redondearla por vistosa que le quede, ni desde el token ni
  desde su piel. Si un estilo necesita verse blando, lo consigue con la
  superficie, no con la curva del marco.
- **Los CURSORES también son del pack.** La mecánica no escribe `cursor: pointer`
  en ningún lado: consume `var(--ui-cursor-*, <nativo>)`, y el fallback es el
  valor del sistema — un pack que no declare nada se comporta como siempre.
  - Los nueve: `default`, `pointer`, `text`, `disabled`, `grab`, `grabbing`,
    `resize-ns`, `crosshair`, `busy`.
  - **La FORMA se comparte, el pintado es del pack.** Una flecha es una flecha
    y una mano es una mano: son convenciones de uso, no lugar para inventar.
    Lo que cambia es relleno, contorno, grosor y remate.
  - Un cursor dibujado va como SVG en data URI, y **siempre** con su *hotspot*
    (el píxel que apunta) y su **fallback nativo** detrás: sin el fallback, si
    el SVG no carga el cursor puede quedar en ninguno.
  - ⚠ **No pueden seguir a `BRAND_COLOR`**: un data URI es un documento aparte
    y no ve las variables CSS. Van en tinta neutra; la identidad la lleva la
    forma. Es la misma restricción que las texturas de `riso` y `grunge`.
  - Lienzo de 32px como máximo: más grande, varios navegadores lo ignoran.
- Nombres CSS: `.ui-<nombre>`, `.ui-<nombre>__<parte>`, `.ui-<nombre>--<variante>`,
  estados con `.is-<estado>`.
- **Texto NO seleccionable por defecto.** `base.css` apaga `user-select` en el
  `body`. Lo que sí se selecciona es opt-in: campos editables (`input`,
  `textarea`, `[contenteditable]`) y cualquier cosa marcada `.ui-selectable`
  (valores para copiar, código, texto de lectura). Nunca al revés.
- Accesibilidad no es opcional: roles, `aria-*`, foco visible, navegación por teclado.

## Checklist al agregar un componente

1. `src/components/<Nombre>/<Nombre>.js` + `.css` (estructura) + `index.js`
   (copiar de `src/components/_template/`)
2. `@import` del CSS estructural en `src/styles/structure.css`
3. Piel en `src/styles/packs/<pack>/components/<Nombre>.css` para **todos**
   los packs (`default`, `glass`, `cyber`, `soft`, `blueprint`, `editorial`,
   `clay`, `riso`, `nocturne`, `grunge`, `minimal`, `_template`), más su
   `@import` en cada `pack.css`
4. `export` de la clase en `src/index.js`
5. `catalog/demos/<Nombre>.demo.js` + entrada en `catalog/demos/index.js`

## Checklist al agregar un PACK

1. `cp -r src/styles/packs/_template src/styles/packs/<nombre>`
2. `pack.js`: id, label y sus `settings`
3. `tokens.css`: los valores de la estética
4. `lifecycle.css`: **entrada y salida de los 18 componentes** (obligatorio,
   con guard). La salida más corta que la entrada.
5. Ajustar la piel de los componentes que lo necesiten
6. Registrarlo en `src/styles/packs/index.js`
7. Correr `contrast.test.mjs`: descubre los packs registrados solo, y el
   contraste del texto se MIDE, no se estima.

## El catálogo

**DOS COLUMNAS, cada una con su propio scroll.** A la izquierda el panel de
ajustes, de ancho fijo y alto de ventana; a la derecha las secciones. Mover una
no arrastra a la otra, y la página misma no scrollea. Las dos columnas son
`Scroll` reales, no divs con overflow: traen el rol y el foco de teclado que una
región scrolleable necesita.

**Sin menú, sin tabs de navegación, sin ruteo.** Se scrollea y ya. Está
construido con instancias reales de `Container`, `Separator` y `Scroll`
(dogfooding).

**COMPACTO Y RESUMIDO — es la regla, no una preferencia:**
- Sin textos explicativos. Ni descripciones, ni notas, ni tablas de opciones.
- Los ejemplos NO van envueltos en cajas: lo que separa es un `Separator`
  (`sm` entre ejemplos, `xl` entre componentes).
- Mostrar lo mínimo que se entienda. Un componente simple = el componente solo.
  No hacer un ejemplo por cada opción de la clase.
- El título del ejemplo (`title`) es **opcional** y solo va si aporta algo que
  el título de la sección no dice ya. "Muestra" o "Ejemplo" no aportan: se omiten.
- Ante la duda, sacar. Agregar cuando se pida.

**Ambientación por pack:** `catalog.css` dibuja formas de fondo bajo
`:root[data-ui-pack="<pack>"]` — anillos y grilla para `glass` (sin algo detrás
un vidrio no se ve), rejilla de circuito y scanlines para `cyber`, marco de
lámina para `blueprint`. Vive en el catálogo y no en el pack a propósito: un pack que
le pinte anillos al fondo de la página sería inaceptable para quien importe la
librería. El interruptor es el atributo `data-ui-pack` que escribe
`src/config.js`.

## Ver el resultado

`npm run dev` → http://localhost:5173 (hace falta servidor HTTP: los ES Modules
no cargan por `file://`).
