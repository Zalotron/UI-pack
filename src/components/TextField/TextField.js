import { UIComponent } from '../../core/UIComponent.js';
import { el, cx } from '../../core/dom.js';
import { isKey } from '../../keys.js';

/**
 * TextField — campo de texto.
 *
 *   new TextField({ placeholder: 'Tu nombre' })
 *   new TextField({ multiline: true, rows: 4 })
 *
 * Con `multiline` pasa a <textarea>: es el mismo control conceptual, asi que
 * es un parametro y no una clase aparte.
 */

const SIZES = ['sm', 'md', 'lg'];
const TYPES = ['text', 'password', 'email', 'search', 'url', 'tel'];

export class TextField extends UIComponent {
  static componentName = 'textfield';

  static defaults = {
    value: '',
    placeholder: null,
    /** 'text' | 'password' | 'email' | 'search' | 'url' | 'tel'. Ignorado si multiline. */
    type: 'text',

    /** Pasa a <textarea>. */
    multiline: false,
    /** Alto en lineas, solo con multiline. */
    rows: 3,

    /** 'sm' | 'md' | 'lg' */
    size: 'md',
    /** Ancho. Valor CSS. */
    width: null,
    disabled: false,
    readOnly: false,
    maxLength: null,

    /** En cada tecla. */
    onInput: null,
    /** Al salir del campo o apretar Enter. */
    onChange: null,
    ariaLabel: null,
    className: null,
    dataset: null,
  };

  constructor(options) {
    super(options);
    this.value = String(this.options.value ?? '');
  }

  render() {
    const o = this.options;
    const type = TYPES.includes(o.type) ? o.type : 'text';

    const field = el(o.multiline ? 'textarea' : 'input', {
      class: 'ui-textfield__input',
      ...(o.multiline
        ? { rows: String(o.rows) }
        : { type }),
      placeholder: o.placeholder || undefined,
      disabled: o.disabled,
      readonly: o.readOnly,
      maxlength: o.maxLength ?? undefined,
      'aria-label': o.ariaLabel || undefined,
    });
    // El value de un textarea no es atributo: se asigna como propiedad.
    field.value = this.value;
    this.input = field;

    const node = el('div', {
      class: cx(
        'ui-textfield',
        SIZES.includes(o.size) && `ui-textfield--${o.size}`,
        o.multiline && 'ui-textfield--multiline',
        o.disabled && 'is-disabled',
        o.readOnly && 'is-readonly',
        o.className,
      ),
      style: o.width ? { width: o.width } : null,
      dataset: o.dataset || undefined,
    }, [field]);

    if (!o.disabled && !o.readOnly) {
      this.listen(field, 'input', (event) => {
        this.value = event.target.value;
        this.options.onInput?.(this.value, this);
        this.emit('input', this.value);
      });
      this.listen(field, 'change', () => this._commit(field.value));
      if (!o.multiline) {
        this.listen(field, 'keydown', (event) => {
          if (isKey(event, 'commit')) this._commit(field.value);
        });
      }
    }
    return node;
  }

  _commit(raw) {
    const next = String(raw ?? '');
    const previous = this._committed ?? this.options.value ?? '';
    this.value = next;
    if (next === previous) return this;

    this._committed = next;
    this.options.onChange?.(next, previous, this);
    this.emit('change', { value: next, previous });
    return this;
  }

  get() { return this.value; }

  set(value) {
    this.value = String(value ?? '');
    if (this.input) this.input.value = this.value;
    return this;
  }

  /** Enfoca el campo. */
  focus() {
    this.input?.focus();
    return this;
  }

  onUpdate(patch) {
    if ('value' in patch) this.value = String(patch.value ?? '');
    return false;
  }
}

TextField.SIZES = SIZES;
TextField.TYPES = TYPES;
