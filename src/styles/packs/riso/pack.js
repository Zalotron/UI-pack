/* ===========================================================================
   PACK "RISO" — descriptor
   Define la identidad del pack y SUS settings. Cada pack trae los suyos:
   cambiar de pack cambia la estetica Y los valores de sus perillas.
   =========================================================================== */

export default {
  id: 'riso',
  label: 'Riso',

  /** CSS del pack. URL absoluta, resuelta contra este archivo. */
  stylesheet: new URL('./pack.css', import.meta.url).href,

  /**
   * Settings del pack. Son las perillas que el usuario puede mover DENTRO de
   * este estilo. Los valores de aca son la firma del pack.
   * Deben coincidir con los fallbacks declarados en su tokens.css.
   *
   * ROUNDNESS 0: formas RECORTADAS. Una hoja impresa se corta con guillotina,
   * y una plancha imprime un rectangulo. Nada de esquinas blandas.
   *
   * El brand es rosa fluor, la tinta mas reconocible del sistema Riso — y la
   * unica familia de tono que no usa ningun otro pack.
   */
  settings: {
    BRAND_COLOR: '#ff4d9d',
    ROUNDNESS: 0,

    /* El tema en el que este pack NACE.
       Una risografia es TINTA SOBRE PAPEL. En oscuro el papel deja de
       existir y lo que queda son dos tintas flotando. */
    THEME: 'light',

    /* Perillas PROPIAS, y son DE IMPRENTA, porque eso es lo que este pack es.
       En los otros packs las perillas propias son de superficie (la grilla de
       blueprint) o de movimiento (el rebote de clay); aca lo que define al
       estilo es COMO se imprime.

         MISREGISTER  cuantos pixeles corrida sale la segunda plancha. Es EL
                      defecto caracteristico del medio: dos tintas que no
                      coinciden. En 0 la impresion es perfecta y el pack
                      pierde la mitad de su gracia.
         INK_SHIFT    cuantos grados separan las dos tintas. Es elegir el
                      segundo tambor de la maquina: 239 sobre el rosa da el
                      azul federal, el par clasico. 180 da el complementario,
                      30 da dos tintas casi iguales.
         HALFTONE     la escala de la trama de puntos. Un relleno risografico
                      no es macizo: es una nube de puntos. Mas alto = puntos
                      mas grandes y separados, o sea trama mas gruesa.
                      EN 0 SE APAGA: la celda mide 0, y una imagen de fondo con
                      una dimension en cero no se pinta. Queda tinta plana. */
    MISREGISTER: 2.5,
    INK_SHIFT: 239,
    HALFTONE: 1,
  },

  controls: {
    MISREGISTER: { kind: 'range', min: 0, max: 6, step: 0.5 },
    INK_SHIFT: { kind: 'range', min: 0, max: 360, step: 1 },
    HALFTONE: { kind: 'range', min: 0, max: 3, step: 0.1 },
  },
};
