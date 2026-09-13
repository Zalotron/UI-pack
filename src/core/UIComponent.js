import { EventEmitter } from './EventEmitter.js';
import { resolveNode, uniqueId } from './dom.js';

/* ---------------------------------------------------------------------------
   ENTRADA Y SALIDA — el contrato
   ---------------------------------------------------------------------------
   Todo componente entra y sale animado. La mecánica no define NINGUNA
   animación: se limita a poner una clase de estado y a esperar a que lo que
   sea que el pack haya definido termine.

     .is-entering   mientras corre la entrada. Se pone al montar y se saca sola.
     .is-leaving    mientras corre la salida. La pone `leave()` y no se saca:
                    cuando termina, el elemento ya no está.

   El reparto de siempre: la mecánica decide CUANDO, el pack decide QUE SE VE.
   Cada pack tiene que definir las dos para todos los componentes — hay un
   guard en la suite de packs que lo verifica.

   Si un pack no define nada, no se rompe nada: no hay animaciones corriendo,
   la espera resuelve enseguida y el elemento entra o se va de una.
   --------------------------------------------------------------------------- */

const ENTER_CLASS = 'is-entering';
const LEAVE_CLASS = 'is-leaving';

/**
 * Promesa que resuelve cuando terminan las animaciones que corren en `node`
 * (y en sus hijos: una entrada puede animar partes de adentro).
 *
 * Devuelve una promesa ya resuelta si no hay ninguna, o si el entorno no tiene
 * `getAnimations` — jsdom, por ejemplo. Eso es lo que hace que `leave()` no se
 * cuelgue nunca cuando el pack no definió salida.
 */
function whenAnimationsEnd(node) {
  if (typeof node?.getAnimations !== 'function') return Promise.resolve();

  const running = node.getAnimations({ subtree: true }).filter((animation) => {
    if (animation.playState !== 'running') return false;

    /* ⚠ LAS QUE ESTAN EN BUCLE NO CUENTAN, Y ES CRITICO.
       `finished` de una animacion infinita NO RESUELVE NUNCA — por definicion,
       porque nunca termina. Esperarla deja colgado todo lo que venga despues.

       Es un bug que se vio: el boton de repetir la animacion hacia desaparecer
       la pagina y no volvia nunca. La pagina tenia una barra de progreso
       indeterminada, que gira en bucle; `leave()` se quedaba esperando esa
       promesa, nunca llegaba al `destroy()`, y como la salida deja `opacity: 0`
       con `fill: both`, todo quedaba invisible para siempre.

       Hay tres en la mecanica: el spinner del boton en carga y las dos del
       progress indeterminado. Cualquier componente que agregue un bucle
       heredaria el mismo problema, asi que se filtra aca y no en cada caso. */
    const iterations = animation.effect?.getComputedTiming?.().iterations;
    return iterations !== Infinity;
  });
  if (!running.length) return Promise.resolve();

  // allSettled y no all: una animación cancelada rechaza su `finished`, y que
  // se cancele es normal (el elemento se fue antes de terminar).
  return Promise.allSettled(running.map((animation) => animation.finished))
    .then(() => undefined);
}

/**
 * Espera a que el navegador haya pintado un cuadro.
 *
 * Hace falta antes de preguntar por las animaciones: una animación disparada
 * por una clase TODAVIA NO EXISTE en el mismo tick en que se agrega la clase.
 * Preguntando de una, `getAnimations()` devuelve vacío, la espera resuelve al
 * instante y la clase se saca antes de que arranque nada — que es exactamente
 * el motivo por el que las entradas no se veían.
 */
function afterFrame() {
  if (typeof requestAnimationFrame !== 'function') return Promise.resolve();
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

/* ---------------------------------------------------------------------------
   ESCALONADO
   Si cuarenta componentes entran exactamente juntos, no se lee como que cada
   uno entra: se lee como un parpadeo de la página. Cada elemento recibe un
   turno y el pack lo usa como `animation-delay`.

   ⚠ EL TURNO SE REPARTE POR EL ARBOL, NO POR UN CONTADOR GLOBAL.
   La versión anterior usaba un contador de módulo con un TOPE: pasado el turno
   14, `Math.min(slot, cap)` devolvía siempre el mismo número. O sea que los
   primeros catorce componentes entraban en cascada y TODO EL RESTO entraba
   junto, y encima al final — justo el retraso del tope. En el catálogo eso se
   veía clarísimo: el panel de settings se comía los catorce turnos, cascadeaba
   lindo, y las secciones aparecían todas de golpe recién cuando el panel había
   terminado.

   Ahora el retraso de un componente es el de su padre más su posición entre
   sus hermanos. Así cada rama cascadea por su cuenta, ninguna espera a que
   otra termine, y el retraso crece con la PROFUNDIDAD y no con la cantidad
   total de componentes de la página.
   --------------------------------------------------------------------------- */

/**
 * Retraso en milisegundos del turno `n`.
 *
 * No es `n * step` recortado por un techo: un techo DURO aplana la cola, que
 * es exactamente el bug que se estaba arreglando — pasado el tope, todos
 * comparten el mismo retraso y entran juntos.
 *
 * Es una curva que crece siempre y nunca llega al techo. Arranca con la
 * pendiente de `step`, así que los primeros turnos van escalonados como se
 * espera, y se va achatando: cuarenta hermanos siguen entrando uno detrás del
 * otro, solo que cada vez más apretados. Nunca dos exactamente juntos.
 */
function staggerDelay(n, step, max) {
  return max * (1 - Math.exp((-step * n) / max));
}

/**
 * Clase base de todos los componentes.
 *
 * Contrato mínimo para una subclase:
 *   1. `static defaults = { ... }`  -> opciones y sus valores por defecto
 *   2. `render()`                   -> devuelve el HTMLElement raíz
 *
 * Todo lo demás (mount, enter, leave, update, destroy, eventos, limpieza de
 * listeners) ya viene resuelto acá.
 */
export class UIComponent extends EventEmitter {
  /** Opciones por defecto. Se heredan y mergean por la cadena de prototipos. */
  static defaults = {};

  /** Milisegundos entre la entrada de un hermano y la del siguiente. */
  static enterStagger = 26;

  /** Techo que el retraso se ACERCA pero nunca alcanza. No recorta: la curva
   *  de `staggerDelay()` se va achatando contra él, así que por ancha o
   *  profunda que sea la página, dos componentes nunca entran exactamente
   *  juntos y el último no aparece un segundo y medio tarde. */
  static enterStaggerMax = 480;

  /** Azúcar: `Button.create({...})` en vez de `new Button({...})`. */
  static create(options) {
    return new this(options);
  }

  /** Mergea los `defaults` de toda la cadena de herencia (padre -> hijo). */
  static resolveDefaults() {
    const chain = [];
    let ctor = this;
    while (ctor && ctor !== EventEmitter) {
      if (Object.prototype.hasOwnProperty.call(ctor, 'defaults')) chain.unshift(ctor.defaults);
      ctor = Object.getPrototypeOf(ctor);
    }
    return Object.assign({}, ...chain);
  }

  constructor(options = {}) {
    super();
    this.uid = uniqueId(this.constructor.componentName || 'ui');
    this.options = { ...this.constructor.resolveDefaults(), ...options };

    /** @type {HTMLElement|null} raíz del componente */
    this.el = null;
    this.isMounted = false;
    this.isDestroyed = false;

    this._domListeners = [];
    this._children = [];
  }

  // ---------------------------------------------------------------- render

  /** Debe devolver el HTMLElement raíz. Obligatorio en cada subclase. */
  render() {
    throw new Error(`${this.constructor.name}: falta implementar render()`);
  }

  /** El nodo raíz, renderizado de forma perezosa la primera vez que se pide. */
  get element() {
    if (!this.el && !this.isDestroyed) {
      this.el = this.render();
      this.el.__component = this; // permite volver del nodo al componente
    }
    return this.el;
  }

  // ------------------------------------------------------------- lifecycle

  /** Inserta el componente dentro de `target` (selector, nodo u otro componente). */
  mount(target) {
    const parent = resolveNode(target);
    if (!parent) throw new Error(`${this.constructor.name}: target de mount() inválido`);
    parent.appendChild(this.element);
    this.isMounted = true;
    this.enter();
    this.onMount?.();
    this.emit('mount', this);
    return this;
  }

  /**
   * Corre la animación de ENTRADA. Se llama sola al montar; se puede volver a
   * llamar para repetirla (es lo que hace el catálogo al cambiar de pack).
   *
   * La mecánica NO define ninguna animación: solo pone y saca la clase. Qué se
   * ve es decisión del pack — ver el contrato en el encabezado de este archivo.
   */
  enter(slot = 0) {
    const node = this.el;
    if (!node?.classList) return this;

    node.classList.remove(LEAVE_CLASS, ENTER_CLASS);
    // Reinicia la animación si la clase ya estaba: sin forzar un recálculo,
    // sacarla y volver a ponerla en el mismo cuadro no reinicia nada.
    void node.offsetWidth;

    const { enterStagger, enterStaggerMax } = this.constructor;
    const delay = staggerDelay(slot, enterStagger, enterStaggerMax);
    node.style?.setProperty?.('--ui-enter-delay', `${delay}ms`);
    node.classList.add(ENTER_CLASS);

    const propia = afterFrame()
      .then(() => whenAnimationsEnd(node))
      // Puede haberse destruido mientras corría.
      .then(() => node.classList?.remove(ENTER_CLASS));

    /* Los subcomponentes NO se montan: se adoptan y su elemento se inserta
       dentro del padre. O sea que nunca pasarían por `mount()` y solo entraría
       animada la raíz — una sola animación en toda la página. Por eso la
       entrada baja por el árbol adoptado, y de paso es donde se reparte el
       turno: cada hijo arranca un escalón después que el anterior, contando
       desde el retraso de SU padre. */
    const hijos = this._children.map(
      (child, i) => child.enter?.(slot + i + 1)?.whenEntered?.() ?? Promise.resolve(),
    );

    /* Se guarda CUANDO TERMINA TODA LA RAMA, no solo la raíz. Los hijos entran
       escalonados, así que el último termina bastante después que el padre:
       preguntarle solo a la raíz daría por cerrada una animación que todavía
       se está viendo. */
    this._entered = Promise.all([propia, ...hijos]).then(() => this);

    return this;
  }

  /**
   * Promesa que resuelve cuando terminó la ENTRADA — la suya y la de todo lo
   * que tenga adoptado adentro.
   *
   * Hace falta para no dejar disparar de nuevo algo que reinicia la animación
   * mientras la anterior corre: sin esto, repetir la entrada a los tirones
   * deja dos animaciones pisándose y ramas del árbol a medio montar.
   *
   * `enter()` sigue devolviendo `this` y no una promesa: encadenarla es opcional
   * justamente porque casi nadie necesita esperarla.
   *
   * @returns {Promise<this>}
   */
  whenEntered() {
    return this._entered ?? Promise.resolve(this);
  }

  /**
   * Corre la animación de SALIDA y recién cuando termina destruye.
   *
   * `destroy()` y `unmount()` siguen siendo inmediatos a propósito: hay casos
   * donde no se quiere esperar (limpiar al cerrar la página, tests). `leave()`
   * es la versión con despedida.
   *
   * @returns {Promise<this>}
   */
  async leave() {
    const node = this.el;
    if (this.isDestroyed || !node?.classList) return this.destroy();

    this._markLeaving();
    this.emit('leave', this);

    /* Un cuadro antes de preguntar, por lo mismo que en `enter()`: recien
       ahi existen las animaciones que se acaban de disparar. */
    await afterFrame();
    await whenAnimationsEnd(node);
    return this.destroy();
  }

  /**
   * Marca la salida en este componente Y EN TODA SU RAMA.
   *
   * ⚠ SIN ESTO LA SALIDA SOLO CORRE EN LA RAIZ. Es el mismo agujero que tenia
   * la entrada: los subcomponentes se ADOPTAN, no se montan, asi que nunca
   * pasan por `leave()` por su cuenta. Una pagina entera se iba con una sola
   * animacion —la del contenedor— y las de los catorce componentes de adentro
   * no se veian nunca. Existian y estaban bien; no se disparaban.
   *
   * Sin escalonar, a diferencia de la entrada: lo que aparece se presenta de a
   * uno, pero lo que se va no debe hacerte esperar. Todo sale junto.
   */
  _markLeaving() {
    const node = this.el;
    if (!node?.classList) return;
    node.classList.remove(ENTER_CLASS);
    node.classList.add(LEAVE_CLASS);
    for (const child of this._children) child._markLeaving?.();
  }

  /** Saca el componente del DOM sin destruirlo (se puede volver a montar). */
  unmount() {
    this.el?.remove();
    this.isMounted = false;
    this.onUnmount?.();
    this.emit('unmount', this);
    return this;
  }

  /**
   * Cambia opciones y re-renderiza en el lugar.
   * Si una subclase puede actualizarse sin re-renderizar todo, que sobreescriba
   * `onUpdate(patch)` y devuelva `true` para saltear el re-render.
   */
  update(patch = {}) {
    const previous = this.options;
    this.options = { ...previous, ...patch };

    const handled = this.onUpdate?.(patch, previous) === true;

    if (!handled && this.el) {
      this._releaseDomListeners();
      const next = this.render();
      next.__component = this;
      this.el.replaceWith(next);
      this.el = next;
    }

    this.emit('update', { patch, options: this.options });
    return this;
  }

  /** Destruye el componente: saca del DOM, limpia listeners e hijos. */
  destroy() {
    if (this.isDestroyed) return this;
    for (const child of this._children) child.destroy?.();
    this._children = [];
    this._releaseDomListeners();
    this.onDestroy?.();
    this.el?.remove();
    this.el = null;
    this.isMounted = false;
    this.isDestroyed = true;
    this.emit('destroy', this);
    this.clearListeners();
    return this;
  }

  // ----------------------------------------------------------------- utils

  /**
   * addEventListener con limpieza automática en `update()` y `destroy()`.
   * Usalo SIEMPRE en vez de `node.addEventListener` dentro de `render()`.
   */
  listen(node, type, handler, options) {
    node.addEventListener(type, handler, options);
    this._domListeners.push({ node, type, handler, options });
    return this;
  }

  /**
   * Registra un subcomponente para que se destruya junto con el padre.
   * Es idempotente: adoptar dos veces al mismo hijo (pasa en cada `update()`,
   * porque `render()` vuelve a correr) no lo duplica.
   */
  adopt(child) {
    if (Array.isArray(child)) return child.map((c) => this.adopt(c));
    /* Los que ya murieron se sacan de la lista. Un componente puede irse solo
       —con `leave()`, sin que su padre se entere— y quedarse como referencia
       muerta adentro del padre: la lista crece y el `destroy()` del padre pasa
       por cadaveres. Limpiar al adoptar es el momento natural, porque es justo
       cuando la lista se toca. */
    this._children = this._children.filter((c) => c && !c.isDestroyed);
    if (child && !this._children.includes(child)) this._children.push(child);
    return child;
  }

  /** Atajo para leer/escribir una sola opción. */
  option(key, value) {
    if (value === undefined) return this.options[key];
    return this.update({ [key]: value });
  }

  _releaseDomListeners() {
    for (const { node, type, handler, options } of this._domListeners) {
      node.removeEventListener(type, handler, options);
    }
    this._domListeners = [];
  }
}
