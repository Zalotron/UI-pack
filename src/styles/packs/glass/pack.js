/* ===========================================================================
   PACK "GLASS" — descriptor
   Define la identidad del pack y SUS settings. Cada pack trae los suyos:
   cambiar de pack cambia la estetica Y los valores de sus perillas.
   =========================================================================== */

export default {
  id: 'glass',
  label: 'Glass',

  /** CSS del pack. URL absoluta, resuelta contra este archivo. */
  stylesheet: new URL('./pack.css', import.meta.url).href,

  /**
   * Settings del pack. Son las perillas que el usuario puede mover DENTRO de
   * este estilo. Los valores de aca son la firma del pack.
   * Deben coincidir con los fallbacks declarados en su tokens.css.
   *
   * El vidrio pide curva: con ROUNDNESS 0 los cantos degradados quedan duros
   * y el efecto se pierde. Por eso este pack arranca redondeado, a diferencia
   * del default.
   */
  settings: {
    BRAND_COLOR: '#6d5efc',
    ROUNDNESS: 1.4,

    /* El tema en el que este pack NACE.
       Nace oscuro. */
    THEME: 'dark',
  },
};
