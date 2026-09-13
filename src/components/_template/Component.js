import { UIComponent } from '../../core/UIComponent.js';
import { el, cx } from '../../core/dom.js';

/**
 * PLANTILLA — copiar esta carpeta y renombrar.
 *
 * Checklist al crear un componente nuevo:
 *   1. Copiar `src/components/_template/` -> `src/components/<Nombre>/`
 *   2. Renombrar los archivos y la clase.
 *   3. Prefijar todas las clases CSS con `ui-<nombre>`.
 *   4. Agregar el @import del CSS ESTRUCTURAL en `src/styles/structure.css`.
 *   5. Crear su PIEL en `src/styles/packs/default/components/<Nombre>.css`
 *      y en `_template/components/`, con su @import en cada `pack.css`.
 *   6. Exportar la clase en `src/index.js`.
 *   7. Crear `catalog/demos/<Nombre>.demo.js` y sumarlo a `catalog/demos/index.js`.
 *
 * Recordá el reparto: este archivo y su .css llevan ESTRUCTURA (caja, layout,
 * escalas). Los colores y hovers van en la piel del pack, nunca acá.
 */
export class Component extends UIComponent {
  /** Se usa como prefijo del uid. Opcional pero ayuda a debuggear. */
  static componentName = 'component';

  /** Toda opcion configurable del componente vive aca, con su default. */
  static defaults = {
    text: 'Hola',
    variant: 'default',
  };

  /**
   * Construye y devuelve el nodo raiz.
   * Reglas:
   *   - Sin efectos secundarios fuera del nodo que devuelve.
   *   - Listeners de DOM siempre con `this.listen(...)`, nunca addEventListener.
   *   - Subcomponentes siempre con `this.adopt(new Otro())`.
   */
  render() {
    const o = this.options;

    const node = el('div', {
      class: cx('ui-component', `ui-component--${o.variant}`),
    }, [
      el('span', { class: 'ui-component__text', text: o.text }),
    ]);

    this.listen(node, 'click', (event) => this.emit('click', event));

    return node;
  }

  /**
   * Opcional. Si podes aplicar el cambio sin re-renderizar todo,
   * mutá el DOM acá y devolvé `true` para saltear el re-render.
   */
  // onUpdate(patch) {
  //   if (Object.keys(patch).length === 1 && 'text' in patch) {
  //     this.el.querySelector('.ui-component__text').textContent = patch.text;
  //     return true;
  //   }
  // }

  /** Hooks opcionales del ciclo de vida. */
  // onMount() {}
  // onUnmount() {}
  // onDestroy() {}
}
