import { UIComponent } from '../../core/UIComponent.js';
import { el, cx, uniqueId } from '../../core/dom.js';

/**
 * RadioGroup — eleccion unica entre varias opciones.
 *
 *   new RadioGroup({ options: ['uno', 'dos'], value: 'uno' })
 *   new RadioGroup({ options: [{ value: 'a', label: 'Opcion A' }] })
 *
 * El componente es el GRUPO, no cada opcion: un radio suelto no significa
 * nada. El navegador ya resuelve el recorrido con flechas entre radios que
 * comparten `name`, asi que no hace falta manejarlo a mano.
 */

const SIZES = ['sm', 'md', 'lg'];
const ORIENTATIONS = ['vertical', 'horizontal'];

/** Acepta ['a','b'] o [{ value, label, disabled }]. */
const normalize = (option) =>
  typeof option === 'object' && option !== null
    ? { value: option.value, label: option.label ?? String(option.value), disabled: !!option.disabled }
    : { value: option, label: String(option), disabled: false };

export class RadioGroup extends UIComponent {
  static componentName = 'radiogroup';

  static defaults = {
    /** string[] | { value, label, disabled? }[] */
    options: [],
    /** Opcion elegida. null = ninguna. */
    value: null,
    /** Atributo name compartido. null = se genera uno unico. */
    name: null,

    /** 'vertical' | 'horizontal' */
    orientation: 'vertical',
    /** 'sm' | 'md' | 'lg' */
    size: 'md',
    disabled: false,

    onChange: null,
    /** Etiqueta del grupo entero, para lectores de pantalla. */
    ariaLabel: null,
    className: null,
    dataset: null,
  };

  constructor(options) {
    super(options);
    this.value = this.options.value;
    this.name = this.options.name || uniqueId('radio');
  }

  get items() {
    return this.options.options.map(normalize);
  }

  render() {
    const o = this.options;
    this.inputs = [];

    const items = this.items.map((item, index) => {
      const input = el('input', {
        class: 'ui-radio__input',
        type: 'radio',
        name: this.name,
        value: String(item.value),
        checked: item.value === this.value,
        disabled: o.disabled || item.disabled,
        dataset: { index: String(index) },
      });
      this.inputs.push(input);

      return el('label', {
        class: cx(
          'ui-radio',
          item.value === this.value && 'is-checked',
          (o.disabled || item.disabled) && 'is-disabled',
        ),
      }, [
        input,
        el('span', { class: 'ui-radio__dot', 'aria-hidden': 'true' }),
        el('span', { class: 'ui-radio__label', text: item.label }),
      ]);
    });

    const node = el('div', {
      class: cx(
        'ui-radiogroup',
        SIZES.includes(o.size) && `ui-radiogroup--${o.size}`,
        ORIENTATIONS.includes(o.orientation) && `ui-radiogroup--${o.orientation}`,
        o.disabled && 'is-disabled',
        o.className,
      ),
      role: 'radiogroup',
      'aria-label': o.ariaLabel || undefined,
      dataset: o.dataset || undefined,
    }, items);

    if (!o.disabled) {
      this.listen(node, 'change', (event) => {
        const input = event.target.closest('.ui-radio__input');
        if (input) this._commit(this.items[Number(input.dataset.index)].value);
      });
    }
    return node;
  }

  _commit(next) {
    if (next === this.value) return this;
    const previous = this.value;
    this.value = next;
    this._sync();
    this.options.onChange?.(next, previous, this);
    this.emit('change', { value: next, previous });
    return this;
  }

  /** Refleja la seleccion sin re-renderizar. */
  _sync() {
    if (!this.el) return this;
    this.items.forEach((item, index) => {
      const match = item.value === this.value;
      this.inputs[index].checked = match;
      this.inputs[index].closest('.ui-radio').classList.toggle('is-checked', match);
    });
    return this;
  }

  get() { return this.value; }
  set(value) { return this._commit(value); }

  onUpdate(patch) {
    if ('value' in patch) this.value = patch.value;
    return false;
  }
}

RadioGroup.SIZES = SIZES;
RadioGroup.ORIENTATIONS = ORIENTATIONS;
