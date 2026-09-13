/* ===========================================================================
   PACK "BLUEPRINT" — descriptor
   Define la identidad del pack y SUS settings. Cada pack trae los suyos:
   cambiar de pack cambia la estetica Y los valores de sus perillas.
   =========================================================================== */

export default {
  id: 'blueprint',
  label: 'Blueprint',

  /** CSS del pack. URL absoluta, resuelta contra este archivo. */
  stylesheet: new URL('./pack.css', import.meta.url).href,

  /**
   * Settings del pack. Son las perillas que el usuario puede mover DENTRO de
   * este estilo. Los valores de aca son la firma del pack.
   * Deben coincidir con los fallbacks declarados en su tokens.css.
   *
   * ROUNDNESS 0 y SIN PERILLA. No es un default, es la firma del pack: un plano
   * no tiene esquinas redondeadas, y uno con las esquinas redondeadas deja de
   * leerse como un plano. La escala de radios sigue existiendo y sigue
   * respondiendo —el valor se emite igual— pero no se ofrece mover. Se declara
   * fijo con `controls.ROUNDNESS = null`, mas abajo.
   *
   * El brand es azul de TINTA, deliberadamente mas profundo y menos luminoso
   * que el azul de interfaz del pack default. Aca no pinta superficies: casi
   * todo lo que se ve es este color dibujando lineas.
   */
  settings: {
    BRAND_COLOR: '#0a4ea8',
    ROUNDNESS: 0,

    /* El tema en el que este pack NACE.
       Nace oscuro. */
    THEME: 'dark',

    /* Perillas PROPIAS de este pack. Los otros no las tienen y no deberian:
       el cuadriculado es una idea de Blueprint, no del sistema.
       Salen solas como variables CSS (--ui-grid-opacity, --ui-grid-scale) y
       el catalogo les arma un control leyendo `controls`, de abajo. */
    GRID_OPACITY: 0.25,
    GRID_SCALE: 1,
  },

  /**
   * Como mostrar cada perilla. Sin esto el catalogo tendria que saber de
   * antemano que perillas existen — o sea, hardcodearlas.
   */
  controls: {
    /* Fijo: se declara el valor, no se ofrece la perilla. Ver el comentario de
       ROUNDNESS arriba. */
    ROUNDNESS: null,

    GRID_OPACITY: { kind: 'range', min: 0, max: 2.5, step: 0.05 },
    GRID_SCALE: { kind: 'range', min: 0.35, max: 3, step: 0.05 },
  },
};
