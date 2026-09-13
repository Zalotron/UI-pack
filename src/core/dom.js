/**
 * Helpers de DOM. Son lo único que usan los componentes para construir markup,
 * así evitamos innerHTML disperso y strings de template por todos lados.
 */

/** Une clases ignorando falsy. `cx('a', cond && 'b', ['c','d'])` */
export function cx(...parts) {
  const out = [];
  for (const part of parts) {
    if (!part) continue;
    if (Array.isArray(part)) out.push(cx(...part));
    else if (typeof part === 'object') {
      for (const [key, value] of Object.entries(part)) if (value) out.push(key);
    } else out.push(String(part));
  }
  return out.join(' ');
}

/**
 * Crea un elemento.
 *
 *   el('button', { class: 'ui-btn', text: 'Ok', onclick: fn }, [icon])
 *
 * Props especiales: `class`/`className`, `text`, `html`, `style` (objeto),
 * `dataset` (objeto), `on*` (listener). El resto se setea como atributo;
 * `true` => atributo vacío, `null`/`undefined`/`false` => se omite.
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;

    if (key === 'class' || key === 'className') node.className = cx(value);
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'style' && typeof value === 'object') setStyle(node, value);
    else if (key === 'dataset' && typeof value === 'object') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, value);
  }

  append(node, children);
  return node;
}

/** Espacio de nombres de SVG. `createElement` no sirve: un <circle> creado en
 *  el namespace de HTML existe en el DOM y no se dibuja nunca. */
const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Lo mismo que `el()`, pero en el namespace de SVG.
 *
 *   svg('svg', { viewBox: '0 0 24 24' }, [svg('path', { d: 'M4 12h16' })])
 *
 * Existe porque hay dos componentes que NO se pueden hacer con divs: el aro de
 * progreso (que se dibuja con `stroke-dasharray` sobre un círculo) y los
 * iconos. Las mismas props especiales que `el()`, con una diferencia: en SVG
 * `className` es de solo lectura, así que la clase va por atributo.
 */
export function svg(tag, props = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);

  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;

    if (key === 'class' || key === 'className') node.setAttribute('class', cx(value));
    else if (key === 'text') node.textContent = value;
    else if (key === 'style' && typeof value === 'object') setStyle(node, value);
    else if (key === 'dataset' && typeof value === 'object') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, value);
  }

  append(node, children);
  return node;
}

/**
 * Aplica un objeto de estilos a un nodo.
 * Las custom properties (`--algo`) NO se pueden setear por asignación sobre
 * `node.style`: hay que pasar por `setProperty`. Por eso no alcanza con un
 * `Object.assign`, que las descartaría en silencio.
 */
export function setStyle(node, styles) {
  for (const [key, value] of Object.entries(styles)) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('--')) node.style.setProperty(key, String(value));
    else node.style[key] = value;
  }
  return node;
}

/**
 * Agrega hijos a un nodo. Acepta strings, nodos, arrays anidados,
 * instancias de UIComponent (cualquier cosa con `.element`) y null/false.
 */
export function append(parent, children) {
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (child === null || child === undefined || child === false || child === '') continue;
    if (Array.isArray(child)) append(parent, child);
    else if (child instanceof Node) parent.appendChild(child);
    else if (child && typeof child === 'object' && child.element instanceof Node) {
      parent.appendChild(child.element);
    } else parent.appendChild(document.createTextNode(String(child)));
  }
  return parent;
}

/** Vacía un nodo. */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

/** Resuelve un target que puede venir como selector, nodo o componente. */
export function resolveNode(target) {
  if (!target) return null;
  if (typeof target === 'string') return document.querySelector(target);
  if (target instanceof Node) return target;
  if (target.element instanceof Node) return target.element;
  return null;
}

export const qs = (selector, scope = document) => scope.querySelector(selector);
export const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

/** Contador para ids únicos (labels, aria-controls, etc.). */
let counter = 0;
export const uniqueId = (prefix = 'ui') => `${prefix}-${(++counter).toString(36)}`;
