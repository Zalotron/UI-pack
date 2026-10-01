import { UIComponent } from '../../core/UIComponent.js';
import { el, cx } from '../../core/dom.js';
import { Icon } from '../Icon/index.js';

/**
 * Button
 *
 *   const btn = new Button({ label: 'Guardar', variant: 'primary' });
 *   btn.on('click', () => console.log('click'));
 *   btn.mount('#app');
 *
 * Este componente es la referencia del patron: copialo como molde.
 */
export class Button extends UIComponent {
  static componentName = 'button';

  static defaults = {
    /**
     * Texto del boton. Sin texto no se dibuja ninguno.
     *
     * ⛔ NO TIENE DEFAULT, Y NO PUEDE TENERLO. Decia 'Button', y eso rompia el
     * caso mas comun que hay despues del boton con texto: el boton de SOLO
     * ICONO. `new Button({ icon: 'save' })` salia con un disquete y la palabra
     * "Button" al lado — y peor: como `label` tenia valor, el componente entendia
     * que NO era solo icono y ni siquiera le daba la caja cuadrada.
     *
     * Un valor de fabrica que es texto visible no es un default: es contenido
     * inventado. Lo que un componente puede dar por sentado es una medida o un
     * color, no una palabra que el usuario va a leer en la pantalla.
     */
    label: null,
    /** 'primary' | 'secondary' | 'ghost' | 'danger' */
    variant: 'primary',
    /** 'sm' | 'md' | 'lg' */
    size: 'md',
    /** Atributo type nativo: 'button' | 'submit' | 'reset'. */
    type: 'button',
    /** Icono: string (emoji / texto), HTMLElement o markup SVG. */
    icon: null,
    /** 'start' | 'end' */
    iconPosition: 'start',
    disabled: false,
    loading: false,
    /** Ocupa todo el ancho disponible. */
    block: false,
    /** Si se define, se renderiza como <a> en vez de <button>. */
    href: null,
    target: null,
    /** Etiqueta accesible, necesaria cuando el boton es solo icono. */
    ariaLabel: null,
    /** Callback directo, alternativa a `.on('click', fn)`. */
    onClick: null,
    /** Clases extra, para engancharle las propias desde donde se use. */
    className: null,
    /** `data-*` propios. Mismo motivo. */
    dataset: null,
  };

  /**
   * Apagar y encender el boton NO vuelve a dibujarlo.
   *
   * ⛔ RE-RENDERIZAR PARA CAMBIAR `disabled` TIENE DOS PROBLEMAS, y el segundo
   * es el grave:
   *   1. reemplaza el nodo, asi que cualquiera que guardara una referencia se
   *      queda con un nodo huerfano;
   *   2. y le SACA EL FOCO a quien lo acababa de apretar — que es justo el caso
   *      en que uno apaga un boton: para que no lo toquen dos veces mientras
   *      algo corre. El teclado se quedaba sin donde estar parado.
   *
   * Solo se atiende `disabled` a solas. `loading` cambia el markup (mete el
   * spinner), asi que ese sigue pasando por el render normal.
   *
   * @returns {boolean} true = ya esta atendido, no hace falta redibujar.
   */
  onUpdate(patch) {
    const claves = Object.keys(patch);
    if (claves.length !== 1 || claves[0] !== 'disabled') return false;

    const node = this.el;
    if (!node) return false;

    const inactive = this.options.disabled || this.options.loading;
    node.classList.toggle('is-disabled', Boolean(inactive));
    if (node.tagName === 'A') {
      // Un <a> no tiene `disabled`: se avisa y se le saca el destino.
      if (inactive) node.setAttribute('aria-disabled', 'true');
      else node.removeAttribute('aria-disabled');
      if (inactive) node.removeAttribute('href');
      else if (this.options.href) node.setAttribute('href', this.options.href);
    } else {
      node.disabled = Boolean(inactive);
    }
    return true;
  }

  render() {
    const o = this.options;
    const isLink = Boolean(o.href);
    const iconOnly = Boolean(o.icon) && !o.label;

    /* ⚠ SIN ROTULO Y SIN NOMBRE ACCESIBLE, EL BOTON NO EXISTE PARA QUIEN NO VE
       EL DIBUJO: un lector de pantalla anuncia "boton" y nada mas. Antes el
       default 'Button' lo tapaba —mal, pero lo tapaba—; sin el, el agujero
       queda a la vista, asi que hay que avisarlo donde se puede arreglar. */
    if (iconOnly && !o.ariaLabel) {
      console.warn('Button: solo icono y sin ariaLabel. Para un lector de pantalla es un boton sin nombre.');
    }
    const inactive = o.disabled || o.loading;

    const node = el(isLink ? 'a' : 'button', {
      class: cx(
        'ui-btn',
        `ui-btn--${o.variant}`,
        `ui-btn--${o.size}`,
        o.block && 'ui-btn--block',
        iconOnly && 'ui-btn--icon-only',
        o.loading && 'is-loading',
        inactive && 'is-disabled',
        o.className,
      ),
      dataset: o.dataset || undefined,
      'aria-label': o.ariaLabel || undefined,
      'aria-busy': o.loading ? 'true' : undefined,
      ...(isLink
        ? {
            href: inactive ? undefined : o.href,
            target: o.target,
            'aria-disabled': inactive ? 'true' : undefined,
          }
        : { type: o.type, disabled: inactive }),
    });

    if (o.loading) {
      node.append(el('span', { class: 'ui-btn__loader', 'aria-hidden': 'true' }));
    }
    if (o.icon && o.iconPosition === 'start') node.append(this._renderIcon(o.icon));
    /* `data-label` repite el texto a proposito: es lo unico que le permite a un
       pack DUPLICAR el rotulo en una capa propia (`content: attr(data-label)`)
       para ponerle detras un contorno, un relieve o una textura sin tocar la
       letra que se lee. Sin el atributo, el texto vive solo adentro del nodo y
       el CSS no tiene como copiarlo. */
    if (o.label) {
      node.append(el('span', {
        class: 'ui-btn__label',
        text: o.label,
        dataset: { label: o.label },
      }));
    }
    if (o.icon && o.iconPosition === 'end') node.append(this._renderIcon(o.icon));

    this.listen(node, 'click', (event) => {
      if (this.options.disabled || this.options.loading) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      this.options.onClick?.(event, this);
      this.emit('click', event);
    });

    return node;
  }

  _renderIcon(icon) {
    /* Un componente, no un nodo: `new Button({ icon: new Icon({...}) })`. Se
       ADOPTA, que es lo que lo hace morir con el boton y entrar animado con
       el. Sin esto habria que pasarle `.element` a mano y el icono quedaria
       huerfano: ni se destruiria ni entraria. */
    if (icon instanceof UIComponent) {
      this.adopt(icon);
      return this._renderIcon(icon.element);
    }
    if (icon instanceof Node) {
      const wrap = el('span', { class: 'ui-btn__icon', 'aria-hidden': 'true' });
      wrap.append(icon);
      return wrap;
    }
    const value = String(icon).trim();

    /* ⛔ UN NOMBRE DEL SET ES UN ICONO, NO UNA PALABRA. `icon: 'save'` dibujaba
       la palabra "save" adentro del boton: la cadena se tomaba siempre como
       texto literal. Y es el caso mas comun que hay, ademas de ser como lo
       aceptan `Tabs` y `Segmented` — tres componentes que reciben "un icono" y
       cada uno entendiendo otra cosa es la clase de inconsistencia que uno
       descubre de a una, en el lugar de uso.

       Se pregunta ANTES de caer a texto, asi que un emoji o una palabra suelta
       siguen andando: ninguno es un nombre del set. */
    if (Icon.has(value)) {
      const dibujo = this.adopt(new Icon({ name: value, size: 'sm' }));
      return this._renderIcon(dibujo.element);
    }

    const key = value.startsWith('<') ? 'html' : 'text';
    return el('span', { class: 'ui-btn__icon', 'aria-hidden': 'true', [key]: value });
  }

  // ------------------------------------------------------------ API publica

  setLabel(label) { return this.update({ label }); }
  setLoading(loading = true) { return this.update({ loading }); }
  setDisabled(disabled = true) { return this.update({ disabled }); }
  setVariant(variant) { return this.update({ variant }); }

  focus() {
    this.element.focus();
    return this;
  }
}
