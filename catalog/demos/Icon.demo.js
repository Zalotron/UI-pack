import { Container, Icon, Button } from '../../src/index.js';

/* Una muestra del set, no el set entero: el catálogo es compacto. Los nombres
   completos salen de `Icon.names`. */
const MUESTRA = [
  'play', 'pause', 'home', 'search', 'settings', 'user', 'bell', 'mail',
  'heart', 'star', 'calendar', 'clock', 'folder', 'file', 'image', 'lock',
  'eye', 'sun', 'moon', 'download', 'upload', 'trash', 'edit', 'copy',
  'link', 'filter', 'grid', 'list', 'info', 'warning', 'check', 'close',
  'chevron-right', 'arrow-right', 'refresh', 'more',
];

export default {
  id: 'icon',
  name: 'Icon',

  examples: [
    {
      render: () => new Container({
        layout: 'row', gap: 'md', variant: 'ghost', padding: 'none',
        items: 'center', justify: 'flex-start', fullWidth: true,
        content: MUESTRA.map((name) => new Icon({ name })),
      }),
    },
    {
      render: () => new Container({
        layout: 'row', gap: 'md', variant: 'ghost', padding: 'none',
        items: 'center', justify: 'flex-start',
        content: [
          new Icon({ name: 'star', size: 'sm' }),
          new Icon({ name: 'star' }),
          new Icon({ name: 'star', size: 'lg' }),
          new Button({ label: 'Guardar', icon: new Icon({ name: 'download' }) }),
        ],
      }),
    },
  ],
};
