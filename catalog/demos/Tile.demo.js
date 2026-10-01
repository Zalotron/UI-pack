import { Container, Tile } from '../../src/index.js';

const COSAS = [
  { id: 'cubo', label: 'Cubo', icon: 'grid' },
  { id: 'esfera', label: 'Esfera', icon: 'sun' },
  { id: 'luz', label: 'Luz puntual', icon: 'sun' },
  { id: 'camara', label: 'Cámara', icon: 'eye' },
  { id: 'audio', label: 'Audio ambiente', icon: 'volume' },
  { id: 'textura', label: 'Textura', icon: 'image' },
  { id: 'script', label: 'Script', icon: 'file' },
  { id: 'carpeta', label: 'Materiales', icon: 'folder' },
];

export default {
  id: 'tile',
  name: 'Tile',

  examples: [
    {
      /* ⛔ EL PANEL DE CONTENIDO NO ES UNA LISTA NI UNA GRILLA. Las fichas se
         acomodan de izquierda a derecha y bajan de renglón cuando no entran:
         la ficha mide SIEMPRE lo mismo y lo que cambia es cuántas entran.

         Una grilla de verdad hace lo contrario —reparte el ancho sobrante, así
         que las fichas se agrandan al ensanchar el panel— y eso rompe lo único
         que un panel de contenido tiene que dar: que una cosa se vea igual hoy
         que ayer, para poder reconocerla. */
      render: () => {
        let elegida = null;
        const fichas = new Map();

        const panel = new Container({
          variant: 'solid', layout: 'wrap', gap: 'sm', padding: 'sm', fullWidth: true,
          content: COSAS.map((c) => {
            const ficha = new Tile({
              label: c.label,
              icon: c.icon,
              layout: 'stack',
              draggable: true,
              dragValue: c.id,
              onActivate: () => {
                // Elegir no re-renderiza: se mueve la marca y nada más.
                if (elegida) fichas.get(elegida).setSelected(false);
                elegida = elegida === c.id ? null : c.id;
                if (elegida) fichas.get(elegida).setSelected(true);
              },
            });
            fichas.set(c.id, ficha);
            return ficha;
          }),
        });
        return panel;
      },
    },
    {
      // La misma ficha en fila: ahí es el renglón de una lista, con descripción.
      title: 'En fila',
      render: () =>
        new Container({
          variant: 'solid', layout: 'stack', gap: 'none', padding: 'none',
          fullWidth: true, items: 'stretch',
          content: [
            new Tile({ label: 'escena.json', description: '2,4 kB', icon: 'file' }),
            new Tile({ label: 'material.css', description: '8,1 kB', icon: 'file', selected: true }),
            new Tile({ label: 'Bloqueado', description: 'Sin permisos', icon: 'lock', disabled: true }),
          ],
        }),
    },
  ],
};
