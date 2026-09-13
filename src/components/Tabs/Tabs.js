import { UIComponent } from '../../core/UIComponent.js';
import { el, cx, append } from '../../core/dom.js';

/**
 * Tabs — pestañas.
 *
 *   new Tabs({ tabs: [
 *     { id: 'uno', label: 'Uno', content: algo },
 *     { id: 'dos', label: 'Dos', content: otra },
 *   ]})
 *
 * Los paneles se renderizan TODOS y se ocultan los inactivos, asi cambiar de
 * pestaña no pierde el estado de lo que hay adentro (un texto a medio
 * escribir, un scroll).
 *
 * La rayita que marca la pestaña activa se posiciona midiendo el boton y
 * escribiendo dos variables CSS: se desliza sola sin re-renderizar.
 */

const SIZES = ['sm', 'md', 'lg'];

/** Acepta { id, label, content, disabled }. `id` cae al indice si falta. */
const normalize = (tab, index) => ({
  id: tab.id ?? String(index),
  label: tab.label ?? String(tab.id ?? index),
  content: tab.content ?? null,
  disabled: !!tab.disabled,
});

export class Tabs extends UIComponent {
  static componentName = 'tabs';

  static defaults = {
    /** [{ id, label, content, disabled? }] */
    tabs: [],
    /** Pestaña activa. null = la primera que no este deshabilitada. */
    value: null,

    /** 'sm' | 'md' | 'lg' */
    size: 'md',
    /** Estira las pestañas para ocupar todo el ancho. */
    stretch: false,

    onChange: null,
    ariaLabel: null,
    className: null,
    dataset: null,
  };

  constructor(options) {
    super(options);
    const items = this.items;
    const wanted = items.find((tab) => tab.id === this.options.value && !tab.disabled);
    this.value = (wanted || items.find((tab) => !tab.disabled) || items[0])?.id ?? null;
  }

  get items() {
    return this.options.tabs.map(normalize);
  }

  render() {
    const o = this.options;
    const items = this.items;
    this.buttons = [];
    this.panels = [];

    const tabs = items.map((tab, index) => {
      const button = el('button', {
        class: cx('ui-tabs__tab', tab.id === this.value && 'is-active', tab.disabled && 'is-disabled'),
        type: 'button',
        role: 'tab',
        id: `${this.uid}-tab-${index}`,
        'aria-controls': `${this.uid}-panel-${index}`,
        'aria-selected': tab.id === this.value ? 'true' : 'false',
        // Solo la activa entra en el recorrido del tabulador: adentro se
        // navega con las flechas. Es el patron de tablist.
        tabindex: tab.id === this.value ? '0' : '-1',
        disabled: tab.disabled,
        dataset: { index: String(index) },
        text: tab.label,
      });
      this.buttons.push(button);
      return button;
    });

    this.indicator = el('span', { class: 'ui-tabs__indicator', 'aria-hidden': 'true' });

    /* ⛔ LAS PESTAÑAS Y LA MARCA VAN EN UN CARRIL, NO SUELTAS EN EL SCROLLER.
       La marca es DECORACION y no puede opinar sobre cuanto hay para scrollear.
       Suelta adentro del scroller si opinaba: un pack con rebote —clay— la hace
       pasarse de largo al llegar a la ultima pestaña, y esa fraccion de segundo
       en que se sale del contenido le agranda el ancho scrolleable al
       contenedor. La barra horizontal aparecia y desaparecia de golpe.

       El carril recorta en el eje X, asi que lo que la marca se pase no llega
       al scroller — pero sigue viendose, porque `overflow-clip-margin` le deja
       pintar afuera. Es la unica combinacion que separa las dos cosas: que se
       vea el rebote y que no cuente como contenido. */
    /* ⚠ `role: none` NO es decorativo: un `tablist` tiene que tener las
       pestañas como hijas DIRECTAS en el arbol de accesibilidad. Un div en el
       medio las volveria nietas y el lector de pantalla dejaria de anunciar
       "pestaña 2 de 4". Sacando el carril del arbol, vuelven a ser hijas. */
    const rail = el('div', {
      class: 'ui-tabs__rail',
      role: 'none',
    }, [...tabs, this.indicator]);

    const list = el('div', {
      class: 'ui-tabs__list',
      role: 'tablist',
      'aria-label': o.ariaLabel || undefined,
    }, [rail]);
    this.list = list;

    const panels = items.map((tab, index) => {
      const panel = el('div', {
        class: 'ui-tabs__panel',
        role: 'tabpanel',
        id: `${this.uid}-panel-${index}`,
        'aria-labelledby': `${this.uid}-tab-${index}`,
        hidden: tab.id !== this.value,
      });
      append(panel, this._track(tab.content));
      this.panels.push(panel);
      return panel;
    });

    const node = el('div', {
      class: cx(
        'ui-tabs',
        SIZES.includes(o.size) && `ui-tabs--${o.size}`,
        o.stretch && 'ui-tabs--stretch',
        o.className,
      ),
      dataset: o.dataset || undefined,
    }, [list, el('div', { class: 'ui-tabs__panels' }, panels)]);

    this._bind(list);
    return node;
  }

  _track(content) {
    if (content === null || content === undefined) return [];
    return (Array.isArray(content) ? content : [content]).map((item) =>
      (item && typeof item === 'object' && typeof item.destroy === 'function')
        ? this.adopt(item)
        : item);
  }

  _bind(list) {
    this.listen(list, 'click', (event) => {
      const button = event.target.closest('.ui-tabs__tab');
      if (button && !button.disabled) this._commit(this.items[Number(button.dataset.index)].id);
    });

    // Recorrido con flechas dentro de la lista: el patron de tablist.
    this.listen(list, 'keydown', (event) => {
      const moves = { ArrowRight: 1, ArrowLeft: -1, Home: 'first', End: 'last' };
      const move = moves[event.key];
      if (move === undefined) return;
      event.preventDefault();

      const items = this.items;
      const current = items.findIndex((tab) => tab.id === this.value);
      let next;
      if (move === 'first') next = this._nextEnabled(-1, 1);
      else if (move === 'last') next = this._nextEnabled(items.length, -1);
      else next = this._nextEnabled(current, move);

      if (next >= 0) {
        this._commit(items[next].id);
        this.buttons[next].focus();
      }
    });
  }

  _nextEnabled(from, direction) {
    const items = this.items;
    if (!items.length) return -1;
    for (let i = 1; i <= items.length; i++) {
      const index = (from + direction * i + items.length * 2) % items.length;
      if (!items[index].disabled) return index;
    }
    return -1;
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

  /** Refleja la pestaña activa sin re-renderizar. */
  _sync() {
    if (!this.el) return this;
    this.items.forEach((tab, index) => {
      const active = tab.id === this.value;
      this.buttons[index].classList.toggle('is-active', active);
      this.buttons[index].setAttribute('aria-selected', active ? 'true' : 'false');
      this.buttons[index].tabIndex = active ? 0 : -1;
      this.panels[index].hidden = !active;
    });
    this._placeIndicator();
    return this;
  }

  /**
   * La rayita se posiciona midiendo el boton activo. Si el layout todavia no
   * se calculo (ancho 0), se deja como esta: no hay nada util que medir.
   */
  _placeIndicator() {
    if (!this.indicator) return this;
    const index = this.items.findIndex((tab) => tab.id === this.value);
    const button = this.buttons[index];
    if (!button || !button.offsetWidth) return this;

    this.list.style.setProperty('--tabs-indicator-x', `${button.offsetLeft}px`);
    this.list.style.setProperty('--tabs-indicator-w', `${button.offsetWidth}px`);
    return this;
  }

  onMount() {
    // Recien montado ya hay layout: ahora si se puede medir.
    this._placeIndicator();
  }

  get() { return this.value; }
  set(value) { return this._commit(value); }

  onUpdate(patch) {
    if ('value' in patch) this.value = patch.value;
    return false;
  }
}

Tabs.SIZES = SIZES;
