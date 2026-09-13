import {
  Container, Button, Spinner, Slider, Select, ColorPicker,
  Toggle, Checkbox, RadioGroup, TextField,
} from '../../src/index.js';

export default {
  id: 'controls',
  name: 'Controls',

  examples: [
    {
      render: () =>
        new Container({
          layout: 'grid', columnMin: '210px', gap: 'md',
          variant: 'ghost', padding: 'none', fullWidth: true,
          items: 'center',
          content: [
            new Container({
              layout: 'row', gap: 'sm', variant: 'ghost', padding: 'none',
              items: 'center', justify: 'flex-start',
              content: [
                new Button({ label: 'Primary' }),
                new Button({ label: 'Secondary', variant: 'secondary' }),
              ],
            }),
            new TextField({ placeholder: 'Texto' }),
            new Select({ options: ['Opción A', 'Opción B', 'Opción C'], value: 'Opción A' }),
            new Spinner({ value: 25 }),
            new Slider({ min: 0, max: 100, step: 1, value: 40, editableValue: true }),
            new ColorPicker(),
            new Toggle({ label: 'Toggle', checked: true }),
            new Checkbox({ label: 'Checkbox', checked: true }),
            new RadioGroup({
              options: ['Uno', 'Dos'],
              value: 'Uno',
              orientation: 'horizontal',
            }),
          ],
        }),
    },
  ],
};
