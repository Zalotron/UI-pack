import { UIComponent } from '../../core/UIComponent.js';
import { el, cx } from '../../core/dom.js';

/**
 * Toggle — interruptor de encendido/apagado.
 *
 *   new Toggle({ checked: true, label: 'Modo oscuro' })
 *
 * Por debajo es un <input type="checkbox" role="switch"> real: el teclado, el
 * foco y los lectores de pantalla funcionan solos. El input va transparente
 * encima y el aspecto lo ponen la pista y el tirador.
 */

const SIZES = ['sm', 'md', 'lg'];
const LABEL_POSITIONS = ['start', 'end'];

export class Toggle extends UIComponent {
  static componentName = 'toggle';

  static defaults = {
    /** Estado. */
    checked: false,
    /** Texto al costado. null = sin texto (conviene pasar ariaLabel). */
    label: null,
    /** 'start' | 'end' — de que lado va el texto. */
    labelPosition: 'end',

    /** 'sm' | 'md' | 'lg' */
    size: 'md',
    disabled: false,
    /** Atributos de formulario. */
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
  }

  render() {
    const o = this.options;

    const input = el('input', {
      class: 'ui-toggle__input',
      type: 'checkbox',
      role: 'switch',
      checked: this.checked,
      disabled: o.disabled,
      name: o.name || undefined,
      value: o.value ?? undefined,
      'aria-label': o.ariaLabel || undefined,
    });
    this.input = input;

    const track = el('span', { class: 'ui-toggle__track', 'aria-hidden': 'true' }, [
      el('span', { class: 'ui-toggle__knob' }),
    ]);

    const label = o.label
      ? el('span', { class: 'ui-toggle__label', text: o.label })
      : null;

    const node = el('label', {
      class: cx(
        'ui-toggle',
        SIZES.includes(o.size) && `ui-toggle--${o.size}`,
        LABEL_POSITIONS.includes(o.labelPosition) && `ui-toggle--label-${o.labelPosition}`,
        this.checked && 'is-checked',
        o.disabled && 'is-disabled',
        o.className,
      ),
      dataset: o.dataset || undefined,
    }, [input, track, label]);

    if (!o.disabled) {
      this.listen(input, 'change', (event) => this._commit(event.target.checked));
    }
    return node;
  }

  _commit(next) {
    const value = Boolean(next);
    if (value === this.checked) return this;

    const previous = this.checked;
    this.checked = value;
    this._sync();
    this.options.onChange?.(value, previous, this);
    this.emit('change', { value, previous });
    return this;
  }

  /** Refleja el estado sin re-renderizar. */
  _sync() {
    if (!this.el) return this;
    this.input.checked = this.checked;
    this.el.classList.toggle('is-checked', this.checked);
    return this;
  }

  get() { return this.checked; }
  set(checked) { return this._commit(checked); }
  toggle() { return this._commit(!this.checked); }

  onUpdate(patch) {
    if ('checked' in patch) this.checked = Boolean(patch.checked);
    return false;
  }
}

Toggle.SIZES = SIZES;
