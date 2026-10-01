# Instalar este pack en un proyecto que ya existe

**Este documento es para un AGENTE.** Lo vas a leer vos, no una persona. La
persona te va a decir algo como *"ponele el estilo Grunge de este pack"* o
*"migrá la UI a Web UI"*, y acá está todo lo que hace falta para hacerlo sin
preguntarle nada más.

---

## ⛔ Qué cuenta como terminado

> **El proyecto tiene que quedar como si se hubiera hecho con este pack desde el
> primer día.** No "con el pack puesto encima".

La diferencia es concreta y se mide:

| ❌ No terminado | ✅ Terminado |
|---|---|
| El CSS viejo sigue ahí "por las dudas" | El CSS viejo se borró |
| `<button class="btn">` al lado de un `Button` | No queda un solo control hecho a mano |
| `style="margin-top: 12px"` para acomodar algo | La medida salió de un parámetro de la clase |
| Un `#3b82f6` suelto | Todo color sale de un token |
| Un `div` envolviendo un componente para darle layout | El layout lo hace un `Container` |

Si al terminar alguien abre el proyecto y no puede decir qué partes son del pack
y qué partes son viejas, está bien hecho. Si puede, no.

---

## 1. Copiar

**Se copia `src/` y nada más.** Es vanilla JS, ES Modules, **cero dependencias y
cero build step**: no hay nada que instalar ni que compilar.

```
tu-proyecto/
  src/ui/          ← acá va el contenido de src/ de este repo
```

**No copies** `catalog/`, `index.html`, `CATALOG.exe`, `serve.mjs` ni
`contrast.test.mjs`: son el visor y sus pruebas, no la librería.

> ⚠ **`src/` no carga NINGÚN recurso externo.** Ni fuentes, ni imágenes, ni
> CDNs. Si lo copiás a un proyecto sin internet, funciona igual.

---

## 2. Cargar

Dos hojas de estilo, siempre las dos y en este orden:

```html
<link rel="stylesheet" href="/src/ui/styles/base.css">
<link rel="stylesheet" href="/src/ui/styles/structure.css">
```

**La hoja del pack NO se pone a mano**: la inyecta `config.js` según el estilo
elegido, y la cambia sola cuando el estilo cambia.

```js
import { configure } from '/src/ui/config.js';
import { packStylesheetReady } from '/src/ui/styles/packs/index.js';

configure({ STYLE_PACK: 'grunge' });

// ⚠ Esperar la hoja ANTES de montar nada. Si no, las clases de entrada se
//   aplican cuando todavía no hay ninguna animación definida: no se ve nada.
await packStylesheetReady('grunge');
```

`configure()` ya aplica todo —escribe las variables, el `data-theme` y el
`data-ui-pack` en `<html>`—; no hace falta llamar a `applyConfig()` aparte.

### Si el proyecto usa un bundler

`package.json` ya declara los puntos de entrada:

```js
import { Button, Container } from 'web-ui';
import { configure }         from 'web-ui/config';
import { configureKeys }     from 'web-ui/keys';
```

---

## 3. Elegir el estilo

**Esto es un renglón.** Si la persona dice "usá el estilo X", cambiás el `STYLE_PACK`
y listo — no hay nada más que tocar.

| `STYLE_PACK` | Qué es | Perillas propias |
|---|---|---|
| `default` | Plano y neutro. El que no opina. | — |
| `glass` | Vidrio esmerilado, capas translúcidas. | — |
| `cyber` | Consola: versalitas, neón, glitch. | — |
| `soft` | Neumórfico: todo sale de una lámina. | — |
| `blueprint` | Plano técnico: líneas y cotas. | `GRID_OPACITY`, `GRID_SCALE` |
| `editorial` | Revista: tipografía y filetes. | `LEADING`, `MARGINS` |
| `clay` | Plastilina: gordo y con rebote. | `BOUNCE`, `SPEED` |
| `riso` | Risografía: tinta, trama y plancha corrida. | `MISREGISTER`, `INK_SHIFT`, `HALFTONE` |
| `nocturne` | Tablero oscuro, degradés que emiten. | `DEPTH`, `TINT` |
| `grunge` | Material gastado con laca encima. | `WEAR`, `GRAIN`, `FOIL` |
| `minimal` | La UI de un editor de código. | `CONTRAST`, `DENSITY` |

Los tres ajustes que tienen **todos**: `BRAND_COLOR`, `ROUNDNESS` y `THEME`.

```js
configure({ STYLE_PACK: 'grunge', BRAND_COLOR: '#00897b', WEAR: 2 });
```

> ⛔ **`THEME` es del PACK, no del documento.** Cada estética nace clara u
> oscura y el pack ya trae la que le corresponde. No lo cambies salvo que te lo
> pidan: `soft` necesita luz que le pegue encima, `nocturne` es un tablero
> oscuro.

### Las dos fuentes que el pack NO carga

`blueprint` nombra **Handlee** y `grunge` nombra **Protest Revolution**. Los dos
tienen fallbacks reales detrás, así que sin ellas no se rompe nada —se pierde la
letra, no el pack—. Si querés que se vean como corresponde, **el proyecto que
las usa es el que las carga**:

```html
<link rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Handlee&family=Protest+Revolution&display=swap">
```

---

## 4. Reemplazar, uno por uno

Buscá en el proyecto cada control hecho a mano y cambialo por su clase. **Todo
componente se construye igual**: `new Clase({ opciones })` y se monta con
`.mount(nodo)` o se le pasa a otro componente como `content`.

```js
new Button({ label: 'Guardar', variant: 'primary', onClick: guardar }).mount(barra);
```

### El mapa

| Lo que el proyecto tiene | Lo que lo reemplaza |
|---|---|
| `<button>`, `<a class="btn">` | `Button` — con `href` se vuelve `<a>` solo |
| `<input type="text">`, `<textarea>` | `TextField` — `multiline: true` para el textarea |
| `<input type="number">` | `Spinner` — se arrastra y se escribe |
| `<input type="range">` | `Slider` |
| `<input type="checkbox">` | `Checkbox` — tiene `indeterminate` |
| `<input type="radio">` en grupo | `RadioGroup` |
| Un switch / toggle hecho a mano | `Toggle` |
| `<select>` | `Select` |
| `<input type="color">` | `ColorPicker` |
| Un spinner de carga, una barra de progreso | `Progress` — `shape: 'linear'` o `'radial'` |
| `<hr>`, un div separador | `Separator` |
| Un `<svg>` suelto repetido | `Icon` — ver `Icon.names` |
| Un div con `role="tablist"` | `Tabs` |
| Un grupo de botones donde uno queda activo | `Segmented` — **no** es un `RadioGroup` |
| Una fila de lista **con nombre**, una ficha de catálogo | `Tile` |
| Una fila de lista que **no** es un nombre | `Container` con `variant: 'list'` |
| Un modal, un diálogo | `Window` con `modal: true` |
| Un div con `overflow: auto` | `Scroll` |
| Cualquier `div` que agrupa o posiciona | `Container` |

### Las que no son obvias

- **`Segmented` vs `RadioGroup`.** Un radio es un formulario: lista vertical,
  se elige y después se envía. Un segmented es un CONTROL: se aprieta y el
  efecto es inmediato, vive en una barra. Forzar uno a ser el otro termina en
  una pila de excepciones.
- **`Tile` vs `Container variant:'list'`.** Se ven igual, pero una ficha SABE
  cuál de sus partes es el nombre — y eso es lo único que permite renombrarla
  en el lugar. Si la fila ES un nombre, es un `Tile`.
- **Un panel de fichas que baja de renglón** es `Container` con
  `layout: 'wrap'`, **no** `layout: 'grid'`. La grilla reparte el ancho sobrante
  y las fichas cambian de tamaño; el panel de contenido hace lo contrario.
- **Un `<div>` que existía solo para dar margen o alinear** no se reemplaza:
  **se borra**, y lo que hacía pasa a ser un parámetro del `Container` que lo
  rodea (`gap`, `padding`, `align`, `justify`).

### Capacidades, no componentes nuevos

Si el proyecto tenía una lista que se arrastraba o nombres que se editaban, **no
busques un componente**: son interruptores.

```js
new Container({ reorderable: true,   onReorder: (ids) => guardar(ids) })
new Container({ reorderable: 'tree', onMove: (id, lugar, destino) => mover(...) })
new Tile({ editableLabel: true, onRename: (nombre) => guardar(nombre) })
new Tabs({ tabs: [{ id, label, editable: true, closable: true }] })
```

Cada pieza que se reordena declara su identidad con `data-sort-id`
(`dataset: { sortId: id }`); el `draggable` lo pone el contenedor.

> ⛔ **Ningún componente cambia los datos por su cuenta.** Avisa lo que se pidió
> y vos decidís. Si reordenaran solos, lo que se ve y lo que tenés guardado
> dejan de coincidir al primer re-render.

---

## 5. Borrar lo viejo

**Este paso no es opcional**, y es el que separa una migración de un parche.

- El framework de CSS que hubiera (Bootstrap, Tailwind, Bulma, uno propio).
- El reset / normalize: `base.css` ya trae el suyo.
- Las hojas de estilo de los controles que acabás de reemplazar.
- Las clases utilitarias que quedaron sin usar.
- Cualquier `<style>` suelto que peleaba con algo.

**No borres** el CSS que dibuja lo que es del proyecto y no de la UI: el fondo
de la página, una ilustración, el lienzo de un editor. Eso no es del pack.

---

## 6. Las seis reglas que hacen que quede limpio

Si seguís el mapa pero no estas reglas, el resultado va a funcionar y se va a
notar que es un injerto.

1. **⛔ CERO VALORES HARDCODEADOS.** Ni un `#hex`, ni un `rgb()`, ni un `px`
   suelto. Todo sale de `var(--ui-*)`. Si falta un valor, el token se agrega en
   `styles/packs/<pack>/tokens.css` — no en el lugar de uso.

2. **⛔ NUNCA FUERCES ALGO EN EL LUGAR DE USO.** Si necesitás controlar algo que
   la clase no expone, **se le agrega el parámetro a la clase**. Nada de estilo
   en línea, CSS suelto, un wrapper ad-hoc ni un `!important`.

   ```js
   ❌  contenedor.element.style.padding = '40px'
   ✅  new Container({ padding: 'lg' })
   ```

3. **⛔ EL ACENTO TIENE DOS TOKENS Y NO SON INTERCAMBIABLES.** `--ui-accent` es
   color de RELLENO y `--ui-accent-text` es color de LETRA. Un cian o un violeta
   saturados se ven brillantes y rinden 2.5:1 como texto. Si vas a escribir
   sobre un fondo, es `--ui-accent-text`.

4. **⛔ LOS ATAJOS DE TECLADO ESTÁN TODOS EN `src/keys.js`.** Ningún componente
   escribe una tecla por su cuenta, y vos tampoco:

   ```js
   configureKeys({ rename: ['F2', 'Ctrl+R'], closeTab: [] });
   ```

5. **El texto NO se selecciona por defecto** —`base.css` lo apaga en el `body`—.
   Lo que sí se selecciona es opt-in: campos editables y lo que marques con
   `.ui-selectable` (un valor para copiar, código). Si el proyecto tenía texto
   de lectura largo, marcalo.

6. **Todo entra y sale animado, y es automático.** `UIComponent` lo hace solo.
   Para sacar algo con su animación de salida se usa `await componente.leave()`,
   no `destroy()` —que es inmediato a propósito—.

---

## 7. Verificar

Corré esto en la raíz del proyecto migrado. **Lo que importa es que no devuelvan
nada.**

> ⚠ **Los cuatro excluyen la carpeta del pack.** Lo que se audita es TU código:
> el pack ya cumple sus propias reglas, y auditarlo da falsos positivos que te
> van a hacer perseguir cosas que están bien. Cambiá `/ui/` por donde lo hayas
> copiado.

```bash
# 1. Controles nativos que sobrevivieron
grep -rnE '<(button|select|textarea)\b|<input\b' \
  --include=*.html --include=*.js --include=*.jsx --include=*.ts --include=*.tsx . \
  | grep -v '/ui/' | grep -v node_modules

# 2. Colores literales en TU CSS
#    Se filtra `rgb(from ...)`: ESO es color relativo desde un token, que es
#    justamente la forma correcta. Lo que se busca es el hex suelto.
grep -rnE '#[0-9a-fA-F]{3,8}\b|\brgba?\(' --include=*.css . \
  | grep -v '/ui/' | grep -v node_modules | grep -v 'rgb(from'

# 3. Estilos forzados en el lugar de uso
grep -rn 'style=\|\.style\.\|!important' \
  --include=*.html --include=*.js --include=*.jsx --include=*.ts --include=*.tsx . \
  | grep -v '/ui/' | grep -v node_modules

# 4. Restos del CSS viejo
grep -rniE 'bootstrap|tailwind|normalize\.css|reset\.css' . | grep -v node_modules
```

**La única excepción legítima al #2** es un color dentro de una MÁSCARA
(`mask-image`), donde el color no se ve y lo único que cuenta es el alfa: ahí un
`rgb(0 0 0 / 1)` es correcto y no hay token que corresponda. Si aparece otra
cosa, es una fuga.

Y el guard que ya viene con el pack, si copiaste también `contrast.test.mjs`:

```bash
node contrast.test.mjs          # el contraste se MIDE, no se estima
```

### Lista final

- [ ] No queda ningún control nativo sin reemplazar
- [ ] El CSS viejo está borrado, no comentado
- [ ] Ningún color ni medida fuera de los tokens
- [ ] Ningún estilo en línea ni `!important`
- [ ] Un solo `configure({ STYLE_PACK })` en todo el proyecto
- [ ] Cambiar `STYLE_PACK` por cualquier otro de los once **no rompe nada**

> El último punto es la prueba de fuego: si el proyecto solo se ve bien con un
> pack, es que quedó algo atado a ese pack que no debería estar.

---

## 8. Trampas conocidas

Cosas que ya costaron encontrarlas una vez.

- **El marco de una ventana es CUADRADO, siempre.** `--ui-window-radius: 0` en
  todos los packs. No sigue a `ROUNDNESS` y no es una licencia estética.
- **`backdrop-filter` en un contenedor lo vuelve backdrop root**: sus
  descendientes que también desenfocan se ven planos. El desenfoque va en una
  capa (`::before`), no en el contenedor.
- **Nada decorativo dibujado con capas de `background` sobrevive a `ROUNDNESS`**:
  el fondo se recorta a la esquina redondeada.
- **CSS no interpola entre una `box-shadow` `inset` y una que no lo es**: si la
  lista cambia de forma, salta en vez de animar.
- **Mover no se anima por defecto.** Es a propósito: una transición de
  `transform` siempre prendida pelea con cualquiera que mueva algo por JS. Se
  opta con `[data-ui-animating]`.
- **Un re-render se lleva el foco del teclado.** Para cambiar un estado usá los
  métodos que no re-renderizan (`setSelected`, `setLabel`, `set`), no `update()`.

---

## 9. Dónde seguir leyendo

- **[`CLAUDE.md`](CLAUDE.md)** — las reglas de la librería, para cuando haya que
  agregarle algo. Si vas a tocar `src/`, leelo antes.
- **`src/keys.js`** — todos los atajos de teclado.
- **`src/styles/packs/<pack>/tokens.css`** — los valores de cada estética. Ahí
  vive el 90% de lo que se puede cambiar sin tocar un componente.
- **El catálogo** (`npm run dev`) — los dieciocho componentes en los once
  estilos, con el código de cada ejemplo.
