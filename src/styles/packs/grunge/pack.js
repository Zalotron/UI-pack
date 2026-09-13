/* ===========================================================================
   PACK "GRUNGE" — descriptor
   Define la identidad del pack y SUS settings. Cada pack trae los suyos:
   cambiar de pack cambia la estetica Y los valores de sus perillas.
   =========================================================================== */

export default {
  id: 'grunge',
  label: 'Grunge',

  /** CSS del pack. URL absoluta, resuelta contra este archivo. */
  stylesheet: new URL('./pack.css', import.meta.url).href,

  /**
   * Settings del pack. Son las perillas que el usuario puede mover DENTRO de
   * este estilo. Los valores de aca son la firma del pack.
   * Deben coincidir con los fallbacks declarados en su tokens.css.
   *
   * ROUNDNESS 0: nada esta cortado a maquina. El canto no es recto porque
   * tenga radio cero — es que esta COMIDO, y una curva prolija al lado de un
   * canto roto solo se lee como un error de dibujo.
   *
   * El brand es LACA ROJA. Es la mitad "cheta" del asunto: el grunge de
   * verdad no tiene color, tiene mugre, asi que lo unico que en este pack se
   * permite brillar es una capa de laca sobre material arruinado. Un rojo
   * lacado sobre hormigon es la misma idea que una suela roja debajo de un
   * zapato de cuero gastado — lo caro no es el material, es el acabado.
   */
  settings: {
    BRAND_COLOR: '#c92e2e',
    ROUNDNESS: 0,

    /* El tema en el que este pack NACE.
       Nace OSCURO. Es hollin sobre hormigon y una capa de laca encima: en
       claro el hollin no tiene donde depositarse y la laca pierde el unico
       fondo contra el que brilla. El claro existe y esta calibrado, pero es
       el derivado — es el mismo material a la luz del dia. */
    THEME: 'dark',

    /* Perillas PROPIAS, y son las tres cosas de las que este pack esta hecho.
       En los otros las perillas son de superficie, de movimiento o de
       profundidad; aca son de MATERIAL — que le paso a la pieza, de que esta
       hecha y como esta terminada.

         WEAR   cuanto se comio el canto. Es la perilla que define al pack: la
                banda del borde que el ruido se come, en pixeles. En 0 todo
                sale cortado a guillotina y el grunge se vuelve un pack oscuro
                mas. Tambien es lo que anima la entrada y lo que se hunde al
                apretar, asi que subirla exagera los tres gestos juntos.
         GRAIN  cuanta costra tiene la superficie. Es el arido del hormigon:
                una nube de puntos finos sobre CADA pieza. En 0 las superficies
                quedan limpias y planas.
         FOIL   cuanto brilla la laca. Es la mitad "cheta": el acento nunca es
                un color liso, es una superficie lacada con vetas y una franja
                de reflejo cruzada. En 0 el brillo se apaga y queda pintura
                plana. */
    WEAR: 1,
    GRAIN: 1,
    FOIL: 1,
  },

  /**
   * Como mostrar cada perilla. Sin esto el catalogo tendria que saber de
   * antemano que perillas existen; leyendo esto les arma un control solo.
   *
   * ⚠ EL RANGO NO ES 0..1. El default del catalogo lo es, y para las tres de
   * aca esta mal: WEAR y GRAIN son interesantes pasados de rosca (un canto
   * destruido, una pieza que es toda costra) y FOIL necesita llegar a 2 para
   * que la laca se vuelva espejo.
   */
  controls: {
    WEAR:  { kind: 'range', min: 0, max: 3, step: 0.05 },
    GRAIN: { kind: 'range', min: 0, max: 2, step: 0.05 },
    FOIL:  { kind: 'range', min: 0, max: 2, step: 0.05 },
  },
};
