/* ===========================================================================
   REORDENAR ARRASTRANDO — EL MOTOR, SIN DUENO

   Dos gestos, los dos sobre una lista cuyas piezas se declaran con
   `data-sort-id` y nacen `draggable`:

     `sortable`      cambiar el ORDEN de una lista, en cualquiera de los dos
                     ejes. Abre el hueco de verdad mientras se arrastra.
     `sortableTree`  mover una fila en una lista cuyas filas CUELGAN unas de
                     otras: ademas del lugar, de quien cuelga.

   ⛔ ESTO NO ES UN COMPONENTE, Y POR ESO VIVE EN `core/`. Reordenar no es una
   cosa que se pone en la pantalla: es una capacidad que una cosa TIENE. Una
   fila de pestanas, una lista de capas, una pila de paneles — ninguna deja de
   ser lo que era por poder reordenarse. Hecho componente habria que meter la
   lista adentro de otra caja, y esa caja traeria su propio layout a pelear con
   el que la lista ya tenia.

   Quien lo quiere lo declara con `reorderable: true` y recibe `onReorder`.

   ⛔ UN SOLO MOTOR PARA LOS DOS EJES. La cuenta de una fila horizontal y la de
   una columna vertical es LA MISMA con otro nombre: `left/width/clientX` en vez
   de `top/height/clientY`. Escritas dos veces se separan — una arregla un borde
   y la otra se queda con el error, y nadie se entera porque las dos "andan".
   El eje entra como parametro y la cuenta es una.

   ⛔ NINGUNO DE LOS DOS REORDENA NADA. Avisan lo que se pidio y ahi termina su
   trabajo. Moviendo los nodos por su cuenta, lo que se ve y lo que el dueno
   tiene guardado dejan de coincidir al primer re-render — y el re-render llega,
   porque algo cambio.
   =========================================================================== */

/** El atributo que declara una pieza y su identidad. El mismo para los dos. */
const ID = 'data-sort-id';

/* ⛔ TODO LO QUE CAMBIA ENTRE UN EJE Y EL OTRO, Y NADA MAS QUE ESO. Si algun
   dia hiciera falta una cuenta propia por eje, es senal de que la cuenta
   compartida estaba mal: son la misma geometria girada noventa grados. */
const EJES = {
  y: {
    inicio: 'top',
    fin: 'bottom',
    medida: 'height',
    puntero: 'clientY',
    correr: (d) => `translateY(${d}px)`,
  },
  x: {
    inicio: 'left',
    fin: 'right',
    medida: 'width',
    puntero: 'clientX',
    correr: (d) => `translateX(${d}px)`,
  },
};

/**
 * Deja reordenar arrastrando las piezas de un contenedor.
 *
 * @param {object} opciones
 * @param {HTMLElement} opciones.list contenedor de las piezas
 * @param {'x'|'y'} [opciones.axis] en que direccion se ordenan
 * @param {(ids: string[]) => void} opciones.onReorder el orden nuevo, completo
 * @returns {() => void} como soltar las escuchas
 */
export function sortable({ list, axis = 'y', onReorder }) {
  const eje = EJES[axis] || EJES.y;

  let arrastrada = null;
  /* ⛔ LA GEOMETRIA SE CONGELA AL EMPEZAR. Todo lo que sigue se decide contra
     DONDE ESTABAN las piezas cuando se agarro una, no contra donde se las ve
     ahora. Mirando lo que hay debajo del cursor, la cuenta se muerde la cola:
     correr las piezas cambia cual esta debajo, eso cambia el destino, eso
     cambia el corrimiento — y la lista entra en un ida y vuelta infinito. */
  let tomadas = [];
  /** El hueco que deja la que viaja: su medida mas el aire que la separa. */
  let salto = 0;
  let destino = -1;

  const piezas = () => [...list.querySelectorAll(`[${ID}]`)];

  const limpiar = () => {
    for (const pieza of piezas()) {
      pieza.style.transform = '';
      pieza.removeAttribute('data-ui-animating');
      pieza.classList.remove('is-dragging');
    }
  };

  /**
   * En que lugar caeria, contando la lista SIN la que se arrastra.
   *
   * Se cuenta cuantas quedaron antes del cursor, por su mitad. Como las
   * medidas son las de antes de mover nada, el mismo lugar del cursor da
   * siempre el mismo resultado.
   */
  const lugarPara = (punto) => {
    let n = 0;
    for (const caja of tomadas) {
      if (caja.id === arrastrada) continue;
      if (punto > caja.inicio + caja.medida / 2) n += 1;
      else break;
    }
    return n;
  };

  /** Donde empieza el lugar `hasta`, con la lista ya corrida. */
  const inicioDelLugar = (hasta, desde) => {
    const resto = [];
    for (let i = 0; i < tomadas.length; i += 1) {
      if (i === desde) continue;
      resto.push({
        inicio: tomadas[i].inicio + (i > desde ? -salto : 0),
        medida: tomadas[i].medida,
      });
    }
    if (hasta < resto.length) return resto[hasta].inicio;
    const ultima = resto[resto.length - 1];
    // El aire entre piezas es lo que sobra del hueco despues de su medida.
    const aire = salto - tomadas[desde].medida;
    return ultima ? ultima.inicio + ultima.medida + aire : tomadas[desde].inicio;
  };

  /**
   * Corre las piezas para abrir el hueco donde caeria la arrastrada.
   *
   * ⛔ EL HUECO SE ABRE DE VERDAD, no se dibuja una rayita. Una marca en el
   * borde dice donde va a caer, pero no dice si soltar CAMBIA algo: arrastrar
   * de vuelta al lugar de origen se ve igual que arrastrar a otro lado.
   * Abriendo el hueco, el resultado esta a la vista antes de soltar — y cuando
   * soltar no hace nada, no se mueve nada, que es la forma mas clara de
   * decirlo.
   *
   * Cada pieza se mueve por dos motivos que se suman: pierde a la que viaja de
   * su lado de atras —si estaba antes— y la gana si el hueco le queda atras.
   * Cuando los dos se cancelan, no se mueve.
   */
  const previsualizar = (hasta) => {
    const nodos = piezas();
    const desde = tomadas.findIndex((caja) => caja.id === arrastrada);
    if (desde < 0) return;
    for (let i = 0; i < nodos.length; i += 1) {
      /* ⛔ LA QUE VIAJA TAMBIEN SE MUEVE, y eso es la mitad del asunto.
         Dejandola en su lugar, el hueco se abre de un lado y ella sigue
         ocupando el otro: las que se corren terminan MONTADAS encima de ella.
         Llevandola al hueco, lo que se ve es un solo fantasma, en el lugar
         exacto donde va a quedar. */
      const d = i === desde
        ? inicioDelLugar(hasta, desde) - tomadas[desde].inicio
        : (i > desde ? -salto : 0) + ((i < desde ? i : i - 1) >= hasta ? salto : 0);
      /* El permiso para animar el movimiento. Sin el, la pieza salta: mover no
         se anima por defecto en ningun lado, justamente para no pelearle a
         quien mueva algo por JS. Ver Container.css. */
      nodos[i].setAttribute('data-ui-animating', '');
      nodos[i].style.transform = d ? eje.correr(d) : '';
    }
  };

  const onDragStart = (event) => {
    const pieza = event.target.closest?.(`[${ID}]`);
    if (!pieza || !list.contains(pieza)) return;
    if (pieza.matches('[disabled], .is-disabled')) return;
    arrastrada = pieza.getAttribute(ID);

    tomadas = piezas().map((nodo) => {
      const caja = nodo.getBoundingClientRect();
      return {
        id: nodo.getAttribute(ID),
        inicio: caja[eje.inicio],
        fin: caja[eje.fin],
        medida: caja[eje.medida],
      };
    });
    const desde = tomadas.findIndex((caja) => caja.id === arrastrada);
    const propia = tomadas[desde];
    const siguiente = tomadas[desde + 1];
    const anterior = tomadas[desde - 1];
    /* Al vecino de adelante se lo mide desde el borde de adelante y al de atras
       desde el de atras: con la misma cuenta para los dos, siendo la ultima el
       "aire" pasaba a ser todo lo que tenia detras. */
    const aire = siguiente ? siguiente.inicio - propia.fin
      : anterior ? propia.inicio - anterior.fin
      : 0;
    salto = propia.medida + Math.max(aire, 0);
    destino = -1;

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      /* Firefox no empieza el arrastre si no hay datos puestos. El valor no lo
         lee nadie: quien decide es `arrastrada`, que no se va de aca. */
      event.dataTransfer.setData('text/plain', arrastrada);
    }
    pieza.classList.add('is-dragging');
  };

  const onDragOver = (event) => {
    if (arrastrada === null) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    const hasta = lugarPara(event[eje.puntero]);
    if (hasta === destino) return;
    destino = hasta;
    previsualizar(hasta);
  };

  const onDrop = (event) => {
    if (arrastrada === null) return;
    event.preventDefault();
    const hasta = lugarPara(event[eje.puntero]);
    const orden = tomadas.map((caja) => caja.id);
    const desde = orden.indexOf(arrastrada);
    const movida = arrastrada;
    limpiar();
    const ids = orden.filter((id) => id !== movida);
    // Soltar donde ya estaba no es un cambio: no hay para que avisar.
    if (desde >= 0 && hasta === desde) return;
    ids.splice(hasta, 0, movida);
    onReorder?.(ids);
  };

  const onDragEnd = () => {
    arrastrada = null;
    tomadas = [];
    destino = -1;
    limpiar();
  };

  /* ⛔ LAS ESCUCHAS VAN EN EL CONTENEDOR, no en cada pieza. Una lista se vuelve
     a dibujar entera cada vez que cambia algo: enganchadas a las piezas, habria
     que volver a engancharlas en cada dibujado y basta olvidarse una vez para
     que el arrastre deje de funcionar sin ningun error que lo diga. */
  list.addEventListener('dragstart', onDragStart);
  list.addEventListener('dragover', onDragOver);
  list.addEventListener('drop', onDrop);
  list.addEventListener('dragend', onDragEnd);

  return () => {
    list.removeEventListener('dragstart', onDragStart);
    list.removeEventListener('dragover', onDragOver);
    list.removeEventListener('drop', onDrop);
    list.removeEventListener('dragend', onDragEnd);
    limpiar();
  };
}

/* ===========================================================================
   ARRASTRAR EN UNA LISTA QUE ES UN ARBOL
   ---------------------------------------------------------------------------
   ⛔ UN ARBOL NO ES UNA COLUMNA, Y POR ESO NO ALCANZA CON REORDENAR. En una
   lista plana el unico destino posible es "en que lugar", y `sortable` —que
   abre el hueco— lo dice perfecto. En un arbol hay DOS preguntas: en que lugar
   Y DE QUIEN CUELGA. Con solo la primera, sacar un hijo a un nivel intermedio
   es imposible: se lo puede reordenar entre sus hermanos o meterlo adentro de
   otro, y para subirlo hay que ir a buscar un pedazo de vacio al final.

   ⛔ TRES ZONAS POR FILA, Y ESO ES TODO EL VOCABULARIO:

     el borde de arriba   queda ANTES que esa fila, COMO HERMANA suya
     el medio             queda ADENTRO de esa fila
     el borde de abajo    queda DESPUES que esa fila, COMO HERMANA suya

   Es lo que hace cualquier arbol —el explorador de archivos, la jerarquia de
   cualquier editor 3D— y es lo que vuelve alcanzable cualquier nivel: para
   dejar algo al nivel de una fila, se lo suelta en SU borde.

   ⛔ LOS BORDES SON GRANDES, NO UNA RAYA DE CUATRO PIXELES. Apuntarle a la
   juntura entre dos filas es la queja numero uno de cualquier arbol: con un
   blanco de pocos pixeles, uno apunta al hueco y cae adentro de la fila. Aca
   se reparte: casi un tercio arriba, casi un tercio abajo, y el medio —que es
   el gesto menos frecuente— se queda con lo que sobra, que igual es la franja
   mas ancha de la fila.

   ⛔ Y LA RAYA SE DIBUJA CON LA SANGRIA DEL DESTINO. Pegada al borde izquierdo
   no distingue "hermana de la fila de arriba" de "hermana de su padre": las dos
   caen en la misma juntura. Corrida a la profundidad del destino, la respuesta
   se lee antes de soltar.

   ⚠ NO REEMPLAZA A `sortable`. Esa sigue siendo la buena para una lista PLANA:
   ahi la unica pregunta es el lugar, y abrir el hueco de verdad lo muestra
   mejor que cualquier raya.
   =========================================================================== */

/** Que parte de la fila es borde. El resto del alto es "adentro". */
const BORDE = 0.3;

/**
 * Cuanto se corre la raya por cada nivel, si nadie dice otra cosa.
 *
 * ⚠ TIENE QUE SER LA MISMA QUE USA LA LISTA PARA CORRER SUS FILAS. Con dos
 * numeros, la raya promete un nivel y la fila aparece en otro. Por eso se puede
 * pasar: quien dibuja las filas es el que sabe cuanto las corre.
 */
const SANGRIA = 14;

/**
 * Deja mover filas de un arbol arrastrandolas.
 *
 * @param {object} opciones
 * @param {HTMLElement} opciones.list contenedor de las filas
 * @param {(id: string) => number} [opciones.depthOf] a que nivel se dibuja cada fila
 * @param {(arrastrada: string, destino: string, lugar: string) => boolean} [opciones.canDrop]
 * @param {(arrastrada: string, lugar: 'before'|'after'|'inside', destino: string) => void} opciones.onMove
 * @param {number} [opciones.indent] cuanto se corre cada nivel, en pixeles
 * @returns {() => void} como soltar las escuchas
 */
export function sortableTree({ list, depthOf, canDrop, onMove, indent = SANGRIA }) {
  let arrastrada = null;
  /** La fila que ahora mismo esta marcada, para poder desmarcarla. */
  let marcada = null;
  let raya = null;

  const filaDe = (nodo) => (nodo?.closest ? nodo.closest(`[${ID}]`) : null);

  /** Donde caeria, mirando en que tercio de la fila esta el puntero. */
  const lugarEn = (fila, clientY) => {
    const caja = fila.getBoundingClientRect();
    if (caja.height <= 0) return 'inside';
    const parte = (clientY - caja.top) / caja.height;
    if (parte < BORDE) return 'before';
    if (parte > 1 - BORDE) return 'after';
    return 'inside';
  };

  const limpiar = () => {
    if (marcada) marcada.removeAttribute('data-ui-drop');
    marcada = null;
    if (raya) raya.hidden = true;
    for (const fila of list.querySelectorAll('.is-dragging')) {
      fila.classList.remove('is-dragging');
    }
  };

  /** La raya, creada a demanda: una lista que nadie arrastra no la paga. */
  const laRaya = () => {
    if (raya) return raya;
    /* El contenedor tiene que estar posicionado para que la raya se ubique
       contra el, y no contra lo que haya mas arriba en la pagina. */
    if (getComputedStyle(list).position === 'static') list.style.position = 'relative';
    raya = document.createElement('div');
    raya.className = 'ui-tree-drop';
    raya.hidden = true;
    list.append(raya);
    return raya;
  };

  const mostrar = (fila, lugar) => {
    const estaba = arrastrada;
    limpiar();
    arrastrada = estaba;
    if (lugar === 'inside') {
      marcada = fila;
      fila.setAttribute('data-ui-drop', 'inside');
      return;
    }
    const caja = fila.getBoundingClientRect();
    const marco = list.getBoundingClientRect();
    const nodo = laRaya();
    const destino = fila.getAttribute(ID);
    /* La sangria del DESTINO: la raya se dibuja donde va a quedar la fila, no
       donde esta la que se esta senalando. Hermana de ella es su mismo nivel. */
    const nivel = depthOf ? depthOf(destino) : 0;
    nodo.style.insetInlineStart = `${nivel * indent}px`;
    nodo.style.insetInlineEnd = '0';
    nodo.style.top = `${(lugar === 'before' ? caja.top : caja.bottom) - marco.top}px`;
    nodo.hidden = false;
  };

  const onDragStart = (event) => {
    const fila = filaDe(event.target);
    if (!fila || !list.contains(fila)) return;
    if (fila.matches('[disabled], .is-disabled')) return;
    arrastrada = fila.getAttribute(ID);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', arrastrada);
    }
    fila.classList.add('is-dragging');
  };

  const onDragOver = (event) => {
    if (arrastrada === null) return;
    const fila = filaDe(event.target);
    if (!fila || !list.contains(fila)) {
      limpiar();
      return;
    }
    const destino = fila.getAttribute(ID);
    const lugar = lugarEn(fila, event.clientY);
    /* ⛔ LA MISMA PREGUNTA QUE AL SOLTAR, Y ANTES DE DIBUJAR NADA. Marcando un
       destino que despues se rechaza, el arrastre promete algo que no va a
       pasar y soltar no hace nada sin decir por que. */
    if (destino === arrastrada || (canDrop && !canDrop(arrastrada, destino, lugar))) {
      const estaba = arrastrada;
      limpiar();
      arrastrada = estaba;
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    mostrar(fila, lugar);
  };

  const onDrop = (event) => {
    if (arrastrada === null) return;
    const fila = filaDe(event.target);
    if (!fila || !list.contains(fila)) return;
    const destino = fila.getAttribute(ID);
    const lugar = lugarEn(fila, event.clientY);
    const movida = arrastrada;
    limpiar();
    if (destino === movida || (canDrop && !canDrop(movida, destino, lugar))) return;
    event.preventDefault();
    /* Lo que cae en una fila es de esta lista: frenarlo evita que el contenedor
       de atras lo entienda como "soltar en el vacio" y lo saque a la raiz. */
    event.stopPropagation();
    onMove?.(movida, lugar, destino);
  };

  const onDragEnd = () => {
    arrastrada = null;
    limpiar();
  };

  /* Salirse de la lista apaga la marca: sin esto, la raya queda dibujada en el
     ultimo lugar que se senalo aunque el puntero ya este en otro panel. */
  const onDragLeave = (event) => {
    if (!list.contains(event.relatedTarget)) {
      const estaba = arrastrada;
      limpiar();
      arrastrada = estaba;
    }
  };

  list.addEventListener('dragstart', onDragStart);
  list.addEventListener('dragover', onDragOver);
  list.addEventListener('drop', onDrop);
  list.addEventListener('dragend', onDragEnd);
  list.addEventListener('dragleave', onDragLeave);

  return () => {
    list.removeEventListener('dragstart', onDragStart);
    list.removeEventListener('dragover', onDragOver);
    list.removeEventListener('drop', onDrop);
    list.removeEventListener('dragend', onDragEnd);
    list.removeEventListener('dragleave', onDragLeave);
    limpiar();
    raya?.remove();
    raya = null;
  };
}
