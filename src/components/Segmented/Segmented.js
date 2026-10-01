import { UIComponent } from '../../core/UIComponent.js';
import { el, cx } from '../../core/dom.js';
import { Icon } from '../Icon/index.js';

/**
 * Un grupo de botones donde SIEMPRE hay exactamente uno activo.
 *
 * Es el selector de modo de una barra de herramientas: mover / rotar / escalar,
 * o vista de lista / vista de grilla.
 *
 * ```js
 * new Segmented({
 *   options: [
 *     { value: 'move',   label: 'Mover',   icon: 'move' },
 *     { value: 'rotate', label: 'Rotar',   icon: 'refresh' },
 *   ],
 *   value: 'move',
 *   onChange: (valor) => setModo(valor),
 * });
 * ```
 *
 * ⛔ NO ES UN `RadioGroup` CON OTRA PIEL, aunque signifiquen lo mismo. Un radio
 * es un formulario: una lista vertical de opciones con su punto y su rotulo,
 * para elegir y despues enviar. Esto es un CONTROL: se aprieta y el efecto es
 * inmediato, vive apretado en una barra y casi siempre es solo icono. Forzar
 * uno a ser el otro termina en una pila de excepciones.
 *
 * ⛔ Y NO SON BOTONES SUELTOS CON UNA CLASE `is-active`. Para quien usa un
 * lector de pantalla, tres botones independientes son tres acciones sin
 * relacion; aca son UNA pregunta con tres respuestas, y eso se dice con
 * `role="radiogroup"`. De paso trae la navegacion con flechas, que es como se
 * recorre un grupo asi con el teclado.
 */
export class Segmented extends UIComponent {
  static componentName = 'segmented';

  static defaults = {
    /**
     * string[] | { value, label, icon?, iconOnly?, disabled? }[]
     *
     * El `label` es obligatorio aunque se muestre solo el icono: es el nombre
     * accesible del boton.
     *
     * `iconOnly` por ITEM esconde el rotulo de ese solo, para un grupo MIXTO:
     * una opcion con palabra y las otras con icono. Sirve cuando una de las
     * opciones no tiene dibujo que la explique —"todo", "ninguno"— y las demas
     * si. El del grupo sigue mandando sobre todos.
     */
    options: [],

    /** El valor activo. Si no coincide con ninguno, se activa el primero. */
    value: null,

    /**
     * Muestra solo el icono en TODOS. El rotulo pasa a ser el nombre accesible.
     * Para esconder el de uno solo, ver `iconOnly` adentro de cada item.
     */
    iconOnly: false,

    /**
     * Sin aire entre los items.
     *
     * Es para los pares que son UNA decision con dos valores —mundo o local, on
     * u off—: pegados se leen como un interruptor de dos posiciones, y
     * separados como dos botones que casualmente estan al lado.
     */
    compact: false,

    /**
     * Ocupa todo el ancho y REPARTE: cada opcion mide lo mismo.
     *
     * ⛔ NO ES SOLO "mas ancho". Con el ancho natural, cada boton mide lo que
     * mide su palabra —o su icono— y el grupo queda con piezas de tamanos
     * distintos: pesa mas la opcion de nombre largo, que es exactamente lo que
     * un grupo de opciones parejas no tiene que decir. Repartido, las opciones
     * se ven como lo que son: las mismas con distinto nombre.
     */
    fullWidth: false,


    /**
     * 'boxed' (default) -> caja propia: borde, fondo y divisiones.
     * 'bare'            -> sin caja. Solo se marca el activo.
     *
     * 'bare' es para cuando el grupo YA vive adentro de una barra: con su caja
     * propia queda un recuadro adentro de otro y las piezas se leen como de
     * otra familia que los botones de al lado, aunque midan lo mismo.
     */
    variant: 'boxed',

    /** 'sm' | 'md' | 'lg' */
    size: 'md',
    disabled: false,

    onChange: null,
    /** Que se esta eligiendo, para lectores de pantalla. */
    ariaLabel: null,
    className: null,
    dataset: null,
  };

  constructor(options) {
    super(options);
    this.value = this._normalize(this.options.value);
  }

  get items() {
    return this.options.options.map((item) => (
      typeof item === 'string' ? { value: item, label: item } : item
    ));
  }

  render() {
    const o = this.options;
    this.buttons = [];

    const children = this.items.map((item) => {
      const active = item.value === this.value;
      const parts = [];

      if (item.icon) {
        const icon = Icon.has(item.icon)
          ? this.adopt(new Icon({ name: item.icon, size: o.size === 'lg' ? 'md' : 'sm' })).element
          : item.icon;
        parts.push(el('span', { class: 'ui-segmented__icon' }, [icon]));
      }
      /* Solo icono si lo pide el grupo o lo pide el item, y nunca sin icono: un
         boton sin dibujo y sin palabra es un boton vacio. */
      const soloIcono = Boolean(item.icon) && (o.iconOnly || item.iconOnly === true);
      if (!soloIcono) {
        parts.push(el('span', { class: 'ui-segmented__label', text: item.label ?? item.value }));
      }

      const disabled = o.disabled || item.disabled;
      const button = el('button', {
        type: 'button',
        class: cx(
          'ui-segmented__item',
          soloIcono && 'ui-segmented__item--icon-only',
          active && 'is-active',
          disabled && 'is-disabled',
        ),
        role: 'radio',
        'aria-checked': active ? 'true' : 'false',
        'aria-label': soloIcono ? (item.label ?? item.value) : undefined,
        /* Roving tabindex: el grupo entero es UNA parada del tabulador y
           adentro se recorre con las flechas. Con todos en 0, tabular por una
           barra de ocho modos serian ocho paradas. */
        tabindex: active && !disabled ? '0' : '-1',
        disabled: disabled || undefined,
      }, parts);

      button.__value = item.value;
      this.buttons.push(button);

      if (!disabled) this.listen(button, 'click', () => this.set(item.value));
      return button;
    });

    const node = el('div', {
      class: cx(
        'ui-segmented',
        `ui-segmented--${o.size}`,
        `ui-segmented--${o.variant}`,
        o.iconOnly && 'ui-segmented--icon-only',
        o.compact && 'ui-segmented--compact',
        o.fullWidth && 'ui-segmented--full',
        o.disabled && 'is-disabled',
        o.className,
      ),
      role: 'radiogroup',
      'aria-label': o.ariaLabel || undefined,
      dataset: o.dataset || undefined,
    }, children);

    this.listen(node, 'keydown', (event) => this._onKeyDown(event));
    return node;
  }

  _onKeyDown(event) {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    const enabled = this.buttons.filter((button) => !button.disabled);
    if (!enabled.length) return;
    event.preventDefault();

    const current = enabled.findIndex((button) => button.__value === this.value);
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    let next;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = enabled.length - 1;
    else next = (current + (forward ? 1 : -1) + enabled.length) % enabled.length;

    this.set(enabled[next].__value);
    enabled[next].focus?.({ preventScroll: true });
  }

  _normalize(value) {
    const items = this.options.options.map((item) => (
      typeof item === 'string' ? item : item.value
    ));
    return items.includes(value) ? value : items[0];
  }

  // ------------------------------------------------------------ API publica

  get() {
    return this.value;
  }

  /**
   * Cambia el activo SIN re-renderizar: solo se mueven las clases y el ARIA.
   *
   * Un re-render destruiria los botones, y con ellos el foco del teclado: quien
   * esta recorriendo el grupo con las flechas lo perderia en cada paso.
   */
  set(value) {
    const next = this._normalize(value);
    if (next === this.value) return this;
    this.value = next;

    for (const button of this.buttons ?? []) {
      const active = button.__value === next;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-checked', active ? 'true' : 'false');
      button.tabIndex = active && !button.disabled ? 0 : -1;
    }

    this.options.onChange?.(next, this);
    this.emit('change', next);
    return this;
  }

  onUpdate(patch) {
    if ('value' in patch) this.value = this._normalize(patch.value);
    return false;
  }
}

Segmented.SIZES = ['sm', 'md', 'lg'];
