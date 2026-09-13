/* ===========================================================================
   PACK "MINIMAL" — descriptor
   Define la identidad del pack y SUS settings. Cada pack trae los suyos:
   cambiar de pack cambia la estetica Y los valores de sus perillas.
   =========================================================================== */

export default {
  id: 'minimal',
  label: 'Minimal',

  /** CSS del pack. URL absoluta, resuelta contra este archivo. */
  stylesheet: new URL('./pack.css', import.meta.url).href,

  /**
   * Settings del pack. Son las perillas que el usuario puede mover DENTRO de
   * este estilo. Los valores de aca son la firma del pack.
   * Deben coincidir con los fallbacks declarados en su tokens.css.
   *
   * ROUNDNESS 0.5: la esquina de un editor de codigo. No es recta —eso seria
   * severo— pero tampoco se nota: dos pixeles, lo justo para que un boton no
   * corte. Con la escala del pack da radios de 2, 3 y 4px.
   *
   * El brand es el azul de la barra de estado de VS Code. Es el unico color
   * saturado que este pack usa, y lo usa poco: en una herramienta el color no
   * decora, SEÑALA.
   */
  settings: {
    BRAND_COLOR: '#007acc',
    ROUNDNESS: 0.5,

    /* El tema en el que este pack NACE.
       Nace OSCURO, y es la mitad del asunto: este pack imita la interfaz de un
       editor de codigo, y un editor de codigo se mira ocho horas seguidas. El
       claro existe y esta medido, pero el que define al pack es este. */
    THEME: 'dark',

    /* Perillas PROPIAS, y son de INFORMACION y de ERGONOMIA — no de material,
       que es lo que miden las de los otros packs. Este pack no tiene material:
       tiene jerarquia y densidad, y eso es exactamente lo que se regula.

         CONTRAST  cuanto separa una superficie de la de abajo. Aca no hay ni
                   sombras ni contornos marcados: lo unico que dice donde
                   termina un panel y empieza otro es un ESCALON DE LUZ de dos
                   o tres puntos. En 0 desaparece y todo queda en un solo
                   plano —que es legitimo y muy sobrio, pero hay que quererlo—;
                   subiendolo, la interfaz se vuelve mas legible y menos sutil.
         DENSITY   cuanto ocupa cada cosa. Multiplica el alto de los controles
                   y el aire entre ellos. En 1 es la densidad de un editor:
                   apretada, porque lo que importa es lo que se edita y no la
                   interfaz. Subiendola se vuelve una aplicacion comun. */
    CONTRAST: 1,
    DENSITY: 1,
  },

  /**
   * Como mostrar cada perilla. Sin esto el catalogo tendria que saber de
   * antemano que perillas existen; leyendo esto les arma un control solo.
   *
   * ⚠ NINGUNO DE LOS DOS RANGOS ES 0..1, que es el default del catalogo.
   * CONTRAST llega a 3 porque en una pantalla mala el escalon de fabrica se
   * pierde, y DENSITY arranca en 0.8 —mas apretado ya no se puede tocar con
   * el dedo— y llega a 1.6, que es una interfaz de escritorio comun.
   */
  controls: {
    CONTRAST: { kind: 'range', min: 0, max: 3, step: 0.05 },
    DENSITY:  { kind: 'range', min: 0.8, max: 1.6, step: 0.05 },
  },
};
