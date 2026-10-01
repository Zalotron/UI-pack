import { Container } from '../../src/index.js';

/* ⛔ UNA FILA NO ES UNA CAJA: es `variant: "list"`, el ghost que responde al
   mouse. Con filas que son paneles, cada una trae su borde y su superficie —
   veinte objetos de una escena se ven como veinte cajas apiladas, el ojo cuenta
   bordes en vez de leer nombres, y el aire entre ellas hace que una lista de
   veinte no entre en la pantalla.

   ⚠ Y ES BAJA. El relleno sale de la escala de ESPACIO y no de la de relleno de
   contenedor: la más chica de esa escala arranca en 10px por lado, que es el
   aire de una caja con contenido adentro, no el de un renglón de una lista.
   Una lista se mide en cuántas filas ves de una vez.

   Lo único propio de cada fila es su identidad; el `draggable` se lo pone el
   contenedor de afuera. */
const fila = (item, sangria = 0) =>
  new Container({
    variant: 'list', align: 'start', fullWidth: true, padding: 'none',
    paddingBlock: 'var(--ui-space-1)',
    paddingInline: 'var(--ui-space-2)',
    content: item.label,
    dataset: { sortId: item.id },
    ...(sangria ? { marginInline: `${sangria}px 0` } : {}),
  });

/* ⛔ LA LISTA VIVE ADENTRO DE UNA CAJA, Y LA CAJA ES LA QUE SE VE. Las filas no
   se dibujan —ese es el punto del variant— así que sin un contorno alrededor no
   hay nada que diga dónde empieza y dónde termina la lista: cuatro nombres
   sueltos sobre el fondo de la página no se leen como una lista, se leen como
   cuatro textos.

   Sin relleno: una fila de lista va de borde a borde, que es lo que hace que el
   resaltado se lea como "este renglón" y no como "esta pastilla". */
const caja = (lista) =>
  new Container({
    variant: 'solid', padding: 'none', layout: 'stack', gap: 'none',
    fullWidth: true, items: 'stretch', content: lista,
  });

export default {
  id: 'container',
  name: 'Container',

  examples: [
    {
      render: () =>
        new Container({
          // auto-fit: reparten todo el ancho y bajan de fila solas si no entran
          layout: 'grid', columnMin: '160px', gap: 'sm',
          variant: 'ghost', padding: 'none', fullWidth: true,
          content: ['panel', 'solid', 'outline', 'ghost'].map(
            (variant) => new Container({ variant, content: variant }),
          ),
        }),
    },
    {
      /* Reordenar es una CAPACIDAD del contenedor, no otro componente: la misma
         pila con una opción más. El eje sale del `layout`.

         Los dos van al lado: son el mismo gesto con una pregunta de diferencia,
         y apilados se leen como dos cosas distintas. */
      title: 'Reordenable · plano y árbol',
      render: () => {
        // -- Plano: la única pregunta es EN QUÉ LUGAR ------------------------
        let items = [
          { id: 'a', label: 'Primera' },
          { id: 'b', label: 'Segunda' },
          { id: 'c', label: 'Tercera' },
          { id: 'd', label: 'Cuarta' },
        ];
        const lista = new Container({
          layout: 'stack', gap: 'none', variant: 'ghost', padding: 'none',
          fullWidth: true, items: 'stretch',
          reorderable: true,
          content: items.map((i) => fila(i)),
          onReorder: (ids) => {
            items = ids.map((id) => items.find((i) => i.id === id));
            lista.update({ content: items.map((i) => fila(i)) });
          },
        });

        // -- Árbol: además del lugar, DE QUIÉN CUELGA -------------------------
        let nodos = [
          { id: 'escena', label: 'Escena', parent: null },
          { id: 'luz', label: 'Luz', parent: 'escena' },
          { id: 'camara', label: 'Cámara', parent: 'escena' },
          { id: 'piso', label: 'Piso', parent: null },
        ];
        const padreDe = (id) => nodos.find((i) => i.id === id)?.parent ?? null;
        const nivel = (id) => {
          let n = 0;
          for (let p = padreDe(id); p; p = padreDe(p)) n += 1;
          return n;
        };
        /** El nodo y todo lo que cuelga de él: se mueven juntos. */
        const rama = (id) => {
          const dentro = new Set([id]);
          for (const i of nodos) if (dentro.has(i.parent)) dentro.add(i.id);
          return nodos.filter((i) => dentro.has(i.id));
        };
        const filasArbol = () => nodos.map((i) => fila(i, nivel(i.id) * 14));

        const arbol = new Container({
          layout: 'stack', gap: 'none', variant: 'ghost', padding: 'none',
          fullWidth: true, items: 'stretch',
          reorderable: 'tree',
          depthOf: (id) => nivel(id),
          content: filasArbol(),
          // Nadie puede colgar de su propia descendencia: sería un ciclo.
          canDrop: (movida, destino) => !rama(movida).some((i) => i.id === destino),
          onMove: (movida, lugar, destino) => {
            const bloque = rama(movida);
            nodos = nodos.filter((i) => !bloque.includes(i));
            bloque[0].parent = lugar === 'inside' ? destino : padreDe(destino);
            const at = nodos.findIndex((i) => i.id === destino);
            nodos.splice(lugar === 'before' ? at : at + 1, 0, ...bloque);
            arbol.update({ content: filasArbol() });
          },
        });

        return new Container({
          layout: 'grid', columns: 2, gap: 'md',
          variant: 'ghost', padding: 'none', fullWidth: true, items: 'start',
          content: [caja(lista), caja(arbol)],
        });
      },
    },
  ],
};
