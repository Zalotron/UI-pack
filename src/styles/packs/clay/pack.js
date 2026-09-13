/* ===========================================================================
   PACK "CLAY" — descriptor
   Define la identidad del pack y SUS settings. Cada pack trae los suyos:
   cambiar de pack cambia la estetica Y los valores de sus perillas.
   =========================================================================== */

export default {
  id: 'clay',
  label: 'Clay',

  /** CSS del pack. URL absoluta, resuelta contra este archivo. */
  stylesheet: new URL('./pack.css', import.meta.url).href,

  /**
   * Settings del pack. Son las perillas que el usuario puede mover DENTRO de
   * este estilo. Los valores de aca son la firma del pack.
   * Deben coincidir con los fallbacks declarados en su tokens.css.
   *
   * ROUNDNESS 2.2 es el mas alto del sistema: la plastilina no tiene aristas.
   *
   * El brand es verde menta — la unica familia de tono que no usa ningun otro
   * pack, y el registro justo para este estilo.
   */
  settings: {
    BRAND_COLOR: '#12bfa0',
    ROUNDNESS: 2.2,

    /* El tema en el que este pack NACE.
       La plastilina se lee por como le da la luz, y la luz cae sobre un
       material claro. En oscuro se ve gris y perdida. */
    THEME: 'light',

    /* Perillas PROPIAS, y son de MOVIMIENTO porque eso es lo que este pack es.
       En los otros packs las perillas propias son de superficie (la grilla de
       blueprint, el ritmo de editorial); aca lo que define al estilo es como
       se mueve, asi que eso es lo que se expone.

         BOUNCE  cuanto se pasa de largo lo que entra, y cuanto se aplasta lo
                 que se aprieta. En 0 el pack deja de ser este pack.
         SPEED   1 es el ritmo de fabrica; 2, el doble de rapido. Divide todas
                 las duraciones. */
    BOUNCE: 1,
    SPEED: 1,
  },

  controls: {
    BOUNCE: { kind: 'range', min: 0, max: 2, step: 0.05 },
    SPEED: { kind: 'range', min: 0.4, max: 2.5, step: 0.05 },
  },
};
