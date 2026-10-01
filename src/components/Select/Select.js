import { UIComponent } from '../../core/UIComponent.js';
import { el, cx, uniqueId } from '../../core/dom.js';
import { isKey } from '../../keys.js';

/**
 * Select — desplegable propio.
 *
 *   new Select({ options: ['uno', 'dos'], value: 'uno' })
 *   new Select({ options: [{ value: 'a', label: 'Opcion A' }], onChange: fn })
 *
 * No usa <select> nativo porque la lista de opciones no se puede estilar.
 * A cambio implementa a mano la semantica completa de combobox: roles ARIA,
 * flechas, Home/End, Enter/Escape, busqueda por tecleo y cierre al clickear
 * afuera.
 */

const SIZES = ['sm', 'md', 'lg'];

/** Acepta ['a','b'] o [{ value, label, disabled }]. */
const normalize = (option) =>
  typeof option === 'object' && option !== null
    ? { value: option.value, label: option.label ?? String(option.value), disabled: !!option.disabled }
    : { value: option, label: String(option), disabled: false };

export class Select extends UIComponent {
  static componentName = 'select';

  static defaults = {
    /** string[] | { value, label, disabled? }[] */
    options: [],
    /** Valor seleccionado. null = ninguno. */
    value: null,
    /** Texto cuando no hay nada elegido. */
    placeholder: 'Elegir…',

    /** 'sm' | 'md' | 'lg' */
    size: 'md',
    /** Ancho. Valor CSS. */
    width: null,
    disabled: false,

    onChange: null,
    ariaLabel: null,
    className: null,
    dataset: null,
  };

  constructor(options) {
    super(options);
    this.value = this.options.value;
    this.open = false;
    this._activeIndex = -1;
    this._typed = '';
    this._typedAt = 0;
  }

  get items() {
    return this.options.options.map(normalize);
  }

  get selected() {
    return this.items.find((item) => item.value === this.value) || null;
  }

  render() {
    const o = this.options;
    const listId = `${this.uid}-list`;
    const items = this.items;

    const label = el('span', {
      class: cx('ui-select__value', !this.selected && 'is-placeholder'),
      text: this.selected ? this.selected.label : o.placeholder,
    });
    this.label = label;

    const trigger = el('button', {
      class: 'ui-select__trigger',
      type: 'button',
      disabled: o.disabled,
      role: 'combobox',
      'aria-haspopup': 'listbox',
      'aria-expanded': 'false',
      'aria-controls': listId,
      'aria-label': o.ariaLabel || undefined,
    }, [label, el('span', { class: 'ui-select__arrow', 'aria-hidden': 'true' })]);
    this.trigger = trigger;

    const list = el('div', {
      class: 'ui-select__list',
      id: listId,
      role: 'listbox',
      hidden: true,
    }, items.map((item, index) => el('div', {
      class: cx(
        'ui-select__option',
        item.value === this.value && 'is-selected',
        item.disabled && 'is-disabled',
      ),
      role: 'option',
      'aria-selected': item.value === this.value ? 'true' : 'false',
      'aria-disabled': item.disabled ? 'true' : undefined,
      dataset: { index: String(index) },
      text: item.label,
    })));
    this.list = list;

    const node = el('div', {
      class: cx(
        'ui-select',
        SIZES.includes(o.size) && `ui-select--${o.size}`,
        o.disabled && 'is-disabled',
        o.className,
      ),
      style: o.width ? { width: o.width } : null,
      dataset: o.dataset || undefined,
    }, [trigger, list]);

    if (!o.disabled) this._bind(node, trigger, list);
    return node;
  }

  _bind(node, trigger, list) {
    this.listen(trigger, 'click', () => this.toggle());

    this.listen(trigger, 'keydown', (event) => {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        if (!this.open) this.show();
        else if (isKey(event, 'activate')) this._chooseActive();
        else this._move(event.key === 'ArrowDown' ? 1 : -1);
        return;
      }
      if (isKey(event, 'cancel') && this.open) {
        event.preventDefault();
        this.hide();
        return;
      }
      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        if (!this.open) this.show();
        this._setActive(event.key === 'Home' ? 0 : this.items.length - 1);
        return;
      }
      // Busqueda por tecleo: escribir salta a la opcion que empieza asi.
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
        this._typeahead(event.key);
      }
    });

    this.listen(list, 'click', (event) => {
      const option = event.target.closest('.ui-select__option');
      if (!option || option.classList.contains('is-disabled')) return;
      this._choose(Number(option.dataset.index));
    });

    // Resaltar con el mouse sin perder el foco del trigger.
    this.listen(list, 'pointermove', (event) => {
      const option = event.target.closest('.ui-select__option');
      if (option && !option.classList.contains('is-disabled')) {
        this._setActive(Number(option.dataset.index), false);
      }
    });

    // Cerrar al clickear afuera. Va en el documento, pero `listen` lo limpia.
    this.listen(document, 'pointerdown', (event) => {
      if (this.open && !node.contains(event.target)) this.hide();
    });
  }

  // ---------------------------------------------------------------- abrir ---

  show() {
    if (this.open || this.options.disabled) return this;
    this.open = true;
    this.list.hidden = false;
    this.el.classList.add('is-open');
    this.trigger.setAttribute('aria-expanded', 'true');
    this._placeList();

    const current = this.items.findIndex((item) => item.value === this.value);
    this._setActive(current >= 0 ? current : this._nextEnabled(-1, 1));
    this.emit('open', this);
    return this;
  }

  hide() {
    if (!this.open) return this;
    this.open = false;
    this.list.hidden = true;
    this.el.classList.remove('is-open', 'ui-select--flip');
    this.trigger.setAttribute('aria-expanded', 'false');
    this._setActive(-1);
    this.emit('close', this);
    return this;
  }

  toggle() {
    return this.open ? this.hide() : this.show();
  }

  /** Si no entra para abajo, se abre para arriba. */
  _placeList() {
    const view = document.defaultView;
    if (!view || !this.el.getBoundingClientRect) return;
    const box = this.el.getBoundingClientRect();
    const below = view.innerHeight - box.bottom;
    const needed = this.list.offsetHeight || 0;
    this.el.classList.toggle('ui-select--flip', needed > below && box.top > below);
  }

  // -------------------------------------------------------------- teclado ---

  _optionNodes() {
    return [...this.list.querySelectorAll('.ui-select__option')];
  }

  _nextEnabled(from, direction) {
    const items = this.items;
    for (let i = 1; i <= items.length; i++) {
      const index = (from + direction * i + items.length * 2) % items.length;
      if (!items[index].disabled) return index;
    }
    return -1;
  }

  _move(direction) {
    this._setActive(this._nextEnabled(this._activeIndex, direction));
  }

  _setActive(index, scroll = true) {
    this._activeIndex = index;
    const nodes = this._optionNodes();
    nodes.forEach((node, i) => node.classList.toggle('is-active', i === index));

    if (index >= 0) {
      this.trigger.setAttribute('aria-activedescendant', `${this.uid}-opt-${index}`);
      nodes[index].id = `${this.uid}-opt-${index}`;
      if (scroll) nodes[index].scrollIntoView?.({ block: 'nearest' });
    } else {
      this.trigger.removeAttribute('aria-activedescendant');
    }
  }

  _typeahead(char) {
    const now = Date.now();
    this._typed = now - this._typedAt > 700 ? char : this._typed + char;
    this._typedAt = now;

    const needle = this._typed.toLowerCase();
    const index = this.items.findIndex(
      (item) => !item.disabled && item.label.toLowerCase().startsWith(needle),
    );
    if (index < 0) return;
    if (!this.open) this._choose(index);
    else this._setActive(index);
  }

  _chooseActive() {
    if (this._activeIndex >= 0) this._choose(this._activeIndex);
    else this.hide();
  }

  // ------------------------------------------------------------- valor ---

  _choose(index) {
    const item = this.items[index];
    if (!item || item.disabled) return this;
    this.hide();
    this.trigger.focus();
    return this.set(item.value);
  }

  get() { return this.value; }

  set(value) {
    if (value === this.value) return this;
    const previous = this.value;
    this.value = value;
    this._sync();
    this.options.onChange?.(value, previous, this);
    this.emit('change', { value, previous });
    return this;
  }

  /** Refleja la seleccion sin re-renderizar. */
  _sync() {
    const selected = this.selected;
    this.label.textContent = selected ? selected.label : this.options.placeholder;
    this.label.classList.toggle('is-placeholder', !selected);

    this._optionNodes().forEach((node, i) => {
      const match = this.items[i].value === this.value;
      node.classList.toggle('is-selected', match);
      node.setAttribute('aria-selected', match ? 'true' : 'false');
    });
    return this;
  }

  onUpdate(patch) {
    if ('value' in patch) this.value = patch.value;
    this.open = false;
    return false;
  }

  onDestroy() {
    this.open = false;
  }
}

Select.SIZES = SIZES;
