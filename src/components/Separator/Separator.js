import { UIComponent } from '../../core/UIComponent.js';
import { el, cx } from '../../core/dom.js';

/**
 * Separator — corte entre secciones o entre items.
 *
 *   new Separator()                          // hairline con aire estandar
 *   new Separator({ space: 'lg' })           // corte de seccion grande
 *   new Separator({ label: 'o' })            // con texto al medio
 *   new Separator({ orientation: 'vertical' })
 *
 * Sin `label` renderiza un <hr> (que es la etiqueta semantica correcta para
 * un corte tematico). Con `label` no puede ser <hr> — no admite hijos — asi
 * que pasa a <div role="separator">.
 */

const SPACES = ['none', 'xs', 'sm', 'md', 'lg', 'xl'];
const TONES = ['soft', 'base', 'strong', 'accent'];

export class Separator extends UIComponent {
  static componentName = 'separator';

  static defaults = {
    /** 'horizontal' | 'vertical' */
    orientation: 'horizontal',
    /** 'soft' | 'base' | 'strong' | 'accent' — intensidad de la linea. */
    tone: 'soft',
    /** Aire a los lados del corte: 'none'..'xl' o valor CSS. */
    space: 'md',
    /** Grosor de la linea. Valor CSS. */
    thickness: null,
    /** Recorte en los extremos, para que no llegue al borde. Valor CSS. */
    inset: null,
    /**
     * Desvanecido de la linea en los extremos.
     *   true  -> usa la distancia del pack (--ui-sep-fade)
     *   false -> linea pareja de punta a punta
     *   valor CSS ('20%', '40px') -> distancia propia
     */
    fade: true,
    /** Texto opcional en el medio del corte. */
    label: null,
    /** Clases extra. */
    className: null,
    /** `data-*` propios. */
    dataset: null,
  };

  render() {
    const o = this.options;
    const hasLabel = o.label !== null && o.label !== undefined && o.label !== '';
    // <hr> no admite hijos: con label hay que bajar a div + role.
    const tag = hasLabel ? 'div' : 'hr';

    const node = el(tag, {
      class: cx(
        'ui-separator',
        `ui-separator--${o.orientation}`,
        TONES.includes(o.tone) && `ui-separator--${o.tone}`,
        SPACES.includes(o.space) && `ui-separator--space-${o.space}`,
        o.fade && 'ui-separator--fade',
        hasLabel && 'ui-separator--labeled',
        o.className,
      ),
      style: this._cssVars(),
      dataset: o.dataset || undefined,
      role: hasLabel ? 'separator' : undefined,
      'aria-orientation': o.orientation === 'vertical' ? 'vertical' : undefined,
    });

    if (hasLabel) {
      node.append(el('span', { class: 'ui-separator__label', text: o.label }));
    }

    return node;
  }

  _cssVars() {
    const o = this.options;
    const vars = {};
    if (o.space !== null && o.space !== undefined && !SPACES.includes(o.space)) {
      vars['--separator-space'] = String(o.space);
    }
    if (o.thickness) vars['--separator-thickness'] = String(o.thickness);
    if (o.inset) vars['--separator-inset'] = String(o.inset);
    // `true` deja el valor del pack; un valor CSS pisa la distancia.
    if (o.fade && o.fade !== true) vars['--separator-fade'] = String(o.fade);
    return Object.keys(vars).length ? vars : null;
  }

  setTone(tone) { return this.update({ tone }); }
  setSpace(space) { return this.update({ space }); }
  setFade(fade) { return this.update({ fade }); }
}

Separator.SPACES = SPACES;
Separator.TONES = TONES;
