/**
 * Emisor de eventos mínimo, sin dependencias.
 * Es la base de `UIComponent`, pero también sirve suelto.
 */
export class EventEmitter {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._events = new Map();
  }

  /**
   * Suscribe un handler a un evento.
   * @returns {() => void} función para desuscribir
   */
  on(type, handler) {
    if (typeof handler !== 'function') throw new TypeError('handler debe ser una función');
    if (!this._events.has(type)) this._events.set(type, new Set());
    this._events.get(type).add(handler);
    return () => this.off(type, handler);
  }

  /** Suscribe un handler que se ejecuta una sola vez. */
  once(type, handler) {
    const wrapper = (...args) => {
      this.off(type, wrapper);
      handler(...args);
    };
    return this.on(type, wrapper);
  }

  /** Desuscribe un handler (o todos los de un tipo si se omite). */
  off(type, handler) {
    if (!this._events.has(type)) return this;
    if (!handler) this._events.delete(type);
    else this._events.get(type).delete(handler);
    return this;
  }

  /** Dispara un evento. */
  emit(type, payload) {
    const handlers = this._events.get(type);
    if (handlers) {
      for (const handler of [...handlers]) handler(payload, this);
    }
    // '*' recibe todos los eventos: útil para debug o logging.
    const wildcard = this._events.get('*');
    if (wildcard) {
      for (const handler of [...wildcard]) handler({ type, payload }, this);
    }
    return this;
  }

  /** Elimina todas las suscripciones. */
  clearListeners() {
    this._events.clear();
    return this;
  }
}
