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
    {
      /* Reordenar y cerrar son CAPACIDADES, no otro componente: las mismas
         pestañas con dos opciones más. El componente no mueve ni saca nada por
         su cuenta — avisa lo que se pidió, y acá el demo lo aplica. */
      title: 'Reordenables',
      render: () => {
        let tabs = [
          { id: 'a', label: 'main.js', icon: 'file', closable: true },
          { id: 'b', label: 'estilos.css', icon: 'file', closable: true },
          { id: 'c', label: 'notas.md', icon: 'file', closable: true },
        ];

        const vista = new Tabs({
          tabs: tabs.map((t) => ({ ...t, content: panel(t.label) })),
          reorderable: true,
          onReorder: (ids) => {
            tabs = ids.map((id) => tabs.find((t) => t.id === id));
            vista.update({ tabs: tabs.map((t) => ({ ...t, content: panel(t.label) })) });
          },
          onClose: (id) => {
            tabs = tabs.filter((t) => t.id !== id);
            vista.update({ tabs: tabs.map((t) => ({ ...t, content: panel(t.label) })) });
          },
        });
        return vista;
      },
    },
  ],
};
