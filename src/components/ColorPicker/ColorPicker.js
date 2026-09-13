import { UIComponent } from '../../core/UIComponent.js';
import { el, cx } from '../../core/dom.js';
import { clamp } from '../../core/num.js';
import { normalizeHex, hexToHsv, hsvToHex } from '../../core/color.js';
import { Slider } from '../Slider/Slider.js';

/**
 * ColorPicker — muestra de color con panel PROPIO.
 *
 *   new ColorPicker({ value: '#1262e2' })
 *   new ColorPicker({ showValue: false, onChange: (hex) => ... })
 *
 * No usa `<input type="color">`: ese abre un dialogo del sistema operativo que
 * el CSS no puede tocar. El panel se arma con un area de saturacion/brillo, un
 * Slider de matiz y un campo hex.
 *
 * Mientras el panel esta abierto la fuente de verdad es el HSV, no el hex: ir
 * y volver de hex en cada movimiento redondea y hace saltar el cursor.
 */

const SIZES = ['sm', 'md', 'lg'];

/**
 * Ultimo recurso si no hay valor ni se puede leer --ui-brand (entorno sin DOM).
 * Es acromatico, que es la unica excepcion a la regla de "un solo color".
 */
const ACHROMATIC = '#000000';

/** Lee el brand activo. Asi un picker sin valor arranca en la marca. */
function currentBrand() {
  if (typeof document === 'undefined') return null;
  const view = document.defaultView;
  if (!view?.getComputedStyle) return null;
  const raw = view.getComputedStyle(document.documentElement)
    .getPropertyValue('--ui-brand').trim();
  return raw || null;
}

export class ColorPicker extends UIComponent {
  static componentName = 'colorpicker';

  static defaults = {
    /** Color actual. Hex de 3 o 6 digitos. null = arranca en el brand activo. */
    value: null,
    /** Muestra el hex al costado de la pastilla. */
    showValue: true,
    /** Texto en MAYUSCULAS. */
    uppercase: true,

    /** 'sm' | 'md' | 'lg' */
    size: 'md',
    /** Ancho del control. Valor CSS. */
    width: null,
    disabled: false,

    onChange: null,
    ariaLabel: null,
    className: null,
    dataset: null,
  };

  constructor(options) {
    super(options);
    this.value = normalizeHex(this.options.value)
      || normalizeHex(currentBrand())
      || ACHROMATIC;
    this.hsv = hexToHsv(this.value);
    this.open = false;
  }

  _label() {
    return this.options.uppercase ? this.value.toUpperCase() : this.value;
  }

  // -------------------------------------------------------------- render ---

  render() {
    const o = this.options;
    const panelId = `${this.uid}-panel`;

    this.swatch = el('span', { class: 'ui-colorpicker__swatch', 'aria-hidden': 'true' });
    this.output = o.showValue
      ? el('span', { class: 'ui-colorpicker__value', text: this._label() })
      : null;

    this.trigger = el('button', {
      class: 'ui-colorpicker__trigger',
      type: 'button',
      disabled: o.disabled,
      'aria-haspopup': 'dialog',
      'aria-expanded': 'false',
      'aria-controls': panelId,
      'aria-label': o.ariaLabel || undefined,
    }, [this.swatch, this.output]);

    const panel = this._renderPanel(panelId);

    const node = el('div', {
      class: cx(
        'ui-colorpicker',
        SIZES.includes(o.size) && `ui-colorpicker--${o.size}`,
        o.showValue && 'ui-colorpicker--with-value',
        o.disabled && 'is-disabled',
        o.className,
      ),
      style: o.width ? { width: o.width } : null,
      dataset: o.dataset || undefined,
    }, [this.trigger, panel]);

    this._paint(node);
    if (!o.disabled) this._bind(node);
    return node;
  }

  _renderPanel(panelId) {
    this.cursor = el('span', { class: 'ui-colorpicker__cursor', 'aria-hidden': 'true' });

    // Un role="slider" de dos ejes no existe; se anuncia como aplicacion y el
    // valor legible lo lleva el campo hex de abajo.
    this.area = el('div', {
      class: 'ui-colorpicker__area',
      tabindex: '0',
      role: 'application',
      'aria-label': 'Saturacion y brillo',
    }, [this.cursor]);

    this.hue = this.adopt(new Slider({
      type: 'int',
      min: 0,
      max: 360,
      step: 1,
      value: Math.round(this.hsv.h),
      size: 'sm',
      className: 'ui-colorpicker__hue',
      ariaLabel: 'Matiz',
      onChange: (h) => this._fromHsv({ ...this.hsv, h }),
    }));

    this.hexInput = el('input', {
      class: 'ui-colorpicker__hex ui-selectable',
      type: 'text',
      value: this._label(),
      spellcheck: 'false',
      autocomplete: 'off',
      'aria-label': 'Valor hexadecimal',
    });

    this.panel = el('div', {
      class: 'ui-colorpicker__panel',
      id: panelId,
      role: 'dialog',
      'aria-label': 'Elegir color',
      hidden: true,
    }, [
      this.area,
      this.hue,
      el('div', { class: 'ui-colorpicker__foot' }, [this.hexInput]),
    ]);

    return this.panel;
  }

  // ---------------------------------------------------------------- bind ---

  _bind(node) {
    this.listen(this.trigger, 'click', () => this.toggle());

    // --- area de saturacion / brillo ---
    const pick = (event) => {
      const box = this.area.getBoundingClientRect();
      if (!box.width || !box.height) return;
      this._fromHsv({
        ...this.hsv,
        s: clamp((event.clientX - box.left) / box.width, 0, 1),
        v: clamp(1 - (event.clientY - box.top) / box.height, 0, 1),
      });
    };

    this.listen(this.area, 'pointerdown', (event) => {
      event.preventDefault();
      this.area.setPointerCapture?.(event.pointerId);
      this.area.focus();
      pick(event);
    });
    this.listen(this.area, 'pointermove', (event) => {
      if (this.area.hasPointerCapture?.(event.pointerId)) pick(event);
    });
    this.listen(this.area, 'pointerup', (event) => {
      this.area.releasePointerCapture?.(event.pointerId);
    });

    // Flechas para moverse sin mouse. SHIFT va mas grueso.
    this.listen(this.area, 'keydown', (event) => {
      const amount = (event.shiftKey ? 10 : 2) / 100;
      const moves = {
        ArrowRight: { s: amount }, ArrowLeft: { s: -amount },
        ArrowUp: { v: amount }, ArrowDown: { v: -amount },
      };
      const move = moves[event.key];
      if (!move) return;
      event.preventDefault();
      this._fromHsv({
        ...this.hsv,
        s: clamp(this.hsv.s + (move.s || 0), 0, 1),
        v: clamp(this.hsv.v + (move.v || 0), 0, 1),
      });
    });

    // --- campo hex ---
    this.listen(this.hexInput, 'input', (event) => {
      const next = normalizeHex(event.target.value);
      if (next) this._commit(next, { silentInput: true });
    });
    this.listen(this.hexInput, 'blur', () => this._syncInputs());

    // --- cerrar ---
    this.listen(node, 'keydown', (event) => {
      if (event.key === 'Escape' && this.open) {
        event.preventDefault();
        this.hide();
        this.trigger.focus();
      }
    });
    this.listen(document, 'pointerdown', (event) => {
      if (this.open && !node.contains(event.target)) this.hide();
    });
  }

  // --------------------------------------------------------------- abrir ---

  show() {
    if (this.open || this.options.disabled) return this;
    this.open = true;
    this.panel.hidden = false;
    this.el.classList.add('is-open');
    this.trigger.setAttribute('aria-expanded', 'true');
    this._place();
    this.emit('open', this);
    return this;
  }

  hide() {
    if (!this.open) return this;
    this.open = false;
    this.panel.hidden = true;
    this.el.classList.remove('is-open', 'ui-colorpicker--flip');
    this.trigger.setAttribute('aria-expanded', 'false');
    this.emit('close', this);
    return this;
  }

  toggle() {
    return this.open ? this.hide() : this.show();
  }

  /** Si no entra para abajo, se abre para arriba. */
  _place() {
    const view = document.defaultView;
    if (!view || !this.el.getBoundingClientRect) return;
    const box = this.el.getBoundingClientRect();
    const below = view.innerHeight - box.bottom;
    const needed = this.panel.offsetHeight || 0;
    this.el.classList.toggle('ui-colorpicker--flip', needed > below && box.top > below);
  }

  // --------------------------------------------------------------- valor ---

  /** Entrada por HSV: se guarda el HSV y el hex sale de ahi. */
  _fromHsv(hsv) {
    this.hsv = hsv;
    return this._commit(hsvToHex(hsv), { keepHsv: true });
  }

  _commit(raw, { keepHsv = false, silentInput = false } = {}) {
    const next = normalizeHex(raw);
    if (!next || next === this.value) {
      // Aunque el hex no cambie, el HSV pudo moverse (gris: el matiz se pierde
      // en la conversion). Repintar igual para que el cursor no se trabe.
      if (keepHsv) this._paint();
      return this;
    }

    const previous = this.value;
    this.value = next;
    // Si el hex vino de afuera hay que recalcular el HSV; si vino del panel se
    // conserva el que ya teniamos, que es mas preciso que el ida y vuelta.
    if (!keepHsv) this.hsv = hexToHsv(next);

    this._paint();
    this._syncInputs({ skipHex: silentInput });

    this.options.onChange?.(next, previous, this);
    this.emit('change', { value: next, previous });
    return this;
  }

  /** Pinta el estado en variables CSS. Sin re-renderizar. */
  _paint(target = this.el) {
    if (!target) return this;
    target.style.setProperty('--swatch-color', this.value);
    // Matiz puro: es el fondo del area de saturacion/brillo.
    target.style.setProperty('--picker-hue', `hsl(${Math.round(this.hsv.h)} 100% 50%)`);
    target.style.setProperty('--picker-x', `${this.hsv.s * 100}%`);
    target.style.setProperty('--picker-y', `${(1 - this.hsv.v) * 100}%`);
    return this;
  }

  _syncInputs({ skipHex = false } = {}) {
    if (this.output) this.output.textContent = this._label();
    if (!skipHex && this.hexInput) this.hexInput.value = this._label();
    if (this.hue) this.hue.set(Math.round(this.hsv.h));
    return this;
  }

  get() { return this.value; }

  /** Ignora en silencio un hex invalido: el control nunca queda en un estado raro. */
  set(value) { return this._commit(value); }

  onUpdate(patch) {
    if ('value' in patch) {
      const next = normalizeHex(patch.value);
      if (next) {
        this.value = next;
        this.hsv = hexToHsv(next);
      }
    }
    this.open = false;
    return false;
  }

  onDestroy() {
    this.open = false;
  }
}

ColorPicker.SIZES = SIZES;
