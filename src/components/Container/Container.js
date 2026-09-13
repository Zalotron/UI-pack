import { UIComponent } from '../../core/UIComponent.js';
import { el, cx, append } from '../../core/dom.js';

/**
 * Container — la superficie donde se pone todo lo demas.
 *
 *   new Container({ content: 'Hola' }).mount('#app');
 *
 *   new Container({
 *     layout: 'grid', columns: 2, variant: 'ghost', padding: 'none',
 *     content: [
 *       new Container({ content: 'A' }),
 *       new Container({ content: 'B' }),
 *     ],
 *   });
 *
 * Es la clase base de composicion: una grilla de tarjetas son Containers
 * adentro de un Container, no un componente nuevo.
 *
 * REGLA: si necesitas controlar algo que esta clase no expone, se agrega
 * como opcion ACA. Nunca estilos inline ni CSS suelto en el lugar de uso.
 */

/** Escalas declaradas en Container.css. Fuera de estas, el valor pasa crudo. */
const SPACE_SIZES = ['none', 'xs', 'sm', 'md', 'lg', 'xl'];
const RADIUS_SIZES = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'full', 'circle'];
const ELEVATIONS = ['none', 'sm', 'md', 'lg'];
const LAYOUTS = ['stack', 'row', 'grid', 'flow'];
const VARIANTS = ['panel', 'solid', 'outline', 'ghost'];
const ALIGNMENTS = ['start', 'center', 'end'];

export class Container extends UIComponent {
  static componentName = 'container';

  static defaults = {
    // ------------------------------------------------------------ contenido
    /** string | Node | UIComponent | array de cualquiera de esos. */
    content: null,
    /** Etiqueta del nodo raiz: 'div' | 'section' | 'article' | 'li' | 'aside'... */
    tag: 'div',

    // ------------------------------------------------------------ superficie
    /** 'panel' (degrade + hairline) | 'solid' | 'outline' | 'ghost' */
    variant: 'panel',
    /** Dibuja el borde. */
    border: true,
    /** 'none' | 'sm' | 'md' | 'lg' */
    elevation: 'none',
    /**
     * null  -> sigue la escala global (config.ROUNDNESS)
     * 'xs'..'xl' | 'full' | 'circle' | 'none' | cualquier valor CSS
     */
    radius: null,

    // ------------------------------------------ espacio interno (inner margin)
    /** 'none'|'xs'|'sm'|'md'|'lg'|'xl' o valor CSS crudo. Afecta ambos ejes. */
    padding: 'md',
    /** Override del eje vertical. Misma escala. */
    paddingBlock: null,
    /** Override del eje horizontal. Misma escala. */
    paddingInline: null,

    // ------------------------------------------------------ layout de hijos
    /**
     * 'stack' -> columna (default)
     * 'row'   -> fila, con wrap (ver `wrap`)
     * 'grid'  -> grilla
     * 'flow'  -> display block, flujo normal del documento
     */
    layout: 'stack',
    /** Separacion entre hijos. Misma escala que padding, o valor CSS. */
    gap: 'sm',
    /**
     * Solo para `layout: 'row'`. En `true` (default) los hijos bajan de linea
     * cuando no entran, que es lo que quiere una fila de controles.
     *
     * En `false` la fila NO se parte nunca. Hace falta para una columna de
     * aplicacion —un panel fijo al costado y el contenido al lado— donde bajar
     * de linea no es adaptarse, es romperse.
     */
    wrap: true,
    /** Alineacion del TEXTO: 'start' | 'center' | 'end'. */
    align: 'center',
    /** align-items crudo (alineacion de los hijos en el eje transversal). */
    items: null,
    /** justify-content crudo. */
    justify: null,
    /** Solo layout 'grid': cantidad fija de columnas. null = auto-fit responsive. */
    columns: null,
    /** Solo layout 'grid' sin `columns`: ancho minimo de columna antes de bajar. */
    columnMin: null,

    // ---------------------------------------------------------------- medidas
    width: null,
    maxWidth: null,
    height: null,
    /**
     * Alto MINIMO. No es lo mismo que `height`: con un alto fijo, un contenido
     * mas largo se desborda; con un minimo, el contenedor ocupa todo lo que
     * pueda y crece si hace falta. Es lo que quiere un panel lateral.
     */
    minHeight: null,
    /** Ocupa el 100% del ancho disponible. */
    fullWidth: false,

    // ------------------------------------------- espacio externo (margenes)
    /** Valor CSS. Afecta los cuatro lados. */
    margin: null,
    /** Valor CSS. Eje vertical. */
    marginBlock: null,
    /** Valor CSS. Eje horizontal. 'auto' centra el contenedor. */
    marginInline: null,

    // ----------------------------------------------------------- interaccion
    /** Cursor, hover y foco por teclado. Se activa solo si hay onClick o href. */
    interactive: false,
    /** Si se define, el contenedor entero es un <a>. */
    href: null,
    target: null,
    onClick: null,

    // ------------------------------------------------------------ accesorios
    /** Clases extra, para composicion desde afuera. */
    className: null,
    ariaLabel: null,
    role: null,
    /** Objeto -> data-* en el nodo raiz. */
    dataset: null,
  };

  render() {
    const o = this.options;
    const isLink = Boolean(o.href);
    const clickable = Boolean(o.onClick) || isLink || o.interactive;
    const tag = isLink ? 'a' : o.tag;

    // Un contenedor clickeable que no es <a> ni <button> necesita rol y foco
    // propios, si no es invisible para teclado y lectores de pantalla.
    const needsButtonSemantics = clickable && !isLink && !['button', 'a'].includes(tag);

    const node = el(tag, {
      class: cx(
        'ui-container',
        `ui-container--${o.variant}`,
        o.layout === 'row' && !o.wrap && 'ui-container--nowrap',
        `ui-container--layout-${o.layout}`,
        SPACE_SIZES.includes(o.padding) && `ui-container--pad-${o.padding}`,
        SPACE_SIZES.includes(o.paddingBlock) && `ui-container--padblock-${o.paddingBlock}`,
        SPACE_SIZES.includes(o.paddingInline) && `ui-container--padinline-${o.paddingInline}`,
        SPACE_SIZES.includes(o.gap) && `ui-container--gap-${o.gap}`,
        RADIUS_SIZES.includes(o.radius) && `ui-container--radius-${o.radius}`,
        o.elevation && o.elevation !== 'none' && `ui-container--elev-${o.elevation}`,
        ALIGNMENTS.includes(o.align) && `ui-container--align-${o.align}`,
        o.columns != null && 'ui-container--fixed-columns',
        !o.border && 'ui-container--no-border',
        o.fullWidth && 'ui-container--full',
        clickable && 'is-interactive',
        o.className,
      ),
      style: this._cssVars(),
      role: o.role || (needsButtonSemantics ? 'button' : undefined),
      tabindex: needsButtonSemantics ? '0' : undefined,
      'aria-label': o.ariaLabel || undefined,
      dataset: o.dataset || undefined,
      ...(isLink ? { href: o.href, target: o.target } : {}),
    });

    append(node, this._contentNodes());

    if (clickable) {
      this.listen(node, 'click', (event) => this._activate(event));

      if (needsButtonSemantics) {
        this.listen(node, 'keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this._activate(event);
          }
        });
      }
    }

    return node;
  }

  // ------------------------------------------------------------------ interno

  _activate(event) {
    this.options.onClick?.(event, this);
    this.emit('click', event);
  }

  /**
   * Valores que no entran en una escala predefinida viajan como variables CSS
   * inline. Todo lo enumerado se resuelve con clases modificadoras, asi el CSS
   * queda declarativo y sobreescribible desde afuera.
   */
  _cssVars() {
    const o = this.options;
    const vars = {};
    const raw = (value, sizes) =>
      value !== null && value !== undefined && !sizes.includes(value) ? String(value) : null;

    const pad = raw(o.padding, SPACE_SIZES);
    if (pad) {
      vars['--container-pad-block'] = pad;
      vars['--container-pad-inline'] = pad;
    }
    const padBlock = raw(o.paddingBlock, SPACE_SIZES);
    if (padBlock) vars['--container-pad-block'] = padBlock;
    const padInline = raw(o.paddingInline, SPACE_SIZES);
    if (padInline) vars['--container-pad-inline'] = padInline;

    const gap = raw(o.gap, SPACE_SIZES);
    if (gap) vars['--container-gap'] = gap;

    const radius = raw(o.radius, RADIUS_SIZES);
    if (radius) vars['--container-radius'] = radius;

    if (o.columns != null) vars['--container-columns'] = String(o.columns);
    if (o.columnMin) vars['--container-column-min'] = o.columnMin;

    if (o.items) vars['align-items'] = o.items;
    if (o.justify) vars['justify-content'] = o.justify;
    if (o.width) vars.width = o.width;
    if (o.maxWidth) vars.maxWidth = o.maxWidth;
    if (o.height) vars.height = o.height;
    if (o.minHeight) vars.minHeight = o.minHeight;

    if (o.margin) vars.margin = o.margin;
    if (o.marginBlock) vars.marginBlock = o.marginBlock;
    if (o.marginInline) vars.marginInline = o.marginInline;

    return Object.keys(vars).length ? vars : null;
  }

  /** Normaliza `content` y adopta los subcomponentes para que mueran con este. */
  _contentNodes() {
    const { content } = this.options;
    if (content === null || content === undefined) return [];
    return (Array.isArray(content) ? content : [content]).map((item) => this._track(item));
  }

  _track(item) {
    if (item && typeof item === 'object' && typeof item.destroy === 'function') {
      return this.adopt(item);
    }
    return item;
  }

  // ------------------------------------------------------------ API publica

  /** Reemplaza todo el contenido. */
  setContent(content) {
    return this.update({ content });
  }

  /**
   * Agrega hijos al final sin re-renderizar el contenedor.
   * Quedan guardados en `options.content`, asi sobreviven a un `update()`.
   */
  add(...children) {
    const incoming = children.flat();
    if (!incoming.length) return this;

    const current = this.options.content;
    const list = current === null || current === undefined
      ? []
      : (Array.isArray(current) ? current : [current]);

    this.options.content = [...list, ...incoming];
    if (this.el) append(this.el, incoming.map((item) => this._track(item)));
    return this;
  }

  /** Vacia el contenedor y destruye los subcomponentes que tenia adentro. */
  empty() {
    for (const child of this._children) child.destroy?.();
    this._children = [];
    return this.update({ content: null });
  }

  setPadding(padding) { return this.update({ padding }); }
  setVariant(variant) { return this.update({ variant }); }
  setLayout(layout) { return this.update({ layout }); }
}

// Se exportan para que quien consuma la libreria pueda validar o construir UI
// de configuracion (el catalogo los usa para armar la tabla de opciones).
Container.SPACE_SIZES = SPACE_SIZES;
Container.RADIUS_SIZES = RADIUS_SIZES;
Container.ELEVATIONS = ELEVATIONS;
Container.LAYOUTS = LAYOUTS;
Container.VARIANTS = VARIANTS;
Container.ALIGNMENTS = ALIGNMENTS;
