import { Container, Tile } from '../../src/index.js';

/* ⛔ UNA FILA CON NOMBRE ES UN `Tile`, NO UN CONTENEDOR. Se ve igual que un
   `Container` con `variant: "list"` —las dos cosas son un ghost que responde al
   mouse— pero una ficha SABE cuál de sus partes es el nombre, y eso es lo único
   que permite renombrarla en el lugar. El contenedor lleva contenido cualquiera:
   no tiene cómo saber qué reemplazar por un campo.

   El `variant: "list"` sigue siendo el correcto para una fila que NO es un
   nombre —dos controles, una ficha y su tacho al lado—. */
const fila = (item, nivel = 0) =>
  new Tile({
    label: item.label,
    layout: 'row',
    size: 'sm',
    depth: nivel,
    editableLabel: true,
    dataset: { sortId: item.id },
  });

/* ⛔ LA LISTA VIVE ADENTRO DE UNA CAJA, Y LA CAJA ES LA QUE SE VE. Las filas no
   se dibujan —ese es el punto— así que sin un contorno alrededor no hay nada que
   diga dónde empieza y dónde termina: cuatro nombres sueltos sobre el fondo se
   leen como cuatro textos, no como una lista.

   Sin relleno: una fila va de borde a borde, que es lo que hace que el resaltado
   se lea como "este renglón" y no como "esta pastilla". */
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

         Las filas además se renombran: doble click en el nombre, o la tecla de
         renombrar con la fila enfocada. Ver src/keys.js.

         Los dos van al lado: son el mismo gesto con una pregunta de diferencia,
         y apilados se leen como dos cosas distintas. */
      title: 'Reordenable y renombrable · plano y árbol',
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
        const filasArbol = () => nodos.map((i) => fila(i, nivel(i.id)));

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
