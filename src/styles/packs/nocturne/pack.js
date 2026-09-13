/* ===========================================================================
   PACK "NOCTURNE" — descriptor
   Define la identidad del pack y SUS settings. Cada pack trae los suyos:
   cambiar de pack cambia la estetica Y los valores de sus perillas.
   =========================================================================== */

export default {
  id: 'nocturne',
  label: 'Nocturne',

  /** CSS del pack. URL absoluta, resuelta contra este archivo. */
  stylesheet: new URL('./pack.css', import.meta.url).href,

  /**
   * Settings del pack. Son las perillas que el usuario puede mover DENTRO de
   * este estilo. Los valores de aca son la firma del pack.
   * Deben coincidir con los fallbacks declarados en su tokens.css.
   *
   * ⚠ ROUNDNESS 0.25 — Y ES UNA ESQUINA APENAS INSINUADA, NO UNA TARJETA.
   * Este pack no dibuja NI UN CONTORNO: una pieza existe solo por ser mas
   * clara que lo de abajo y por su sombra. La esquina redonda era el tercer
   * recurso, y a 0.25 practicamente no esta. Lo que queda sosteniendo la forma
   * son el escalon de luz y la sombra, asi que si en algun lado una pieza se
   * confunde con el fondo, la perilla que hay que subir es DEPTH.
   *
   * El brand es indigo. Comparte familia con el periwinkle de `glass`, asi que
   * los dos packs se parecen mas de lo que se parecian: lo que los separa ahora
   * es el material —vidrio contra tablero opaco— y no el tono.
   */
  settings: {
    BRAND_COLOR: '#5c61e6',
    ROUNDNESS: 0.25,

    /* El tema en el que este pack NACE.
       Nace oscuro. */
    THEME: 'dark',

    /* Perillas PROPIAS, y son las dos cosas de las que este pack esta hecho.
       En los otros las perillas son de superficie o de movimiento; aca son de
       PROFUNDIDAD y de TEMPERATURA, porque sin contornos ni texturas eso es
       todo lo que hay.

         DEPTH  cuanto se separan las capas entre si: el escalon de luz entre
                una superficie y la de abajo, Y el alcance de la sombra. En 0
                todo queda al mismo nivel y el pack se vuelve plano — que es
                justo lo que NO es.
         TINT   cuanto tiran los grises hacia el brand. En 0 son grises puros
                y el tablero se ve neutro; subiendolo, toda la interfaz se
                tine del color de la marca. */
    DEPTH: 1,
    TINT: 1,
  },

  controls: {
    DEPTH: { kind: 'range', min: 0, max: 2, step: 0.05 },
    TINT: { kind: 'range', min: 0, max: 2.5, step: 0.05 },
  },
};
