/* ===========================================================================
   PACK "SOFT" — descriptor (Neumorphic)
   Define la identidad del pack y SUS settings. Cada pack trae los suyos:
   cambiar de pack cambia la estetica Y los valores de sus perillas.
   =========================================================================== */

export default {
  id: 'soft',
  label: 'Neumorphic',

  /** CSS del pack. URL absoluta, resuelta contra este archivo. */
  stylesheet: new URL('./pack.css', import.meta.url).href,

  /**
   * Settings del pack. Son las perillas que el usuario puede mover DENTRO de
   * este estilo. Los valores de aca son la firma del pack.
   * Deben coincidir con los fallbacks declarados en su tokens.css.
   *
   * ROUNDNESS 1.8 es el mas alto de todos los packs, y no es capricho: el
   * relieve se arma con dos sombras desplazadas en diagonal, y en una esquina
   * viva las dos se cortan de golpe y el material deja de parecer blando.
   *
   * El brand es calido a proposito. Los neutros se tinen del brand, asi que un
   * coral vuelve gris calida a toda la lamina — que es justo lo que distingue
   * a este pack de los otros tres, todos de familia fria.
   */
  settings: {
    BRAND_COLOR: '#e8615a',
    ROUNDNESS: 1.8,

    /* El tema en el que este pack NACE.
       La lamina neumorfica NECESITA luz que le pegue encima: en oscuro
       el relieve se convierte en dos grises que casi no se distinguen. */
    THEME: 'light',
  },
};
