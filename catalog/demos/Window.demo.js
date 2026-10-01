import { Container, Window, Button, Tabs, config } from '../../src/index.js';
import { packs } from '../../src/styles/packs/index.js';

export default {
  id: 'window',
  name: 'Window',

  examples: [
    {
      render: () =>
        new Window({
          /* El nombre del pack activo. `render()` corre en cada armado, y el
             catálogo se rearma al cambiar de estilo, así que la ventana dice
             siempre en qué estética estás parado — que es más útil que un
             nombre inventado, y de paso se ve cómo trata cada pack un título
             largo o corto. */
          title: packs[config.STYLE_PACK].label,
          icon: '◆',
          height: '220px',
          content: new Container({
            layout: 'stack', gap: 'md', variant: 'ghost',
            align: 'start', items: 'flex-start', fullWidth: true,
            content: [
              // Contenido de sobra, para que se vea la barra de scroll.
              ...Array.from({ length: 6 }, (_, i) =>
                new Container({ fullWidth: true, align: 'start', content: `Bloque ${i + 1}` })),
              new Button({ label: 'Acción', size: 'sm' }),
            ],
          }),
        }),
    },
    {
      /* ⛔ LA BARRA DE TITULO SON LAS PESTAÑAS. La fila se dibuja AFUERA del
         componente —`detachedList`— y se monta en el hueco de la barra; adentro
         de la ventana quedan solo los paneles. El titulo y el icono no se
         dibujan: cual archivo se esta mirando lo dicen las pestañas mejor que
         cualquier rotulo.

         La fila sigue siendo del Tabs: las escuchas, el teclado, la rayita y el
         reordenamiento son suyos. Lo unico que cambia es donde se monta. */
      title: 'La barra de título son las pestañas',
      render: () => {
        let hojas = [
          { id: 'a', label: 'escena.json', icon: 'file', closable: true },
          { id: 'b', label: 'material.css', icon: 'file', closable: true },
          { id: 'c', label: 'notas.md', icon: 'file', closable: true },
        ];
        const cuerpo = (h) => new Container({
          variant: 'ghost', align: 'start', fullWidth: true, content: h.label,
        });
        const refrescar = () =>
          pestanas.update({ tabs: hojas.map((h) => ({ ...h, content: cuerpo(h) })) });

        const pestanas = new Tabs({
          tabs: hojas.map((h) => ({ ...h, content: cuerpo(h) })),
          detachedList: true,
          reorderable: true,
          size: 'sm',
          onReorder: (ids) => { hojas = ids.map((id) => hojas.find((h) => h.id === id)); refrescar(); },
          onClose: (id) => { hojas = hojas.filter((h) => h.id !== id); refrescar(); },
        });

        return new Window({
          leading: pestanas.listElement,
          leadingFill: true,
          controls: ['close'],
          height: '180px',
          content: pestanas,
        });
      },
    },
  ],
};
