/* ===========================================================================
   El marco de la ventana — que siga al pack y al tema elegidos.

   Vive en el CATÁLOGO y no en `src/`, por lo mismo de siempre: la librería no
   sabe con qué ventana la estás mirando.

   ⛔ HASTA DONDE SE PUEDE LLEGAR, Y POR QUÉ.

   La barra de título de una ventana de aplicación la dibuja el NAVEGADOR, no
   la página: no hay forma de ponerle los botones del `Window` del pack ni de
   darle su textura. Lo único que la página puede pedir es su COLOR, con
   `<meta name="theme-color">`, y los navegadores basados en Chromium lo usan
   para pintar la barra de una ventana abierta con `--app`.

   Así que el marco no se reestiliza: se TIÑE. Es poco, pero es lo que hace que
   la ventana deje de verse pegada de otro sistema cuando uno cambia de pack —
   que era el problema real.

   En una pestaña común el navegador lo ignora y no pasa nada.
   =========================================================================== */

/** Un color que valga la pena: ni vacío, ni transparente. */
function sirve(color) {
  if (!color) return false;
  const limpio = color.replace(/\s/g, '');
  return limpio !== 'transparent' && !/rgba?\([^)]*,0\)$/.test(limpio);
}

/**
 * De dónde sale el color, en orden.
 *
 * Se lee de una ventana DE VERDAD y no de un token: `--window-bar-bg` es una
 * variable del componente, no del `:root`, así que fuera de un `.ui-window` no
 * existe. Y varios packs la dejan transparente a propósito —blueprint, por
 * ejemplo— y en ese caso el color que corresponde es el del cuerpo.
 */
function colorDelMarco() {
  const bar = document.querySelector('.ui-window__bar');
  if (bar) {
    const suyo = getComputedStyle(bar).backgroundColor;
    if (sirve(suyo)) return suyo;

    const ventana = bar.closest('.ui-window');
    const cuerpo = ventana && getComputedStyle(ventana).backgroundColor;
    if (sirve(cuerpo)) return cuerpo;
  }
  // Sin ventana a la vista: el fondo de la página es lo más cercano.
  return getComputedStyle(document.body).backgroundColor;
}

let meta = null;

/** Pinta el marco con el color del pack y el tema activos. */
export function pintarMarco() {
  /* Teñir el marco es lo ULTIMO que tiene que poder romper algo: si el entorno
     no sabe calcular estilos —un render de prueba, jsdom— se sale sin ruido.
     Sin esto, un detalle cosmetico volteaba el arranque del catalogo entero. */
  if (typeof getComputedStyle !== 'function') return;

  const color = colorDelMarco();
  if (!sirve(color)) return;

  if (!meta) {
    meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.append(meta);
    }
  }
  meta.setAttribute('content', color);
}
