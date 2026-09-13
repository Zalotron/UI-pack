/* ===========================================================================
   PACK "CYBER" — descriptor
   Define la identidad del pack y SUS settings. Cada pack trae los suyos:
   cambiar de pack cambia la estetica Y los valores de sus perillas.
   =========================================================================== */

export default {
  id: 'cyber',
  label: 'Cyberpunk',

  /** CSS del pack. URL absoluta, resuelta contra este archivo. */
  stylesheet: new URL('./pack.css', import.meta.url).href,

  /**
   * Settings del pack. Son las perillas que el usuario puede mover DENTRO de
   * este estilo. Los valores de aca son la firma del pack.
   * Deben coincidir con los fallbacks declarados en su tokens.css.
   *
   * ROUNDNESS 0 no es un default perezoso: es la estetica. Este pack es de
   * esquina viva, y el segundo neon sale de correr el brand 160 grados de
   * tono — con un brand cian da magenta. Cambiar BRAND_COLOR recalcula el par
   * entero.
   */
  settings: {
    BRAND_COLOR: '#00f0ff',
    ROUNDNESS: 0,

    /* El tema en el que este pack NACE.
       Nace oscuro. */
    THEME: 'dark',
  },
};
