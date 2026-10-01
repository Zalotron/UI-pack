/* ===========================================================================
   Punto de entrada de la libreria (barrel).
   Todo lo que se pueda usar desde afuera se exporta desde aca.

     import { Button, UIComponent } from "<ruta>/src/index.js";

   Al crear un componente nuevo, agregale su linea en el bloque COMPONENTES.
   =========================================================================== */

// ----------------------------------------------------------------- CONFIG --
// Importarlo aplica las variables CSS globales en <html>. Va primero para que
// los componentes ya encuentren los tokens resueltos.
export {
  config,
  configure,
  configurePack,
  resetConfig,
  applyConfig,
  onConfigChange,
  packSettings,
  packDefaults,
  snapshot as configSnapshot,
  toCssVars,
  readableOn,
  SETTING_KEYS,
} from './config.js';
export { configureKeys, currentKeys, resetKeys, isKey, KEY_ACTIONS } from './keys.js';

// Registro de packs esteticos.
export {
  packs,
  packList,
  isPack,
  ensurePackStylesheet,
  DEFAULT_PACK,
} from './styles/packs/index.js';

// ------------------------------------------------------------------- CORE --
export { UIComponent } from './core/UIComponent.js';
export { EventEmitter } from './core/EventEmitter.js';
export { el, cx, append, clear, setStyle, resolveNode, qs, qsa, uniqueId } from './core/dom.js';
export { decimalsOf, round, format, clamp, clampPrecision } from './core/num.js';
export { hexToRgb, rgbToHex, rgbToHsv, hsvToRgb, hexToHsv, hsvToHex, normalizeHex } from './core/color.js';

// ------------------------------------------------------------ COMPONENTES --
export { Container } from './components/Container/index.js';
export { Separator } from './components/Separator/index.js';
export { Spinner } from './components/Spinner/index.js';
export { Progress } from './components/Progress/index.js';
export { Icon, ICONS } from './components/Icon/index.js';
export { Slider } from './components/Slider/index.js';
export { Select } from './components/Select/index.js';
export { ColorPicker } from './components/ColorPicker/index.js';
export { Toggle } from './components/Toggle/index.js';
export { Checkbox } from './components/Checkbox/index.js';
export { RadioGroup } from './components/RadioGroup/index.js';
export { TextField } from './components/TextField/index.js';
export { Window } from './components/Window/index.js';
export { Segmented } from './components/Segmented/index.js';
export { Tile } from './components/Tile/index.js';
export { Tabs } from './components/Tabs/index.js';
export { Scroll } from './components/Scroll/index.js';
export { Button } from './components/Button/index.js';
