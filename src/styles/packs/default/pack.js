/* ===========================================================================
   PACK "DEFAULT" — descriptor
   Define la identidad del pack y SUS settings. Cada pack trae los suyos:
   cambiar de pack cambia la estetica Y los valores de sus perillas.
   =========================================================================== */

export default {
  id: 'default',
  label: 'Default',

  /** CSS del pack. URL absoluta, resuelta contra este archivo. */
  stylesheet: new URL('./pack.css', import.meta.url).href,

  /**
   * Settings del pack. Son las perillas que el usuario puede mover DENTRO de
   * este estilo. Los valores de aca son la firma del pack.
   * Deben coincidir con los fallbacks declarados en su tokens.css.
   */
  settings: {
    BRAND_COLOR: '#1262e2',
    ROUNDNESS: 0,

    /* El tema en el que este pack NACE.
       Nace oscuro. */
    THEME: 'dark',
  },
};
