import { UIComponent } from '../../core/UIComponent.js';
import { el, cx, append } from '../../core/dom.js';

/**
 * Scroll — region con scroll y barra propia.
 *
 *   new Scroll({ maxHeight: '240px', content: algo })
 *   new Scroll({ axis: 'x', content: unaFilaLarga })
 *
 * Estila la barra NATIVA (::-webkit-scrollbar y scrollbar-color), no dibuja
 * uno falso con divs: el nativo ya trae rueda, teclado, touch e inercia, y
 * reimplementarlo es donde se rompen esas cosas.
 *
 * La clase `.ui-scroll` tambien sirve suelta, sin instanciar el componente:
 * cualquier elemento que ya tenga overflow puede llevarla.
 */

const AXES = ['y', 'x', 'both', 'auto'];
/** La misma escala de espacio que usa Container: una sola para todo. */
const SPACE_SIZES = ['none', 'xs', 'sm', 'md', 'lg', 'xl'];
const THICKNESS = ['thin', 'regular'];

export class Scroll extends UIComponent {
  static componentName = 'scroll';

  static defaults = {
    /** string | Node | UIComponent | array. */
    content: null,
    /** Etiqueta del nodo raiz. */
    tag: 'div',

    /**
     * 'y'    -> solo vertical (default)
     * 'x'    -> solo horizontal
     * 'both' -> los dos
     * 'auto' -> el que haga falta
     */
    axis: 'y',
    /** 'thin' | 'regular' — grosor de la barra. */
    thickness: 'thin',
    /**
     * Reserva el lugar de la barra aunque no haya scroll, para que el
     * contenido no se corra cuando aparece.
     */
    stableGutter: false,

    /**
     * Se queda con el espacio que sobra cuando esta adentro de un `row` o un
     * `stack`. Sin esto una region con scroll dentro de una fila se mide por
     * su CONTENIDO y desborda el contenedor en vez de scrollear.
     */
    grow: false,

    /**
     * Aire alrededor del contenido, adentro de la region. Misma escala que
     * Container ('none'..'xl') o un valor CSS crudo.
     *
     * Va ACA y no en un envoltorio a proposito: un envoltorio en el medio
     * corta la cadena de altura, y entonces lo de adentro ya no puede pedir
     * `minHeight: 100%` para ocupar la region entera.
     */
    padding: null,

    /** Medidas. Valor CSS. */
    height: null,
    maxHeight: null,
    width: null,
    maxWidth: null,

    ariaLabel: null,
    className: null,
    dataset: null,
  };

  render() {
    const o = this.options;

    const node = el(o.tag, {
      class: cx(
        'ui-scroll',
        AXES.includes(o.axis) && `ui-scroll--${o.axis}`,
        THICKNESS.includes(o.thickness) && `ui-scroll--${o.thickness}`,
        o.stableGutter && 'ui-scroll--stable',
        o.grow && 'ui-scroll--grow',
        SPACE_SIZES.includes(o.padding) && `ui-scroll--pad-${o.padding}`,
        o.className,
      ),
      style: {
        // Un valor crudo se aplica directo; los de la escala salen por clase.
        ...(o.padding && !SPACE_SIZES.includes(o.padding) ? { padding: o.padding } : {}),
        ...(o.height ? { height: o.height } : {}),
        ...(o.maxHeight ? { maxHeight: o.maxHeight } : {}),
        ...(o.width ? { width: o.width } : {}),
        ...(o.maxWidth ? { maxWidth: o.maxWidth } : {}),
      },
      // Una region con scroll tiene que poder recorrerse con el teclado.
      tabindex: '0',
      role: 'region',
      'aria-label': o.ariaLabel || undefined,
      dataset: o.dataset || undefined,
    });

    append(node, this._contentNodes());
    return node;
  }

  _contentNodes() {
    const { content } = this.options;
    if (content === null || content === undefined) return [];
    return (Array.isArray(content) ? content : [content]).map((item) =>
      (item && typeof item === 'object' && typeof item.destroy === 'function')
        ? this.adopt(item)
        : item);
  }

  // ------------------------------------------------------------ API publica

  setContent(content) {
    return this.update({ content });
  }

  /** Lleva el scroll arriba de todo. */
  toTop(smooth = false) {
    this.el?.scrollTo?.({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    return this;
  }

  /** Lleva el scroll al final. */
  toBottom(smooth = false) {
    if (this.el?.scrollTo) {
      this.el.scrollTo({ top: this.el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    }
    return this;
  }
}

Scroll.AXES = AXES;
Scroll.THICKNESS = THICKNESS;
