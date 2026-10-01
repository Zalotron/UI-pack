import { UIComponent } from '../../core/UIComponent.js';
import { el, cx } from '../../core/dom.js';
import { isKey } from '../../keys.js';
import { decimalsOf, round, format, MAX_PRECISION } from '../../core/num.js';

/**
 * Spinner — campo numerico sin flechitas, tipo Blender / Unity.
 *
 *   new Spinner({ value: 25 })
 *   new Spinner({ type: 'int', min: 1, max: 10, step: 1 })
 *
 * Formas de cambiar el valor:
 *   - Click        -> el campo queda editable con el contenido seleccionado.
 *   - Arrastrar    -> manteniendo apretado y moviendo en vertical.
 *   - Scroll       -> con el mouse encima.
 *   - Flechas      -> arriba / abajo con el foco puesto (accesibilidad).
 *
 * Modificadores durante arrastre, scroll o flechas:
 *   SHIFT -> step * shiftMultiplier   (grueso)
 *   CTRL  -> step * ctrlMultiplier    (fino; gana sobre SHIFT)
 */

const TYPES = ['float', 'int'];
const SIZES = ['sm', 'md', 'lg'];

export class Spinner extends UIComponent {
  static componentName = 'spinner';

  static defaults = {
    /** Valor actual. Si no se pasa, arranca en `min` (o 0). */
    value: null,

    /** 'float' | 'int' */
    type: 'float',
    /** Limite inferior. null = sin limite. */
    min: 0,
    /** Limite superior. null = sin limite. */
    max: 100,
    /** Incremento base. */
    step: 0.1,

    // ------------------------------------------------------- modificadores
    /** Multiplicador de `step` con SHIFT apretado. */
    shiftMultiplier: 10,
    /** Multiplicador de `step` con CTRL apretado. Gana sobre SHIFT. */
    ctrlMultiplier: 0.1,

    // ------------------------------------------------------------ arrastre
    /** Pixeles de arrastre vertical por cada `step`. Menos = mas sensible. */
    sensitivity: 4,
    /** Pixeles de movimiento antes de considerar que es un arrastre y no un click. */
    dragThreshold: 3,

    // ------------------------------------------------------------- formato
    /** Decimales a mostrar. null = derivado del step mas fino posible. */
    precision: null,
    /** true deja siempre los decimales pedidos: 0 se ve "0.00". */
    fixedDecimals: false,

    // -------------------------------------------------------------- visual
    /** 'sm' | 'md' | 'lg' */
    size: 'md',
    /** Ancho. Valor CSS. */
    width: null,
    /** Alineacion del numero: 'start' | 'center' | 'end'. */
    align: 'center',
    disabled: false,

    // ---------------------------------------------------------- accesorios
    /** Se dispara en cada cambio de valor. */
    onChange: null,
    ariaLabel: null,
    className: null,
    dataset: null,
  };

  constructor(options) {
    super(options);
    this._editing = false;
    this._dragging = false;
    this.value = this._clamp(this.options.value ?? this.options.min ?? 0);
  }

  // ------------------------------------------------------------- numeros ---

  /**
   * Decimales efectivos: los del paso mas fino que el usuario puede pedir.
   * Se SUMAN los decimales en vez de mirar `step * ctrlMultiplier`, porque
   * ese producto trae basura de coma flotante (0.1 * 0.1 = 0.010000000000000002,
   * o sea 18 decimales) y dispararia la precision.
   */
  get precision() {
    const { precision, type, step, ctrlMultiplier } = this.options;
    if (type === 'int') return 0;
    if (precision !== null && precision !== undefined) return precision;

    const fine = ctrlMultiplier > 0 && ctrlMultiplier < 1 ? decimalsOf(ctrlMultiplier) : 0;
    return Math.min(decimalsOf(step) + fine, MAX_PRECISION);
  }

  /**
   * Cuantos caracteres tiene que poder mostrar, EN EL PEOR CASO.
   *
   * ⛔ SALE DE LOS LIMITES, NO DEL VALOR ACTUAL. Un campo que se ensancha
   * mientras lo tipeas mueve todo lo que tiene al lado, y encima lo hace justo
   * cuando lo estas usando. El ancho se reserva una vez, para el numero mas
   * largo que este control puede llegar a mostrar, y no se mueve mas.
   *
   * El peor caso NO es un extremo: con min 0 y max 100 a dos decimales, el
   * texto mas largo es "100.00", que no es ninguno de los dos bordes. Por eso
   * se cuentan los digitos enteros del borde mas grande y se le suma la coma
   * con TODOS los decimales que el control puede pedir.
   *
   * @returns {number|null} null si algun limite es abierto: ahi no hay de
   *   donde derivarlo y manda el piso declarado por el pack.
   */
  get chars() {
    const { min, max } = this.options;
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;

    const digits = (n) => String(Math.floor(Math.abs(n))).length;
    const whole = Math.max(digits(min), digits(max));
    const decimals = this.precision > 0 ? this.precision + 1 : 0;  // +1 por la coma
    const sign = min < 0 ? 1 : 0;
    return whole + decimals + sign;
  }

  _clamp(raw) {
    const { type, min, max } = this.options;
    let n = Number(raw);
    if (!Number.isFinite(n)) n = min ?? 0;
    n = type === 'int' ? Math.round(n) : round(n, this.precision);
    if (min !== null && min !== undefined) n = Math.max(min, n);
    if (max !== null && max !== undefined) n = Math.min(max, n);
    return n;
  }

  /** Paso efectivo segun los modificadores apretados. */
  _stepFor(event) {
    const { step, shiftMultiplier, ctrlMultiplier } = this.options;
    if (event?.ctrlKey || event?.metaKey) return step * ctrlMultiplier;
    if (event?.shiftKey) return step * shiftMultiplier;
    return step;
  }

  /** Texto que se muestra. Con fixedDecimals no se recortan los ceros. */
  _format(value) {
    return format(value, this.precision, this.options.fixedDecimals);
  }

  // -------------------------------------------------------------- render ---

  render() {
    const o = this.options;
    const type = TYPES.includes(o.type) ? o.type : 'float';

    const input = el('input', {
      class: 'ui-spinner__input',
      type: 'text',
      inputmode: type === 'int' ? 'numeric' : 'decimal',
      value: this._format(this.value),
      readonly: true,
      disabled: o.disabled,
      role: 'spinbutton',
      'aria-valuenow': String(this.value),
      'aria-valuemin': o.min ?? undefined,
      'aria-valuemax': o.max ?? undefined,
      'aria-label': o.ariaLabel || undefined,
      autocomplete: 'off',
      spellcheck: 'false',
    });
    this.input = input;

    const node = el('div', {
      class: cx(
        'ui-spinner',
        `ui-spinner--${type}`,
        SIZES.includes(o.size) && `ui-spinner--${o.size}`,
        `ui-spinner--align-${o.align}`,
        o.disabled && 'is-disabled',
        o.className,
      ),
      style: {
        /* El ancho se reserva para el numero mas largo posible; `width` a mano
           sigue ganando, porque va como propiedad y esto es una variable. */
        ...(this.chars !== null ? { '--spinner-chars': String(this.chars) } : null),
        ...(o.width ? { width: o.width } : null),
      },
      dataset: o.dataset || undefined,
    }, [input]);

    if (!o.disabled) this._bind(node, input);
    return node;
  }

  _bind(node, input) {
    let startY = 0;
    let startValue = 0;

    // --- arrastre vertical -------------------------------------------------
    this.listen(node, 'pointerdown', (event) => {
      if (this._editing || event.button !== 0) return;
      // Evita que el navegador seleccione texto o mueva el foco: el click
      // "limpio" lo resolvemos nosotros en pointerup.
      event.preventDefault();
      startY = event.clientY;
      startValue = this.value;
      this._dragging = false;
      node.setPointerCapture(event.pointerId);
    });

    this.listen(node, 'pointermove', (event) => {
      if (this._editing || !node.hasPointerCapture?.(event.pointerId)) return;

      const travelled = startY - event.clientY;
      if (!this._dragging) {
        if (Math.abs(travelled) < this.options.dragThreshold) return;
        this._dragging = true;
        node.classList.add('is-dragging');
      }

      const steps = Math.round(travelled / this.options.sensitivity);
      this._commit(startValue + steps * this._stepFor(event));
    });

    const endDrag = (event) => {
      if (this._editing) return;
      if (node.hasPointerCapture?.(event.pointerId)) node.releasePointerCapture(event.pointerId);
      node.classList.remove('is-dragging');
      // Si no llego a ser arrastre, fue un click: a editar.
      if (!this._dragging) this._startEditing();
      this._dragging = false;
    };
    this.listen(node, 'pointerup', endDrag);
    this.listen(node, 'pointercancel', endDrag);

    // --- scroll con el mouse encima ---------------------------------------
    // passive:false porque hace falta preventDefault para no scrollear la pagina.
    this.listen(node, 'wheel', (event) => {
      if (this._editing || !event.deltaY) return;
      event.preventDefault();
      const direction = event.deltaY < 0 ? 1 : -1;
      this._commit(this.value + direction * this._stepFor(event));
    }, { passive: false });

    // --- teclado -----------------------------------------------------------

    /* ⛔ LLEGAR CON EL TABULADOR ES LLEGAR A ESCRIBIR. El campo nace `readonly`
       —lo que hace que arrastrarlo no seleccione texto— y solo un click limpio
       lo abria: con el tabulador quedaba enfocado, con el numero seleccionado y
       sordo. Uno tipea y no pasa nada, sin un solo indicio de por que: la unica
       salida era ir a clickearlo, que es justo lo que el tabulador viene a
       evitar cuando se cargan dos campos seguidos —la X y la Y de un vector—.

       ⚠ EL PUNTERO NO ENTRA POR ACA. El `pointerdown` del arrastre hace
       `preventDefault()`, asi que apretar el campo NO le da el foco: el unico
       foco que llega sin editar es el del teclado. Y el que `_startEditing`
       pide para si mismo no vuelve a entrar, porque ya marco `_editing`. */
    this.listen(input, 'focus', () => {
      if (this._editing) return;
      this._startEditing();
    });

    this.listen(input, 'keydown', (event) => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        const direction = event.key === 'ArrowUp' ? 1 : -1;
        this._commit(this.value + direction * this._stepFor(event));
        return;
      }
      if (!this._editing) return;

      /* ⛔ ENTER NO CONFIRMA: ES UN ATAJO. Lo que aplica el valor es SALIR del
         campo —el tabulador, un click afuera—, asi que el flujo de carga es
         numero, TAB, numero, sin tocar nada mas. Enter solo adelanta eso.

         ⚠ Y DESPUES DEL ATAJO EL FOCO SIGUE ACA. Si saliera de edicion, el
         campo volveria a `readonly` con el cursor adentro: uno tipea y no pasa
         nada, que es el mismo agujero que tapa el `focus` de mas arriba, nada
         mas que alcanzado por otro lado. Por eso vuelve a abrir, con el numero
         seleccionado — igual que al llegar.

         Escape es lo mismo al reves: descarta lo tipeado y reabre con el valor
         guardado. Descartar no es irse. */
      const seguirEditando = () => {
        if (document.activeElement === input) this._startEditing();
      };

      if (isKey(event, 'commit')) {
        event.preventDefault();
        this._stopEditing(true);
        seguirEditando();
      } else if (isKey(event, 'cancel')) {
        event.preventDefault();
        this._stopEditing(false);
        seguirEditando();
      }
    });

    /* ⛔ ESTE ES EL CAMINO QUE APLICA EL VALOR, no el Enter. Salir del campo
       —por el tabulador o clickeando en cualquier otro lado— lo confirma, que
       es lo que permite cargar una fila de campos de un tiron. Un spinner que
       pide una tecla para cada valor obliga a alternar entre el numero y el
       Enter, y a la tercera vez uno se olvida y pierde lo que escribio. */
    this.listen(input, 'blur', () => {
      if (this._editing) this._stopEditing(true);
    });
  }

  // -------------------------------------------------------------- edicion ---

  /** Deja el campo editable con el contenido ya seleccionado. */
  _startEditing() {
    if (this._editing || this.options.disabled) return this;
    this._editing = true;
    this.el.classList.add('is-editing');
    this.input.readOnly = false;
    this.input.focus();
    this.input.select();
    this.emit('editstart', this.value);
    return this;
  }

  /** @param {boolean} commit - true aplica lo escrito, false descarta. */
  _stopEditing(commit) {
    if (!this._editing) return this;
    this._editing = false;
    this.el.classList.remove('is-editing');
    this.input.readOnly = true;

    if (commit) {
      // Coma decimal: se escribe asi en es-AR y el input es de texto.
      const typed = this.input.value.trim().replace(',', '.');
      this._commit(typed === '' ? this.value : Number(typed));
    }
    // Siempre re-sincroniza: si lo escrito era invalido o quedo fuera de
    // rango, el campo tiene que mostrar el valor real.
    this._sync();
    this.emit('editend', this.value);
    return this;
  }

  // ------------------------------------------------------------- API ---

  /** Escribe el valor pasando por clamp/redondeo y avisa si cambio. */
  _commit(raw) {
    const next = this._clamp(raw);
    if (next === this.value) return this;

    const previous = this.value;
    this.value = next;
    this._sync();
    this.options.onChange?.(next, previous, this);
    this.emit('change', { value: next, previous });
    return this;
  }

  /** Refleja el valor en el DOM sin re-renderizar. */
  _sync() {
    if (!this.input) return this;
    this.input.value = this._format(this.value);
    this.input.setAttribute('aria-valuenow', String(this.value));
    return this;
  }

  /** Lee el valor actual. */
  get() {
    return this.value;
  }

  /** Escribe el valor desde afuera. */
  set(value) {
    return this._commit(value);
  }

  /**
   * Los limites y el paso se pueden cambiar sin re-renderizar: el valor se
   * reajusta al rango nuevo.
   */
  onUpdate(patch) {
    if ('value' in patch) this.value = this._clamp(patch.value);
    if ('min' in patch || 'max' in patch || 'step' in patch || 'type' in patch) {
      this.value = this._clamp(this.value);
    }
    return false; // re-render normal: puede haber cambiado size, disabled, etc.
  }
}

Spinner.TYPES = TYPES;
Spinner.SIZES = SIZES;
