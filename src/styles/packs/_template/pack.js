/* ===========================================================================
   PACK "_template" — descriptor. Copiar junto con la carpeta.
   =========================================================================== */

export default {
  id: '_template',
  label: 'Template',
  stylesheet: new URL('./pack.css', import.meta.url).href,

  /** Firma del pack. Deben coincidir con los fallbacks de su tokens.css. */
  settings: {
    BRAND_COLOR: '#1262e2',
    ROUNDNESS: 0,

    /* El tema en el que este pack NACE.
       Nace oscuro. */
    THEME: 'dark',
  },
};
