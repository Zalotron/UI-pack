import { Container, Window, Button, config } from '../../src/index.js';
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
  ],
};
