import { UIComponent } from '../../core/UIComponent.js';
import { el, cx } from '../../core/dom.js';
import { decimalsOf, clamp, round, format } from '../../core/num.js';
import { Spinner } from '../Spinner/Spinner.js';

/**
 * Slider — control de rango.
 *
 *   new Slider({ min: 0, max: 3, step: 0.05, showValue: true })
 *   new Slider({ editableValue: true })   // el numero se puede tipear
 *
 * La parte recorrida de la pista se pinta sola: el porcentaje viaja como
 * variable CSS (--slider-progress), asi mover el control no re-renderiza nada.
 *
 * Con `editableValue` el numero de al lado es un Spinner: se puede tipear,
 * arrastrar y scrollear. Es composicion, no un control nuevo.
 */

const SIZES = ['sm', 'md', 'lg'];
const TYPES = ['float', 'int'];

export class Slider extends UIComponent {
  static componentName = 'slider';

  static defaults = {
    /** Valor actual. null = arranca en `min`. */
    value: null,
    /**
     * 'float' -> se mueve suave con el paso indicado
     * 'int'   -> solo valores enteros; el control PEGA SALTOS de a uno
     */
    type: 'float',
    min: 0,
    max: 100,
    step: 1,

    /** Muestra el valor al costado. */
    showValue: false,
    /** El valor mostrado es editable (un Spinner). Implica showValue. */
    editableValue: false,
    /** Decimales. null = derivados del `step` (0.05 -> 2). */
    precision: null,
    /** true deja siempre los decimales: 0 se ve "0.00". */
    fixedDecimals: true,
    /** Formatea el valor mostrado. Pisa precision/fixedDecimals. */
    formatValue: null,

    /** 'sm' | 'md' | 'lg' */
    size: 'md',
    /** Ancho. Valor CSS. */
    width: null,
    disabled: false,

    /** Se dispara en cada cambio, incluso mientras se arrastra. */
    onChange: null,
    ariaLabel: null,
    className: null,
    dataset: null,
  };

  constructor(options) {
    super(options);
    this.value = this._clamp(this.options.value ?? this.options.min);
  }

  /** true si el control es de enteros. */
  get isInt() {
    return this.options.type === 'int';
  }

  /**
   * Paso real del control. Con tipo entero nunca puede ser menor a 1: si no,
   * el tirador se desliza suave entre enteros en vez de saltar.
   */
  get step() {
    const { step } = this.options;
    return this.isInt ? Math.max(1, Math.round(step)) : step;
  }

  /** Decimales efectivos. Del `step`, salvo que se pidan explicitos. */
  get precision() {
    const { precision } = this.options;
    if (this.isInt) return 0;
    return precision ?? decimalsOf(this.step);
  }

  _clamp(raw) {
    const { min, max } = this.options;
    const value = clamp(raw, min, max);
    return this.isInt ? Math.round(value) : round(value, this.precision);
  }

  /** Posicion del valor dentro del rango, 0..1. */
  get ratio() {
    const { min, max } = this.options;
    const span = max - min;
    return span === 0 ? 0 : (this.value - min) / span;
  }

  _label() {
    const { formatValue, fixedDecimals } = this.options;
    return formatValue
      ? String(formatValue(this.value))
      : format(this.value, this.precision, fixedDecimals);
  }

  render() {
    const o = this.options;
    const showValue = o.showValue || o.editableValue;

    const input = el('input', {
      class: 'ui-slider__input',
      type: 'range',
      min: String(o.min),
      max: String(o.max),
      step: String(this.step),
      value: String(this.value),
      disabled: o.disabled,
      'aria-label': o.ariaLabel || undefined,
    });
    this.input = input;

    /* ⛔ LA PISTA Y EL RELLENO SON ELEMENTOS DE VERDAD.
       Antes la pista era el `background` del pseudo-elemento nativo del
       <input>, con el relleno como un tramo de degrade. Un pseudo-elemento
       nativo no admite hijos, no acepta `clip-path` ni mascara propia, y no se
       puede poner nada encima suyo: cualquier pack que quisiera dar vuelta al
       relleno —recortarlo, texturarlo, sombrearlo aparte del canal— no tenia
       donde. El <input> queda como capa de INTERACCION (teclado, foco, arrastre
       y semantica de rango) y lo visible pasa a ser DOM. */
    const fill = el('div', { class: 'ui-slider__fill' });
    const track = el('div', { class: 'ui-slider__track' }, [fill]);
    /* El tirador tambien: un pseudo-elemento nativo no acepta mascara —
       enmascararlo lo hace DESAPARECER en Chrome, esta probado— ni puede
       salirse de la caja del canal. El <input> conserva el area de agarre y
       toda la semantica; lo que se ve es este. Va DESPUES del <input> en el
       DOM para que el foco se pueda expresar con `:focus-visible ~`. */
    const thumb = el('span', { class: 'ui-slider__thumb', 'aria-hidden': 'true' });
    const rail = el('div', { class: 'ui-slider__rail' }, [track, input, thumb]);

    this.spinner = null;
    this.output = null;

    if (o.editableValue) {
      // El numero es un Spinner: tipear, arrastrar y scrollear ahi tambien.
      this.spinner = this.adopt(new Spinner({
        value: this.value,
        type: o.type,
        min: o.min,
        max: o.max,
        step: this.step,
        precision: this.precision,
        fixedDecimals: o.fixedDecimals,
        size: o.size,
        disabled: o.disabled,
        className: 'ui-slider__spinner',
        ariaLabel: o.ariaLabel ? `${o.ariaLabel} (valor)` : undefined,
        onChange: (value) => this._commit(value),
      }));
    } else if (showValue) {
      this.output = el('output', { class: 'ui-slider__value', text: this._label() });
    }

    const node = el('div', {
      class: cx(
        'ui-slider',
        SIZES.includes(o.size) && `ui-slider--${o.size}`,
        showValue && 'ui-slider--with-value',
        o.editableValue && 'ui-slider--editable',
        o.disabled && 'is-disabled',
        o.className,
      ),
      style: {
        '--slider-progress': `${this.ratio * 100}%`,
        /* El mismo valor sin unidad. El tirador no se posiciona en el 0..100%
           del canal: su centro va de w/2 a (ancho - w/2), asi que hay que
           multiplicar una LONGITUD por la fraccion — y para eso el numero
           tiene que venir pelado. */
        '--slider-ratio': String(this.ratio),
        ...(o.width ? { width: o.width } : {}),
      },
      dataset: o.dataset || undefined,
    }, [rail, this.spinner, this.output]);

    if (!o.disabled) {
      this.listen(input, 'input', (event) => this._commit(event.target.value));
      // Mientras se arrastra la pista, el control entero se marca activo.
      this.listen(input, 'pointerdown', () => node.classList.add('is-dragging'));
      this.listen(document, 'pointerup', () => node.classList.remove('is-dragging'));
    }
    return node;
  }

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

  /**
   * Refleja el valor sin re-renderizar. El guard de `_commit` corta la
   * recursion entre el slider y su Spinner: al segundo pase el valor ya
   * coincide y no se vuelve a emitir.
   */
  _sync() {
    if (!this.el) return this;
    this.el.style.setProperty('--slider-progress', `${this.ratio * 100}%`);
    this.el.style.setProperty('--slider-ratio', String(this.ratio));
    if (this.input.value !== String(this.value)) this.input.value = String(this.value);
    if (this.spinner) this.spinner.set(this.value);
    if (this.output) this.output.textContent = this._label();
    return this;
  }

  get() { return this.value; }
  set(value) { return this._commit(value); }

  onUpdate(patch) {
    if ('value' in patch || 'min' in patch || 'max' in patch
        || 'step' in patch || 'type' in patch) {
      this.value = this._clamp('value' in patch ? patch.value : this.value);
    }
    return false;
  }
}

Slider.SIZES = SIZES;
Slider.TYPES = TYPES;
