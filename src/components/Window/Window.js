import { UIComponent } from '../../core/UIComponent.js';
import { el, cx, append } from '../../core/dom.js';

/**
 * Window — marco de ventana propio.
 *
 *   new Window({ title: 'Mi app', content: algo })
 *
 * Pensado para cuando se oculta el marco nativo (Electron con
 * `frame: false`) y hay que rehacerlo a mano. La barra de titulo lleva
 * `-webkit-app-region: drag` para que el sistema la tome como zona de
 * arrastre, y los botones la desactivan: si no, no se podrian clickear.
 *
 * El componente NO mueve ni cierra nada por su cuenta: emite los eventos y
 * el host decide. En Electron eso es un ipcRenderer.send del lado del
 * preload; en el navegador puede ser cualquier otra cosa.
 *
 *   win.on('close', () => window.api.closeWindow());
 */

const CONTROLS = ['minimize', 'maximize', 'close'];

export class Window extends UIComponent {
  static componentName = 'window';

  static defaults = {
    /** Texto de la barra. */
    title: '',
    /** Marca a la izquierda del titulo: string, Node o UIComponent. */
    icon: null,

    /**
     * Algo propio al ARRANQUE de la barra de titulo, donde iria el titulo.
     *
     * Es un hueco, no una pieza: acepta un nodo o un componente. Lo tipico es
     * una fila de pestañas —`tabs.listElement`, con `detachedList`— pero sirve
     * para cualquier cosa que tenga que vivir en la barra.
     *
     * ⚠ NO ARRASTRA LA VENTANA. Lo que se pone aca son controles, y un control
     * que ademas mueve la ventana al apretarlo no es un control.
     */
    leading: null,

    /**
     * El `leading` OCUPA la barra: pegado al borde y de alto completo, y el
     * icono y el titulo no se dibujan.
     *
     * ⛔ ES PARA UNA BARRA CUYO CONTENIDO ES EL TITULO. Una fila de pestañas
     * dice cual archivo se esta mirando mejor que cualquier rotulo, asi que el
     * rotulo sobra — y el relleno de la izquierda y el centrado vertical, que
     * son de una barra CON titulo, sobre algo que ocupa toda la barra dejan dos
     * aires que se leen como un error de dibujo.
     */
    leadingFill: false,
    /** Contenido: string | Node | UIComponent | array. */
    content: null,

    /** Que botones mostrar, en orden. [] los saca todos. */
    controls: ['minimize', 'maximize', 'close'],
    /**
     * Ventana MODAL: centrada, con el fondo oscurecido y por encima de todo.
     *
     * ⛔ SE DIBUJA COMO UN <dialog>, y no es un detalle de implementacion.
     * Un modal hecho a mano es una pelea contra el z-index que nunca se gana
     * del todo: siempre aparece algo que queda por encima. `<dialog>` abierto
     * con `showModal()` va a la CAPA SUPERIOR del navegador, que esta afuera
     * del orden de apilamiento de la pagina, y trae de arriba el oscurecido
     * (`::backdrop`), el centrado, el foco atrapado adentro y el cierre con
     * Escape. Nada de eso hay que reescribirlo.
     *
     * La raiz sigue siendo `.ui-window`, asi que la piel de cada pack y la
     * animacion de entrada y salida funcionan igual que en una ventana comun.
     */
    modal: false,

    /** Estado maximizado. Cambia el glifo del boton del medio. */
    maximized: false,

    /**
     * La barra es zona de arrastre del sistema operativo.
     * Poner en false si la ventana no debe poder moverse.
     */
    draggable: true,

    /** 'none' | 'sm' | 'md' | 'lg' */
    elevation: 'lg',
    width: null,
    height: null,

    /** Callbacks directos, alternativa a .on(...). */
    onMinimize: null,
    onMaximize: null,
    onClose: null,

    ariaLabel: null,
    className: null,
    dataset: null,
  };

  constructor(options) {
    super(options);
    this.maximized = Boolean(this.options.maximized);
  }

  render() {
    const o = this.options;

    this.titleNode = el('span', { class: 'ui-window__title', text: o.title });

    /* Con el `leading` ocupando la barra, el icono y el titulo no se dibujan:
       lo que hay adentro ES el titulo. Dejarlos seria decir dos veces lo mismo
       y, peor, robarle a las pestañas el ancho que necesitan. */
    const leadingNode = o.leading
      ? el('div', { class: 'ui-window__leading' }, this._track(o.leading))
      : null;

    const bar = el('header', {
      class: cx(
        'ui-window__bar',
        o.draggable && 'is-draggable',
        o.leadingFill && 'ui-window__bar--filled',
      ),
    }, o.leadingFill
      ? [leadingNode, this._renderControls()]
      : [
        o.icon ? this._renderIcon(o.icon) : null,
        this.titleNode,
        leadingNode,
        this._renderControls(),
      ]);

    // El cuerpo scrollea con la barra del sistema de diseno, no la cruda.
    const body = el('div', { class: 'ui-window__body ui-scroll ui-scroll--y ui-scroll--thin' });
    append(body, this._contentNodes());
    this.body = body;

    const node = el(o.modal ? 'dialog' : 'section', {
      class: cx(
        'ui-window',
        o.modal && 'ui-window--modal',
        o.elevation && o.elevation !== 'none' && `ui-window--elev-${o.elevation}`,
        this.maximized && 'is-maximized',
        o.className,
      ),
      style: {
        ...(o.width ? { width: o.width } : {}),
        ...(o.height ? { height: o.height } : {}),
      },
      'aria-label': o.ariaLabel || o.title || undefined,
      dataset: o.dataset || undefined,
    }, [bar, body]);

    return node;
  }

  /**
   * Abre el modal DESPUES de montarlo: `showModal()` necesita que el nodo ya
   * este en el documento.
   */
  mount(target) {
    const out = super.mount(target);
    if (this.options.modal) {
      /* try/catch y no un `if`: hay entornos —jsdom, un render de prueba— donde
         el metodo existe pero tira. Que un modal no pueda abrirse en la CAPA
         SUPERIOR no es motivo para que el componente no exista: se queda como
         una ventana comun y la pagina sigue viva. */
      try { this.el.showModal?.(); } catch { /* sin capa superior: igual se ve */ }

      /* Escape lo maneja el navegador y cerraria el <dialog> por su cuenta,
         sin avisarle a nadie — el host se quedaria creyendo que sigue abierto.
         Se corta y se emite el mismo evento que el boton de cerrar: este
         componente NO cierra nada solo, avisa y el host decide. */
      this.listen(this.el, 'cancel', (event) => {
        event.preventDefault();
        this.options.onClose?.(event, this);
        this.emit('close', event);
      });
    }
    return out;
  }

  _renderIcon(icon) {
    if (icon instanceof Node || (icon && icon.element instanceof Node)) {
      const wrap = el('span', { class: 'ui-window__icon', 'aria-hidden': 'true' });
      append(wrap, icon);
      return wrap;
    }
    const value = String(icon).trim();
    const key = value.startsWith('<') ? 'html' : 'text';
    return el('span', { class: 'ui-window__icon', 'aria-hidden': 'true', [key]: value });
  }

  _renderControls() {
    const labels = {
      minimize: 'Minimizar',
      maximize: this.maximized ? 'Restaurar' : 'Maximizar',
      close: 'Cerrar',
    };

    const buttons = this.options.controls
      .filter((name) => CONTROLS.includes(name))
      .map((name) => {
        const button = el('button', {
          class: cx(
            'ui-window__control',
            `ui-window__control--${name}`,
            name === 'maximize' && this.maximized && 'is-restore',
          ),
          type: 'button',
          'aria-label': labels[name],
        }, [el('span', { class: 'ui-window__glyph', 'aria-hidden': 'true' })]);

        this.listen(button, 'click', () => this._activate(name));
        return button;
      });

    return el('div', { class: 'ui-window__controls' }, buttons);
  }

  /**
   * Normaliza cualquier hueco de contenido y adopta los subcomponentes.
   *
   * Adoptar es lo que hace que el hijo se destruya con el padre: un componente
   * puesto a mano en el arbol sobrevive a su ventana y sigue con sus escuchas
   * colgadas de un nodo que ya no existe.
   */
  _track(value) {
    if (value === null || value === undefined) return [];
    return (Array.isArray(value) ? value : [value]).map((item) =>
      (item && typeof item === 'object' && typeof item.destroy === 'function')
        ? this.adopt(item)
        : item);
  }

  /** Normaliza `content` y adopta los subcomponentes. */
  _contentNodes() {
    return this._track(this.options.content);
  }

  _activate(name) {
    if (name === 'maximize') {
      this.setMaximized(!this.maximized);
      this.options.onMaximize?.(this.maximized, this);
      this.emit(this.maximized ? 'maximize' : 'restore', this);
      return;
    }
    if (name === 'minimize') {
      this.options.onMinimize?.(this);
      this.emit('minimize', this);
      return;
    }
    this.options.onClose?.(this);
    this.emit('close', this);
  }

  // ------------------------------------------------------------ API publica

  setTitle(title) {
    this.options.title = String(title ?? '');
    if (this.titleNode) this.titleNode.textContent = this.options.title;
    return this;
  }

  /** Cambia el estado sin re-renderizar: solo el glifo y la clase. */
  setMaximized(value = true) {
    this.maximized = Boolean(value);
    if (!this.el) return this;

    this.el.classList.toggle('is-maximized', this.maximized);
    const button = this.el.querySelector('.ui-window__control--maximize');
    if (button) {
      button.classList.toggle('is-restore', this.maximized);
      button.setAttribute('aria-label', this.maximized ? 'Restaurar' : 'Maximizar');
    }
    return this;
  }

  toggleMaximize() { return this.setMaximized(!this.maximized); }

  /** Reemplaza el contenido sin tocar la barra. */
  setContent(content) {
    this.options.content = content;
    if (!this.body) return this;
    for (const child of this._children) child.destroy?.();
    this._children = [];
    this.body.replaceChildren();
    append(this.body, this._contentNodes());
    return this;
  }

  onUpdate(patch) {
    if ('maximized' in patch) this.maximized = Boolean(patch.maximized);
    return false;
  }
}

Window.CONTROLS = CONTROLS;
