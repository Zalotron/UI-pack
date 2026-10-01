import { UIComponent } from '../../core/UIComponent.js';
import { el, cx } from '../../core/dom.js';
import { Icon } from '../Icon/index.js';
import { wireRename } from '../../core/rename.js';
import { isKey } from '../../keys.js';

/**
 * Una ficha de catalogo: icono, nombre, y opcionalmente se arrastra.
 *
 * Es lo que llena un panel de contenido —la lista de cosas que se pueden traer
 * a un lienzo— y por eso nace sabiendo arrastrarse.
 *
 * ```js
 * new Tile({
 *   label: 'Cubo',
 *   icon: 'grid',
 *   layout: 'stack',
 *   draggable: true,
 *   dragValue: 'box',
 *   onActivate: () => agregar('box'),
 * });
 * ```
 *
 * ⛔ SE ACTIVA CON EL TECLADO. Arrastrar no es accesible: no hay forma de
 * hacerlo con el teclado. Si la ficha solo se arrastrara, para quien navega con
 * teclado el panel entero no existiria. Por eso entra en el recorrido de
 * tabulacion y Enter y Espacio hacen lo mismo que el click; arrastrar queda
 * como el atajo del puntero.
 *
 * ⛔ Y POR ESO NO ES UN <button>, aunque se comporte como uno. Una ficha lleva
 * contenido adentro —un icono, dos lineas de texto, y el dia de mañana su
 * nombre en edicion— y un campo adentro de un boton no es HTML valido: el
 * navegador lo saca de lugar y el foco rebota. Se declara `role="button"` y se
 * le pone el teclado a mano, que es exactamente lo que el boton daba gratis.
 */
export class Tile extends UIComponent {
  static componentName = 'tile';

  static defaults = {
    /** Nombre visible. */
    label: '',
    /** Nombre de icono del pack, markup SVG o un Node. */
    icon: null,
    /** Segunda linea, mas chica y apagada. */
    description: null,

    /**
     * 'row'   -> icono a la izquierda y nombre al lado. Una fila densa.
     * 'stack' -> icono arriba y nombre debajo. La ficha de un panel de
     *            contenido, que es la que se acomoda en renglones.
     */
    layout: 'row',
    /** 'sm' | 'md' | 'lg' */
    size: 'md',

    /**
     * A que nivel cuelga, en un arbol. 0 es la raiz.
     *
     * ⛔ ES UNA OPCION Y NO UN MARGEN PUESTO A MANO porque la sangria TIENE QUE
     * COINCIDIR con la que usa `sortableTree` para dibujar la raya que dice
     * donde va a caer una fila. Con dos numeros sueltos —uno en el margen y
     * otro en el motor— la raya promete un nivel y la fila aparece en otro, y
     * el sintoma no se parece a la causa.
     *
     * Los dos salen del mismo lado: aca de `--ui-tile-indent` y alla del
     * `indent` que recibe el motor. Si alguna vez hay que cambiarla, se cambian
     * las dos.
     */
    depth: 0,

    /** Marca la ficha como elegida. */
    selected: false,
    disabled: false,

    /**
     * El nombre se puede cambiar EN EL LUGAR.
     *
     * Dos vias, siempre las dos: doble click SOBRE EL NOMBRE, y la tecla de
     * renombrar con la ficha enfocada —F2 de fabrica, y cual es lo decide
     * `src/keys.js`—.
     *
     * ⛔ ES UN INTERRUPTOR PORQUE NO SIEMPRE CORRESPONDE. Una ficha de catalogo
     * de cosas que se pueden traer al lienzo no se renombra: el nombre es de la
     * clase, no de la ficha. Una fila de archivos del proyecto si. Quien arma
     * la lista es el unico que sabe cual de las dos es.
     *
     * ⛔ Y EL DOBLE CLICK ES EN EL NOMBRE, NO EN LA FICHA. En un explorador el
     * doble click sobre la fila ABRE y el del nombre RENOMBRA: los dos en el
     * mismo lugar serian dos cosas distintas para el mismo gesto.
     */
    editableLabel: false,

    /** El nombre nuevo, ya recortado y nunca vacio: `(nombre) => ...` */
    onRename: null,

    /** Habilita el arrastre. */
    draggable: false,
    /** Tipo MIME del payload. Quien recibe filtra por esto. */
    dragType: 'text/plain',
    /** Que se lleva. Un objeto se serializa a JSON. */
    dragValue: null,
    /**
     * Que clase de arrastre es: 'copy' (default) o 'move'.
     *
     * Decide el cursor —el "+" de copiar o la flecha de mover— y, sobre todo,
     * TIENE QUE COINCIDIR con el `dropEffect` del destino. Si no coinciden, el
     * navegador cancela el suelto sin decir nada: el evento `drop` no llega y
     * parece que el destino no estuviera escuchando.
     *
     * Un panel de contenido COPIA —la ficha se queda—; una lista que se
     * reordena MUEVE.
     */
    dragEffect: 'copy',

    /** Click, Enter o Espacio. La via accesible. */
    onActivate: null,

    className: null,
    dataset: null,
  };

  render() {
    const o = this.options;
    const parts = [];

    if (o.icon) {
      /* Mismo criterio que Button y Segmented: un nombre del set es un icono;
         cualquier otro string es contenido crudo (un emoji, markup SVG). */
      const icon = Icon.has(o.icon) ? this._makeIcon(o.icon) : o.icon;
      this.iconSlot = el('span', { class: 'ui-tile__icon' }, [icon]);
      /* ⛔ LA PREVIA NO ARRANCA UN ARRASTRE PROPIO. Una imagen es arrastrable de
         fabrica: adentro de una ficha que TAMBIEN se arrastra, el gesto
         empezaba dos arrastres a la vez y el del navegador metia la imagen en
         el paquete como si fuera un archivo del escritorio. */
      for (const media of this.iconSlot.querySelectorAll('img, a')) {
        media.draggable = false;
      }
      parts.push(this.iconSlot);
    }

    this.labelNode = el('span', { class: 'ui-tile__label', text: o.label });
    const text = [this.labelNode];
    if (o.description) {
      text.push(el('span', { class: 'ui-tile__description', text: o.description }));
    }
    parts.push(el('span', { class: 'ui-tile__text' }, text));

    const node = el('div', {
      role: 'button',
      /* El nombre completo al pasar por encima: en una ficha angosta el rotulo
         se corta, y lo que se corta es justo lo que distingue una de otra. */
      title: o.label || undefined,
      // Sin esto la ficha no recibe foco y el teclado no puede llegar a ella.
      tabindex: o.disabled ? undefined : '0',
      class: cx(
        'ui-tile',
        `ui-tile--${o.layout}`,
        `ui-tile--${o.size}`,
        o.selected && 'is-selected',
        o.disabled && 'is-disabled',
        o.draggable && 'ui-tile--draggable',
        o.className,
      ),
      draggable: o.draggable && !o.disabled ? 'true' : undefined,
      'aria-pressed': o.selected ? 'true' : undefined,
      'aria-disabled': o.disabled ? 'true' : undefined,
      dataset: o.dataset || undefined,
    }, parts);

    /* La sangria va en linea porque es un dato de ESTA ficha —en que nivel
       cuelga—, no una forma de pintarla: dos fichas del mismo pack pueden estar
       a profundidades distintas. El atributo marca que la regla aplica; sin el,
       una ficha suelta pagaria un `calc()` por nada. */
    if (Number(o.depth) > 0) {
      node.dataset.depth = String(o.depth);
      node.style.setProperty('--tile-depth', String(o.depth));
    }

    if (!o.disabled) {
      this.listen(node, 'click', (event) => this._activate(event));

      /* Lo que un `<button>` hacia solo. Espacio ademas scrollea la pagina si
         no se lo frena. */
      this.listen(node, 'keydown', (event) => {
        /* Mientras se escribe un nombre, ninguna tecla significa "activar la
           ficha": el campo esta adentro y se queda con todo. */
        if (this.el?.classList.contains('is-renaming')) return;
        if (!isKey(event, 'activate')) return;
        event.preventDefault();
        this._activate(event);
      });
    }

    if (o.editableLabel && !o.disabled) {
      this._startRename = wireRename({
        listen: (n, t, fn) => this.listen(n, t, fn),
        host: node,
        label: () => this.labelNode,
        value: () => this.options.label,
        onCommit: (nombre) => {
          this.setLabel(nombre);
          o.onRename?.(nombre, this);
          this.emit('rename', nombre);
        },
      });
    }

    if (o.draggable && !o.disabled) {
      this.listen(node, 'dragstart', (event) => this._onDragStart(event, node));
      this.listen(node, 'dragend', () => {
        node.classList.remove('is-dragging');
        this.emit('dragend', this);
      });
    }

    return node;
  }

  // ------------------------------------------------------------------ interno

  _activate(event) {
    this.options.onActivate?.(event, this);
    this.emit('activate', event);
  }

  _makeIcon(name) {
    this.iconChild?.destroy?.();
    this.iconChild = this.adopt(new Icon({
      name,
      size: this.options.size === 'lg' ? 'md' : 'sm',
    }));
    return this.iconChild.element;
  }

  _onDragStart(event, node) {
    const o = this.options;
    const payload = typeof o.dragValue === 'string'
      ? o.dragValue
      : JSON.stringify(o.dragValue ?? o.label);

    event.dataTransfer?.setData(o.dragType, payload);
    /* Un segundo formato en texto plano, SIEMPRE: hay destinos que solo miran
       `text/plain`, y sin esto el navegador considera que el arrastre no lleva
       nada y ni siquiera muestra el cursor de copia. */
    if (o.dragType !== 'text/plain') event.dataTransfer?.setData('text/plain', payload);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = o.dragEffect || 'copy';

    node.classList.add('is-dragging');
    this.emit('dragstart', { event, value: o.dragValue });
  }

  // ------------------------------------------------------------- API publica

  get isSelected() {
    return Boolean(this.options.selected);
  }

  /**
   * Las tres que cambian sin rehacer el nodo.
   *
   * ⛔ UN RE-RENDER SE LLEVA LO QUE NO ES SUYO: el foco del teclado, el estado
   * de arrastre a medio empezar, y cualquier cosa que alguien le haya escrito
   * al nodo desde afuera. En un panel de cincuenta fichas, elegir una no puede
   * costar cincuenta nodos nuevos.
   */
  setSelected(selected = true) {
    this.options.selected = Boolean(selected);
    this.el?.classList.toggle('is-selected', this.options.selected);
    if (this.options.selected) this.el?.setAttribute('aria-pressed', 'true');
    else this.el?.removeAttribute('aria-pressed');
    return this;
  }

  setLabel(label) {
    this.options.label = label;
    if (this.labelNode) this.labelNode.textContent = label;
    if (this.el) this.el.title = label || '';
    return this;
  }

  /**
   * Abre el campo a mano.
   *
   * Es para quien tenga su propia seleccion: un panel que resalta una fila sin
   * darle el foco escucha la tecla donde pueda y llama a esto. Es la misma
   * puerta que usa el atajo, no otra.
   */
  startRename() {
    this._startRename?.();
    return this;
  }

  setIcon(icon) {
    this.options.icon = icon;
    if (!this.iconSlot) return this.update({ icon });
    const next = Icon.has(icon) ? this._makeIcon(icon) : icon;
    this.iconSlot.replaceChildren(next);
    return this;
  }
}

Tile.SIZES = ['sm', 'md', 'lg'];
Tile.LAYOUTS = ['row', 'stack'];
