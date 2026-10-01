import { Segmented } from '../../src/index.js';

export default {
  id: 'segmented',
  name: 'Segmented',

  examples: [
    {
      render: () =>
        new Segmented({
          options: [
            { value: 'list', label: 'Lista' },
            { value: 'grid', label: 'Grilla' },
            { value: 'cards', label: 'Fichas' },
          ],
          value: 'grid',
          ariaLabel: 'Modo de vista',
        }),
    },
    {
      // Pegado: dos valores de UNA decisión se leen como un interruptor.
      render: () =>
        new Segmented({
          options: [
            { value: 'world', label: 'Mundo' },
            { value: 'local', label: 'Local' },
          ],
          compact: true,
          size: 'sm',
          ariaLabel: 'Espacio de referencia',
        }),
    },
  ],
};
