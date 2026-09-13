import { UIComponent } from '../../core/UIComponent.js';
import { el, svg, cx, uniqueId } from '../../core/dom.js';

/**
 * Barra de progreso. UNA clase, DOS formas.
 *
 *   new Progress({ value: 0.4 })                    // lineal
 *   new Progress({ shape: 'radial', value: 0.4 })   // aro
 *   new Progress({ indeterminate: true })           // sin valor: se mueve sola
 *
 * Por que una sola clase y no dos: significan exactamente lo mismo y comparten
 * estado, rango, accesibilidad y API. Lo unico distinto es como se dibujan, y
 * eso es una opcion, no otro componente.
 *
 * El aro va en SVG y no en `conic-gradient` a proposito: un degrade conico hay
 * que recortarlo con `mask` para que quede aro y no torta, y una mascara
 * convierte al elemento en backdrop root — que en el pack de vidrio rompe el
 * desenfoque de lo que tenga adentro. Con `stroke-dasharray` no hace falta
 * recortar nada, y de paso cada pack puede tocar grosor y remate del trazo.
 */
export class Progress extends UIComponent {
  static componentName = 'progress';

  static defaults = {
    /** 'linear' | 'radial' */
    shape: 'linear',
    /** 0..1. Se recorta al rango. Se ignora si `indeterminate`. */
    value: 0,
    /** Sin valor conocido: la pieza se mueve sola. */
    indeterminate: false,
    /** 'sm' | 'md' | 'lg' */
    size: 'md',
    /** Texto al lado (lineal) o adentro del aro (radial). null = ninguno. */
    label: null,
    /** Muestra el porcentaje. Con `indeterminate` no se muestra nunca. */
    showValue: false,
    /**
     * Donde va el porcentaje: 'auto' | true | false.
     *
     * El aro deja un hueco en el medio que es el lugar natural para el numero,
     * y ademas ahorra una linea. Pero en el tamano chico no entra: una cifra
     * de dos digitos en un hueco de 30px sale ilegible.
     *
     * 'auto' resuelve eso solo — adentro si es un aro de tamano md o lg,
     * afuera en cualquier otro caso. Los dos booleanos estan para forzarlo.
     */
    valueInside: 'auto',
    /** Para lectores de pantalla cuando no hay `label`. */
    ariaLabel: null,
    /** Clases extra, para engancharle las propias desde donde se use. */
    className: null,
    /** `data-*` propios. Mismo motivo. */
    dataset: null,
  };

  /** Radio del circulo en el viewBox. El viewBox es 0 0 100 100. */
  static radius = 42;

  get percent() {
    return Math.round(this.clamped * 100);
  }

  /** Si el porcentaje va adentro del aro. */
  get valueInside() {
    const o = this.options;
    if (o.shape !== 'radial' || !o.showValue || o.indeterminate) return false;
    if (o.valueInside !== 'auto') return Boolean(o.valueInside);
    return o.size !== 'sm';
  }

  get clamped() {
    const n = Number(this.options.value);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
  }

  render() {
    const o = this.options;
    const node = el('div', {
      class: cx('ui-progress', `ui-progress--${o.shape}`, `ui-progress--${o.size}`, {
        'is-indeterminate': o.indeterminate,
      }, o.className),
      dataset: o.dataset || undefined,
      role: 'progressbar',
      'aria-label': o.ariaLabel || o.label || null,
      /* Sin valor conocido se OMITEN los aria-value*: un progressbar sin
         aria-valuenow es, por definicion, indeterminado. Poner 0 mentiria. */
      'aria-valuemin': o.indeterminate ? null : 0,
      'aria-valuemax': o.indeterminate ? null : 100,
      'aria-valuenow': o.indeterminate ? null : this.percent,
      style: {
        '--progress-value': this.clamped,
        /* El radio del circulo del aro, para que el CSS pueda calcular donde
           caen de verdad sus bordes. Es UNA sola fuente de verdad: si cambia
           `Progress.radius`, lo que dibuje una piel alrededor del aro la
           acompana sin que nadie toque un numero a mano. */
        '--progress-ring-r': o.shape === 'radial' ? this.constructor.radius : null,
      },
    }, [
      o.shape === 'radial' ? this._radial() : this._linear(),
      this._insideValue(),
      this._caption(),
    ]);

    return node;
  }

  _linear() {
    return el('div', { class: 'ui-progress__track' }, [
      el('div', { class: 'ui-progress__fill' }),
    ]);
  }

  _radial() {
    const r = this.constructor.radius;
    /* La circunferencia se calcula UNA vez y viaja como variable CSS: el
       relleno sale de `stroke-dasharray`, que la piel de cada pack puede
       combinar con su propio grosor sin volver a calcular nada. */
    const gradId = uniqueId('ui-progress-ring');
    const gradTrackId = uniqueId('ui-progress-ring-track');

    return svg('svg', {
      class: 'ui-progress__ring',
      viewBox: '0 0 100 100',
      'aria-hidden': 'true',
      focusable: 'false',
    }, [
      /* ⛔ EL RELLENO DEL ARO SE PINTA CON UN DEGRADE, SIEMPRE.
         Un `stroke` de SVG no acepta un degrade de CSS: solo un color plano o
         una referencia a una definicion del propio SVG. O sea que un pack que
         pinta su barra lineal con un corrimiento de tono —vidrio, neon,
         risografia— no tenia forma de hacer lo mismo en el aro, y el aro salia
         plano al lado de su propia barra.

         Se define siempre, aunque casi ningun pack lo aproveche: los dos topes
         caen a --progress-ring-fill, asi que un pack que solo declare un color
         se ve exactamente igual que antes. El que quiera el degrade declara
         --progress-ring-from y --progress-ring-to y listo.

         El id es unico por instancia: dos barras en la misma pagina con el
         mismo id harian que la segunda use el degrade de la primera. */
      /* ⚠ EL DEGRADE VA "AL REVES" Y NO ES UN ERROR.
         La mecanica dibuja el aro ROTADO -90 grados para que el cero quede
         arriba, y un degrade de SVG se define en el espacio del elemento: gira
         con el. Para que EN PANTALLA caiga de arriba hacia abajo —que es como
         cae la luz en la barra lineal, y de eso se trata que se parezcan— hay
         que pedirlo en el eje x y dado vuelta. Un vector de pantalla (x, y) se
         escribe (-y, x): el de arriba-abajo (0, 1) queda (-1, 0). */
      svg('defs', {}, [
        svg('linearGradient', {
          id: gradId,
          x1: '1', y1: '0', x2: '0', y2: '0',
        }, [
          svg('stop', { class: 'ui-progress__ring-from', offset: '0' }),
          svg('stop', { class: 'ui-progress__ring-mid', offset: '0.5' }),
          svg('stop', { class: 'ui-progress__ring-to', offset: '1' }),
        ]),
        /* El canal vacio tambien: en un pack con relieve el hueco se sombrea
           igual que el relleno se ilumina, y sin esto el aro quedaba con un
           canal plano al lado de una barra lineal excavada. */
        svg('linearGradient', {
          id: gradTrackId,
          x1: '1', y1: '0', x2: '0', y2: '0',
        }, [
          svg('stop', { class: 'ui-progress__ring-track-from', offset: '0' }),
          svg('stop', { class: 'ui-progress__ring-track-mid', offset: '0.5' }),
          svg('stop', { class: 'ui-progress__ring-track-to', offset: '1' }),
        ]),
      ]),
      svg('circle', {
        class: 'ui-progress__ring-track', cx: 50, cy: 50, r,
        stroke: `url(#${gradTrackId})`,
      }),
      /* ⛔ `pathLength` HACE QUE EL TRAZO SE MIDA EN CENTESIMOS DE VUELTA.
         Sin esto, los guiones se miden en unidades del dibujo, o sea que cada
         medida depende de la circunferencia — un numero que hay que calcular en
         JS, pasar por una variable y volver a multiplicar en cada regla. Eso es
         lo que tenia el giro del indeterminado, y bastaba con que una de esas
         cuentas no cerrara para que la animacion no se viera.

         Con `pathLength="100"` la vuelta entera vale 100 y listo: el relleno es
         `valor * 100`, el arco del indeterminado es `25 75`, y lo que se corre
         para dar una vuelta es 100. Ni una cuenta que pueda salir mal.

         Va SOLO en el relleno: el canal lo usan packs que dibujan su linea
         punteada en unidades del dibujo —blueprint— y cambiarles la escala les
         romperia el punteado. */
      svg('circle', {
        class: 'ui-progress__ring-fill', cx: 50, cy: 50, r,
        pathLength: '100',
        stroke: `url(#${gradId})`,
      }),
    ]);
  }

  /** El porcentaje en el hueco del aro. */
  _insideValue() {
    if (!this.valueInside) return null;
    return el('div', {
      class: 'ui-progress__value ui-progress__value--inside ui-selectable',
      text: `${this.percent}%`,
    });
  }

  _caption() {
    const o = this.options;
    /* Si el numero ya esta adentro del aro no se repite abajo: el pie queda
       solo para el rotulo, y si tampoco hay rotulo no se dibuja nada. */
    const show = o.showValue && !o.indeterminate && !this.valueInside;
    if (!o.label && !show) return null;

    return el('div', { class: 'ui-progress__caption' }, [
      o.label ? el('span', { class: 'ui-progress__label', text: o.label }) : null,
      show ? el('span', {
        class: 'ui-progress__value ui-selectable',
        text: `${this.percent}%`,
      }) : null,
    ]);
  }

  /**
   * Mover el valor NO re-renderiza: es lo que mas se toca de este componente
   * (una descarga escribe decenas de veces por segundo) y rehacer el nodo
   * cortaria cualquier transicion del pack a mitad de camino.
   */
  onUpdate(patch) {
    const keys = Object.keys(patch);
    if (keys.length !== 1 || keys[0] !== 'value' || this.options.indeterminate) return false;

    this.el.style.setProperty('--progress-value', String(this.clamped));
    this.el.setAttribute('aria-valuenow', String(this.percent));
    /* Todos los que haya: el de adentro del aro y el del pie llevan la misma
       clase a proposito, asi que esto sirve para los dos sin preguntar. */
    for (const value of this.el.querySelectorAll('.ui-progress__value')) {
      value.textContent = `${this.percent}%`;
    }
    return true;
  }

  /** Atajos. */
  setValue(value) { return this.update({ value }); }
  setIndeterminate(indeterminate = true) { return this.update({ indeterminate }); }
}
