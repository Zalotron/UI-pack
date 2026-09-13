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
   * ROUNDNESS 1.7: todo es una TARJETA. Sin contornos que sostengan la forma,
   * la esquina redonda es lo que dice donde termina una pieza.
   *
   * El brand es amatista. Es el tono libre mas cercano al violeta del tablero
   * que inspiro el pack: el periwinkle exacto se lo lleva `glass`, y dos packs
   * con el mismo tono se confunden aunque no se parezcan en nada mas.
   */
  settings: {
    BRAND_COLOR: '#9b5ce6',
    ROUNDNESS: 1.7,

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
