import { UIComponent } from '../../core/UIComponent.js';
import { svg, cx } from '../../core/dom.js';
import { ICONS, ICON_VIEWBOX } from './icons.js';

/**
 * Icono SVG de un set propio.
 *
 *   new Icon({ name: 'play' })
 *   new Icon({ name: 'trash', size: 'lg', label: 'Borrar' })
 *   new Icon({ path: 'M4 12h16' })              // uno tuyo, sin registrar
 *   Icon.add('logo', ['M2 2h20v20H2z'])         // uno tuyo, para todos
 *
 * Son de TRAZO, nunca de relleno. No es una preferencia de dibujo: es lo que
 * los vuelve skineables. Un relleno solo se puede pintar de un color; un trazo
 * tiene grosor, remate y union, que es justo lo que cambia de un pack a otro —
 * fino y recto en blueprint, gordo y redondeado en clay, duro en cyber.
 *
 * ACCESIBILIDAD: un icono sin `label` es DECORATIVO y se esconde del lector de
 * pantalla. Es el default correcto — casi siempre acompaña a un texto que ya
 * dice lo mismo, y anunciarlo dos veces es peor que no anunciarlo. Cuando el
 * icono es el unico contenido (un boton solo con icono), pasale `label`.
 */
export class Icon extends UIComponent {
  static componentName = 'icon';

  static defaults = {
    /** Nombre del set. Ver `Icon.names`. */
    name: null,
    /** 'sm' | 'md' | 'lg' o cualquier medida CSS. */
    size: 'md',
    /** Texto para lectores de pantalla. Sin esto el icono es decorativo. */
    label: null,
    /**
     * Uno o varios `d` propios, sin registrar nada. Gana sobre `name`.
     * Es la valvula de escape: nadie tiene que editar el set para usar un
     * icono suyo.
     */
    path: null,
    /** Clases extra, para engancharle las propias desde donde se use. */
    className: null,
    /** `data-*` propios. Mismo motivo. */
    dataset: null,
  };

  /** Los nombres disponibles. */
  static get names() {
    return Object.keys(ICONS);
  }

  /** Suma un icono al set, para todas las instancias. */
  static add(name, paths) {
    ICONS[name] = Array.isArray(paths) ? paths : [paths];
    return this;
  }

  /** Los `d` que hay que dibujar, vengan de donde vengan. */
  get paths() {
    const { path, name } = this.options;
    if (path) return Array.isArray(path) ? path : [path];
    const found = ICONS[name];
    if (found) return found;
    /* Un nombre que no existe NO se dibuja vacio en silencio: un hueco del
       tamano justo es invisible y el bug aparece mucho despues. */
    if (name) console.warn(`Icon: no existe "${name}". Disponibles: ${Icon.names.join(', ')}`);
    return [];
  }

  render() {
    const o = this.options;
    const preset = ['sm', 'md', 'lg'].includes(o.size);

    return svg('svg', {
      class: cx('ui-icon', preset && `ui-icon--${o.size}`, o.className),
      dataset: o.dataset || undefined,
      viewBox: `0 0 ${ICON_VIEWBOX} ${ICON_VIEWBOX}`,
      /* Sin rotulo es decorativo: se esconde. Con rotulo es contenido, y le
         hace falta el rol — un <svg> suelto no es una imagen para todos los
         lectores de pantalla. */
      role: o.label ? 'img' : null,
      'aria-label': o.label || null,
      'aria-hidden': o.label ? null : 'true',
      /* Un SVG es focuseable por defecto en algunos navegadores, y un icono
         nunca deberia estar en el orden de tabulacion. */
      focusable: 'false',
      style: preset ? null : { '--icon-size': o.size },
      /* ⛔ EL DIBUJO VA DOS VECES, Y NO ES UN DESPERDICIO.
         El de atras es el HALO: un segundo trazo, mas ancho, que rodea al
         dibujo. Apagado por defecto (`stroke: none`), asi que para cualquier
         pack que no lo use no cambia nada.

         Hace falta que sea un trazo de VERDAD y no una sombra proyectada por
         dos motivos: una sombra rodea peor —se nota en las esquinas, donde las
         cuatro direcciones no se juntan— y sobre todo no se puede texturar
         aparte, porque no es una capa propia. Este grupo si lo es. */
    }, [
      svg('g', { class: 'ui-icon__halo' }, this.paths.map((d) => svg('path', { d }))),
      svg('g', { class: 'ui-icon__mark' }, this.paths.map((d) => svg('path', { d }))),
    ]);
  }

  setName(name) { return this.update({ name }); }
}
