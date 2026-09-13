import { UIComponent } from '../../core/UIComponent.js';
import { el, cx } from '../../core/dom.js';

/**
 * Checkbox — casilla de verificacion, con estado intermedio.
 *
 *   new Checkbox({ label: 'Acepto', checked: true })
 *   new Checkbox({ label: 'Todos', indeterminate: true })
 *
 * Por debajo es un <input type="checkbox"> real. El estado intermedio no se
 * puede poner por atributo: es una propiedad del elemento, asi que se asigna
 * a mano en cada render y en cada cambio.
 */

const SIZES = ['sm', 'md', 'lg'];
const LABEL_POSITIONS = ['start', 'end'];

export class Checkbox extends UIComponent {
  static componentName = 'checkbox';

  static defaults = {
    checked: false,
    /** Estado intermedio (ni si ni no). Gana visualmente sobre `checked`. */
    indeterminate: false,
    /** Texto al costado. null = sin texto (conviene pasar ariaLabel). */
    label: null,
    /** 'start' | 'end' */
    labelPosition: 'end',

    /** 'sm' | 'md' | 'lg' */
    size: 'md',
    disabled: false,
    name: null,
    value: null,

    onChange: null,
    ariaLabel: null,
    className: null,
    dataset: null,
  };

  constructor(options) {
    super(options);
    this.checked = Boolean(this.options.checked);
    this.indeterminate = Boolean(this.options.indeterminate);
  }

  render() {
    const o = this.options;

    const input = el('input', {
      class: 'ui-checkbox__input',
      type: 'checkbox',
      checked: this.checked,
      disabled: o.disabled,
      name: o.name || undefined,
      value: o.value ?? undefined,
      'aria-label': o.ariaLabel || undefined,
    });
    // `indeterminate` es propiedad, no atributo: no se puede setear en el HTML.
    input.indeterminate = this.indeterminate;
    this.input = input;

    const box = el('span', { class: 'ui-checkbox__box', 'aria-hidden': 'true' }, [
      el('span', { class: 'ui-checkbox__mark' }),
    ]);

    const label = o.label
      ? el('span', { class: 'ui-checkbox__label', text: o.label })
      : null;

    const node = el('label', {
      class: cx(
        'ui-checkbox',
        SIZES.includes(o.size) && `ui-checkbox--${o.size}`,
        LABEL_POSITIONS.includes(o.labelPosition) && `ui-checkbox--label-${o.labelPosition}`,
        this.checked && !this.indeterminate && 'is-checked',
        this.indeterminate && 'is-indeterminate',
        o.disabled && 'is-disabled',
        o.className,
      ),
      dataset: o.dataset || undefined,
    }, [input, box, label]);

    if (!o.disabled) {
      this.listen(input, 'change', (event) => {
        // Marcar sale siempre del intermedio.
        this.indeterminate = false;
        this._commit(event.target.checked);
      });
    }
    return node;
  }

  _commit(next) {
    const value = Boolean(next);
    const changed = value !== this.checked;
    const previous = this.checked;
    this.checked = value;
    this._sync();
    if (!changed) return this;

    this.options.onChange?.(value, previous, this);
    this.emit('change', { value, previous });
    return this;
  }

  /** Refleja el estado sin re-renderizar. */
  _sync() {
    if (!this.el) return this;
    this.input.checked = this.checked;
    this.input.indeterminate = this.indeterminate;
    this.el.classList.toggle('is-checked', this.checked && !this.indeterminate);
    this.el.classList.toggle('is-indeterminate', this.indeterminate);
    return this;
  }

  get() { return this.checked; }
  set(checked) { this.indeterminate = false; return this._commit(checked); }
  toggle() { return this.set(!this.checked); }

  /** Pone o saca el estado intermedio sin tocar `checked`. */
  setIndeterminate(value = true) {
    this.indeterminate = Boolean(value);
    return this._sync();
  }

  onUpdate(patch) {
    if ('checked' in patch) this.checked = Boolean(patch.checked);
    if ('indeterminate' in patch) this.indeterminate = Boolean(patch.indeterminate);
    return false;
  }
}

Checkbox.SIZES = SIZES;
