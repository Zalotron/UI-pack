import { Container, Tabs } from '../../src/index.js';

const panel = (text) =>
  new Container({
    variant: 'panel', align: 'start', fullWidth: true, content: text,
  });

export default {
  id: 'tabs',
  name: 'Tabs',

  examples: [
    {
      render: () =>
        new Tabs({
          tabs: [
            { id: 'a', label: 'General', content: panel('Panel General') },
            { id: 'b', label: 'Apariencia', content: panel('Panel Apariencia') },
            { id: 'c', label: 'Avanzado', content: panel('Panel Avanzado') },
            { id: 'd', label: 'Bloqueado', content: panel('—'), disabled: true },
          ],
        }),
    },
  ],
};
