import { UIComponent } from '../../core/UIComponent.js';
import { el, cx, append } from '../../core/dom.js';
import { sortable } from '../../core/reorder.js';
import { Icon } from '../Icon/index.js';

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

/** Acepta { id, label, icon, content, disabled, closable }. `id` cae al indice. */
const normalize = (tab, index) => ({
  id: tab.id ?? String(index),
  label: tab.label ?? String(tab.id ?? index),
  icon: tab.icon ?? null,
  content: tab.content ?? null,
  disabled: !!tab.disabled,
  closable: !!tab.closable,
});

export class Tabs extends UIComponent {
  static componentName = 'tabs';

  static defaults = {
    /** [{ id, label, icon?, content, disabled?, closable? }] */
    tabs: [],
    /** Pestaña activa. null = la primera que no este deshabilitada. */
    value: null,

    /** 'sm' | 'md' | 'lg' */
    size: 'md',
    /** Estira las pestañas para ocupar todo el ancho. */
    stretch: false,

    /**
     * Se pidio cerrar una pestaña: `(id) => ...`.
     *
     * ⛔ CERRAR NO ES ELEGIR. La cruz vive ADENTRO del boton de la pestaña —es
     * donde uno la busca— pero apretarla no tiene que cambiar de pestaña:
     * cerrar la tercera estando en la primera dejaria al usuario parado en un
     * lugar al que no pidio ir. Por eso el gesto se corta ahi y no sube.
     *
     * Quien lo recibe decide: sacar la pestaña de la lista, preguntar antes, o
     * negarse. Este componente no saca nada por su cuenta.
     */
    onClose: null,

    /**
     * Las pestañas se pueden arrastrar para cambiarlas de orden.
     *
     * ⛔ ES UNA CAPACIDAD, NO UN COMPONENTE APARTE. Una fila de pestañas que se
     * reordena sigue siendo una fila de pestañas: no hay nada que envolver ni
     * ningun "TabsReordenables" que mantener en paralelo. El gesto lo pone
     * `core/reorder.js`, que es el mismo motor que usa una lista vertical.
     *
     * Quien las tiene decide si tiene sentido: un editor va a querer recordar
     * el orden, y una lista armada al vuelo capaz que no.
     */
    reorderable: false,

    /**
     * Se solto una pestaña en otro lugar: `(ids) => ...` con el orden nuevo.
     *
     * ⛔ ESTE COMPONENTE NO REORDENA NADA. Igual que con `onClose`: avisa el
     * orden que se pidio y quien recibe decide. Reordenandolas por su cuenta,
     * lo que se ve y lo que el dueño tiene guardado dejan de coincidir al
     * primer re-render.
     */
    onReorder: null,

    /**
     * La fila de pestañas se dibuja AFUERA del componente.
     *
     * El componente queda con los paneles nada mas, y la fila se monta donde
     * quiera quien lo usa: `tabs.listElement`. Es para una ventana cuya BARRA
     * DE TITULO son las pestañas, donde el titulo y el icono no dicen nada que
     * las pestañas no digan mejor.
     *
     * ⛔ LA FILA SIGUE SIENDO DE ESTE COMPONENTE. Se mueve de lugar, no se
     * entrega: las escuchas, el teclado, la rayita y el reordenamiento siguen
     * siendo suyos. Una copia dibujada por afuera seria una segunda verdad
     * sobre cual esta activa.
     *
     * ⛔ Y EL NODO QUE SE ENTREGA ES ESTABLE. Adentro se reemplaza la fila en
     * cada dibujado; si lo que se entregara fuera la fila misma, quien la monto
     * se quedaria con la vieja —desenganchada— al primer cambio de pestañas.
     */
    detachedList: false,

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

  /**
   * Donde se monta la fila de pestañas cuando vive afuera. Ver `detachedList`.
   *
   * Lleva las clases del componente porque las variables de la piel —el alto,
   * la tipografia, los colores— se declaran en la raiz: sin ellas, la fila
   * mudada se dibuja con los valores de fabrica del navegador.
   */
  get listElement() {
    this.listHost ??= el('div', {
      class: cx(
        'ui-tabs',
        'ui-tabs--detached-list',
        SIZES.includes(this.options.size) && `ui-tabs--${this.options.size}`,
      ),
    });
    return this.listHost;
  }

  render() {
    const o = this.options;
    const items = this.items;
    this._releaseReorder?.();
    this._releaseReorder = null;
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
        draggable: o.reorderable && !tab.disabled ? 'true' : undefined,
        /* La identidad que lee el motor de reordenamiento. Es el mismo atributo
           para una fila de pestañas que para una lista vertical: el motor no
           sabe —ni tiene por que saber— que esta moviendo. */
        'data-sort-id': tab.id,
        dataset: { index: String(index) },
      }, [
        tab.icon && Icon.has(tab.icon)
          ? this.adopt(new Icon({ name: tab.icon, size: 'sm' })).element
          : null,
        el('span', { class: 'ui-tabs__label', text: tab.label }),
      ]);

      if (tab.closable) {
        const cruz = el('span', {
          class: 'ui-tabs__close',
          /* ⛔ NO ES UN <button>: estaria ADENTRO del boton de la pestaña, y un
             boton adentro de otro no es marcado valido ni navegable. El
             tabulador llega a la pestaña y el teclado la cierra con Supr; ver
             el `keydown` de `_bind`. */
          role: 'none',
          'aria-hidden': 'true',
          text: '×',
        });
        this.listen(cruz, 'pointerdown', (event) => {
          // Antes del click: asi no se elige la pestaña que se esta cerrando.
          event.stopPropagation();
          event.preventDefault();
          this.options.onClose?.(tab.id, this);
        });
        button.append(cruz);
      }

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

       El carril recorta en los dos ejes, asi que lo que la marca se pase no
       llega al scroller — pero sigue viendose, porque `overflow-clip-margin` le
       deja pintar afuera. Es la unica combinacion que separa las dos cosas: que
       se vea el rebote y que no cuente como contenido. */
    /* ⚠ `role: none` NO es decorativo: un `tablist` tiene que tener las
       pestañas como hijas DIRECTAS en el arbol de accesibilidad. Un div en el
       medio las volveria nietas y el lector de pantalla dejaria de anunciar
       "pestaña 2 de 4". Sacando el carril del arbol, vuelven a ser hijas. */
    const rail = el('div', {
      class: 'ui-tabs__rail',
      role: 'none',
    }, [...tabs, this.indicator]);
    this.rail = rail;

    const list = el('div', {
      class: 'ui-tabs__list',
      role: 'tablist',
      'aria-label': o.ariaLabel || undefined,
    }, [rail]);
    this.list = list;

    /* La fila se va a vivir afuera: se la pone adentro del nodo estable que
       quien usa el componente monto una sola vez. Ver `detachedList`. */
    if (o.detachedList) this.listElement.replaceChildren(list);

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
        /* La raiz se queda SIN su fila: lo dice, porque hay aire que solo tiene
           sentido cuando la fila esta justo arriba. Va aparte del modificador
           de la fila mudada: son dos nodos distintos y cada uno necesita lo
           suyo. */
        o.detachedList && 'ui-tabs--detached',
        o.className,
      ),
      dataset: o.dataset || undefined,
    }, o.detachedList
      ? [el('div', { class: 'ui-tabs__panels' }, panels)]
      : [list, el('div', { class: 'ui-tabs__panels' }, panels)]);

    this._bind(list);
    if (o.reorderable) this._bindReorder(rail, list);
    this._watchSize();
    return node;
  }

  /**
   * ⛔ LA RAYITA SE MIDE CUANDO HAY LAYOUT, Y ESO NO PASA EN `onMount()`.
   *
   * `onMount()` lo llama `mount()`, o sea SOLO el componente raiz. Un Tabs
   * adentro de un Container no se monta: se ADOPTA, y su elemento lo inserta
   * el padre. Nunca pasa por `mount()`, asi que nunca recibia `onMount()` y la
   * rayita se quedaba en ancho 0. Aparecia recien al clickear otra pestaña,
   * porque ahi `_commit()` vuelve a medir y para entonces ya hay layout.
   *
   * Y no alcanza con medir mas tarde una sola vez: el ancho de un boton
   * tambien cambia DESPUES, cuando termina de bajar la tipografia del pack.
   * Un `ResizeObserver` cubre los tres momentos con el mismo codigo — cuando
   * el elemento entra al documento y estrena caja, cuando cambia la fuente y
   * cuando cambia el tamaño de la ventana.
   *
   * Se observan los botones ademas del carril: si las pestañas entran holgadas,
   * el carril mide 100% y no cambia de ancho aunque los rotulos si.
   */
  _watchSize() {
    this._unwatchSize();
    if (typeof ResizeObserver === 'undefined' || !this.rail) return;
    this._resizeObserver = new ResizeObserver(() => this._placeIndicator());
    this._resizeObserver.observe(this.rail);
    for (const button of this.buttons) this._resizeObserver.observe(button);
  }

  _unwatchSize() {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
  }

  onDestroy() {
    this._unwatchSize();
    this._releaseReorder?.();
    this._releaseReorder = null;
    this.listHost?.remove();
    this.listHost = null;
  }

  _track(content) {
    if (content === null || content === undefined) return [];
    return (Array.isArray(content) ? content : [content]).map((item) =>
      (item && typeof item === 'object' && typeof item.destroy === 'function')
        ? this.adopt(item)
        : item);
  }

  /**
   * Enganchar el motor de reordenamiento al carril.
   *
   * ⛔ LA CUENTA NO ES DE ACA. Reordenar una fila horizontal es exactamente la
   * misma geometria que reordenar una columna, girada: vive en `core/reorder.js`
   * y entra por `axis`. Tenerla escrita aca otra vez —que es como empezo en el
   * proyecto donde nacio esto— garantiza que un dia se arregle de un lado y del
   * otro no, sin que nadie se entere porque las dos "andan".
   *
   * ⚠ LA RAYITA SE APAGA MIENTRAS SE ARRASTRA. Vive en el carril pero no es una
   * pestaña, asi que el motor no la mueve: quedaria marcando el lugar donde la
   * activa YA NO esta. Y mientras uno reordena, cual esta activa no es la
   * pregunta.
   */
  _bindReorder(rail, list) {
    this._releaseReorder = sortable({
      list: rail,
      axis: 'x',
      onReorder: (ids) => this.options.onReorder?.(ids, this),
    });
    this.listen(rail, 'dragstart', () => list.classList.add('is-reordering'));
    this.listen(rail, 'dragend', () => list.classList.remove('is-reordering'));
    this.listen(rail, 'drop', () => list.classList.remove('is-reordering'));
  }

  _bind(list) {
    this.listen(list, 'click', (event) => {
      const button = event.target.closest('.ui-tabs__tab');
      if (button && !button.disabled) this._commit(this.items[Number(button.dataset.index)].id);
    });

    // Recorrido con flechas dentro de la lista: el patron de tablist.
    this.listen(list, 'keydown', (event) => {
      /* ⛔ LA CRUZ NO SE PUEDE TABULAR —vive adentro del boton de la pestaña, y
         un boton adentro de otro no es navegable—, asi que cerrar con el
         teclado tiene que estar en algun lado: es Supr sobre la pestaña, como
         en cualquier lista. */
      if (event.key === 'Delete') {
        const actual = this.items.find((tab) => tab.id === this.value);
        if (actual?.closable) {
          event.preventDefault();
          this.options.onClose?.(actual.id, this);
        }
        return;
      }

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
    /* Recien montado ya hay layout: ahora si se puede medir.
       Redundante con el ResizeObserver de `_watchSize()` en cualquier navegador
       —y es ESE el que arregla el caso del Tabs adoptado— pero se queda para
       los entornos que no lo tienen, donde vuelve a ser el unico camino. */
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
