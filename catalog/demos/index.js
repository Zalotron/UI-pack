/* ===========================================================================
   Manifiesto de demos del catalogo.
   Al crear un componente nuevo: 1 import + 1 entrada en el array. Nada mas.
   =========================================================================== */

import container from './Container.demo.js';
import controls from './Controls.demo.js';
import windowDemo from './Window.demo.js';
import tabs from './Tabs.demo.js';
import segmented from './Segmented.demo.js';
import tile from './Tile.demo.js';
import progress from './Progress.demo.js';
import icon from './Icon.demo.js';

/* El orden de acá es el orden de la página. Va de lo mas simple a lo mas
   compuesto: la caja, los controles, lo que muestra estado, la navegación, y
   la ventana al final — que es la única pieza que contiene a todas las demás. */
export const demos = [
  container,
  controls,
  progress,
  icon,
  segmented,
  tile,
  tabs,
  windowDemo,
];
