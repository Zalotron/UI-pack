/* ===========================================================================
   SET DE ICONOS
   ---------------------------------------------------------------------------
   Todos dibujados en la MISMA grilla de 24x24 y con la misma logica: solo
   TRAZO, sin relleno. Es lo que los hace skineables — cada pack decide grosor,
   remate y union del trazo, asi que el mismo icono puede salir fino y recto en
   blueprint, gordo y redondeado en clay, o duro y anguloso en cyber.

   Un icono es una lista de `d` de <path>. Nada de <rect>, <circle> ni <line>:
   con una sola primitiva, la piel no tiene que contestar cuatro veces.

   Para sumar uno propio no hace falta tocar este archivo: `Icon.add(nombre,
   paths)`, o pasarle `path` a la instancia.
   =========================================================================== */

export const ICONS = {
  // -- Reproduccion ---------------------------------------------------------
  play: ['M8 4.8 19 12 8 19.2z'],
  pause: ['M9 4.5h2.6v15H9zM14.4 4.5H17v15h-2.6z'],
  stop: ['M5.5 5.5h13v13h-13z'],
  'skip-back': ['M18 5v14 8 12zM18 5 8 12l10 7zM6 5v14'],
  'skip-forward': ['M6 5l10 7L6 19zM18 5v14'],
  refresh: ['M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5'],

  // -- Navegacion -----------------------------------------------------------
  home: ['M3 11l9-7 9 7v8.5a1 1 0 0 1-1 1h-5V15H9v5.5H4a1 1 0 0 1-1-1z'],
  menu: ['M4 7h16M4 12h16M4 17h16'],
  search: ['M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0zM20 20l-4.3-4.3'],
  'chevron-left': ['M15 5l-7 7 7 7'],
  'chevron-right': ['M9 5l7 7-7 7'],
  'chevron-up': ['M5 15l7-7 7 7'],
  'chevron-down': ['M5 9l7 7 7-7'],
  'arrow-left': ['M20 12H4M10 6l-6 6 6 6'],
  'arrow-right': ['M4 12h16M14 6l6 6-6 6'],
  'arrow-up': ['M12 20V4M6 10l6-6 6 6'],
  'arrow-down': ['M12 4v16M6 14l6 6 6-6'],
  'external-link': ['M14 4h6v6M20 4l-9 9M18 14v5H5V6h5'],

  // -- Acciones -------------------------------------------------------------
  check: ['M4 12.5l5 5L20 6.5'],
  close: ['M5 5l14 14M19 5L5 19'],
  plus: ['M12 4v16M4 12h16'],
  minus: ['M4 12h16'],
  edit: ['M4 20h4L19.5 8.5a2.12 2.12 0 0 0-3-3L5 17zM14.5 6.5l3 3'],
  trash: ['M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10.5 11v5M13.5 11v5'],
  copy: ['M8 8h12v12H8zM16 8V4H4v12h4'],
  save: ['M5 4h11l3 3v13H5zM8 4v5h7V4M8 14h8v6H8z'],
  download: ['M12 3v12M7 11l5 5 5-5M4 20h16'],
  upload: ['M12 21V9M7 13l5-5 5 5M4 4h16'],
  filter: ['M3 5h18l-7 8v6l-4 2v-8z'],
  link: ['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 1 0-5.7-5.7l-1.5 1.5M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 1 0 5.7 5.7l1.5-1.5'],

  // -- Objetos --------------------------------------------------------------
  settings: ['M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1'],
  user: ['M15.8 8a3.8 3.8 0 1 1-7.6 0 3.8 3.8 0 0 1 7.6 0zM4.5 20.5a7.5 7.5 0 0 1 15 0'],
  bell: ['M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 19a2 2 0 0 0 4 0'],
  mail: ['M3 6h18v12H3zM3 6.5l9 6.5 9-6.5'],
  calendar: ['M4 6h16v15H4zM4 10h16M8 3v4M16 3v4'],
  clock: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM12 6.5V12l4 2.5'],
  // Un libro cerrado, visto de frente: lomo a la izquierda y dos hojas.
  book: ['M5 4h9a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM16 20h3V6M9 8h4'],
  folder: ['M3 6h6l2 2.5h10V20H3z'],
  file: ['M6 3h8l5 5v13H6zM14 3v5h5'],
  image: ['M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M10 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z'],
  lock: ['M5 11h14v10H5zM8 11V7.5a4 4 0 0 1 8 0V11'],
  heart: ['M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.5 2.7c0 5.8-8.5 11.3-8.5 11.3z'],
  star: ['M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 10l6.1-.9z'],

  // -- Estado ---------------------------------------------------------------
  eye: ['M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z'],
  'eye-off': ['M4 4l16 16M10 5.7A9.6 9.6 0 0 1 12 5.5c6.2 0 10 6.5 10 6.5a18 18 0 0 1-3.3 4M6.7 7.2A17.6 17.6 0 0 0 2 12s3.8 6.5 10 6.5a9.9 9.9 0 0 0 3.6-.7M9.9 9.9a3 3 0 0 0 4.2 4.2'],
  volume: ['M4 9.5h3.5L12 5.5v13L7.5 14.5H4zM16 9.5a3.5 3.5 0 0 1 0 5M18.8 7a7 7 0 0 1 0 10'],
  mute: ['M4 9.5h3.5L12 5.5v13L7.5 14.5H4zM16 10l5 4M21 10l-5 4'],
  sun: ['M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8'],
  moon: ['M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z'],
  info: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM12 11v5M12 8h.01'],
  warning: ['M12 3.5L22 20H2zM12 10v4.5M12 17.5h.01'],
  grid: ['M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z'],
  list: ['M8 6h13M8 12h13M8 18h13M4 6h.01M4 12h.01M4 18h.01'],
  more: ['M6.4 12a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0zM13.4 12a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0zM20.4 12a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0z'],
};

/** El lado del cuadrado en el que estan dibujados TODOS. */
export const ICON_VIEWBOX = 24;
