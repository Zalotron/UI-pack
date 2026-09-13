import { Container } from '../../src/index.js';

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
  ],
};
