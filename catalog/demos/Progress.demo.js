import { Container, Progress } from '../../src/index.js';

const row = (content) => new Container({
  layout: 'row', gap: 'lg', variant: 'ghost', padding: 'none',
  items: 'center', justify: 'flex-start', fullWidth: true,
  content,
});

export default {
  id: 'progress',
  name: 'Progress',

  examples: [
    {
      render: () => new Container({
        layout: 'stack', gap: 'md', variant: 'ghost', padding: 'none',
        fullWidth: true,
        content: [
          new Progress({ value: 0.68, label: 'Subiendo', showValue: true }),
          new Progress({ value: 0.32, size: 'sm' }),
          new Progress({ indeterminate: true, label: 'Sin saber cuánto falta' }),
        ],
      }),
    },
    {
      render: () => row([
        new Progress({ shape: 'radial', value: 0.68, size: 'sm' }),
        new Progress({ shape: 'radial', value: 0.68, showValue: true }),
        new Progress({ shape: 'radial', value: 0.25, size: 'lg', showValue: true }),
        new Progress({ shape: 'radial', indeterminate: true }),
      ]),
    },
  ],
};
