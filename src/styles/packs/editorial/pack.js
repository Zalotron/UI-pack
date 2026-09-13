/* ===========================================================================
   PACK "EDITORIAL" — descriptor
   Define la identidad del pack y SUS settings. Cada pack trae los suyos:
   cambiar de pack cambia la estetica Y los valores de sus perillas.
   =========================================================================== */

export default {
  id: 'editorial',
  label: 'Editorial',

  /** CSS del pack. URL absoluta, resuelta contra este archivo. */
  stylesheet: new URL('./pack.css', import.meta.url).href,

  /**
   * Settings del pack. Son las perillas que el usuario puede mover DENTRO de
   * este estilo. Los valores de aca son la firma del pack.
   * Deben coincidir con los fallbacks declarados en su tokens.css.
   *
   * El brand es un rojo oxido de imprenta. Como los neutros se tinen del
   * brand, un rojo calido vuelve el papel CREMA en vez de gris — que es
   * justo lo que separa una pagina impresa de una pantalla.
   *
   * ROUNDNESS 0: una pagina no tiene esquinas redondeadas.
   */
  settings: {
    BRAND_COLOR: '#8a2b22',
    ROUNDNESS: 0,

    /* El tema en el que este pack NACE.
       Nace oscuro. */
    THEME: 'dark',

    /* Perillas PROPIAS. En este pack la identidad la lleva el RITMO, asi que
       las dos perillas son las dos que de verdad lo cambian: cuanto respira
       el renglon y cuanto respira la pagina. Mover cualquiera de las dos
       cambia el estilo mucho mas que cambiar un color. */
    LEADING: 1.75,
    MARGINS: 1,
  },

  controls: {
    LEADING: { kind: 'range', min: 1.2, max: 2.4, step: 0.05 },
    MARGINS: { kind: 'range', min: 0.5, max: 2, step: 0.05 },
  },
};
