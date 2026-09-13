/* ===========================================================================
   Keepalive — mantiene abierta la conexión que le dice al servidor que todavía
   hay alguien mirando.

   Vive en el CATÁLOGO y no en `src/`, igual que la carga de tipografías del
   visor: la librería no sabe —ni tiene por qué saber— cómo se arranca el
   servidor con el que uno la mira.

   ⛔ ES UNA CONEXIÓN SOSTENIDA, NO UN AVISO CADA TANTO.

   Esto empezó siendo un `fetch` periódico y adivinar nunca terminó de andar:

     · una pestaña TAPADA tiene los timers estrangulados —el navegador los baja
       a uno por minuto— así que había que darle un margen largo, y con ese
       margen un servidor sin nadie mirando sobrevivía un minuto y medio;
     · y peor: al matar el navegador de golpe, un proceso hijo sobrevivía unos
       segundos y SEGUÍA avisando, así que el margen se renovaba solo. El
       servidor quedaba colgado sin ninguna ventana abierta.

   Una conexión abierta no adivina nada. El navegador la sostiene mientras la
   página exista —minimizada, tapada, da igual— y la CORTA en el momento en que
   se cierra la ventana o el proceso muere. El servidor se entera del corte por
   el sistema operativo: no hay latido que perder ni margen que estimar.

   Contra un servidor que no tenga el endpoint —`npm run dev` pelado— esto se
   apaga solo y no vuelve a molestar.
   =========================================================================== */

/** De qué arranque del servidor venimos. */
let arranque = null;

let fuente = null;

/**
 * ⛔ SI EL SERVIDOR NO ES EL MISMO, LA PÁGINA SE RECARGA SOLA.
 *
 * Al abrir el catálogo, el navegador ENFOCA la ventana que ya tenga con esa URL
 * en vez de cargarla de nuevo. Así que uno baja el servidor viejo, levanta uno
 * nuevo, y sigue mirando el DOM de antes: la página parece vieja y el servidor
 * está perfecto. Es un bug que solo se puede arreglar desde este lado.
 */
function mirarArranque(numero) {
  if (!numero) return;
  if (arranque === null) { arranque = numero; return; }
  if (numero !== arranque) location.reload();
}

export function keepalive() {
  if (typeof EventSource !== 'function') return;

  try {
    fuente = new EventSource('/__alive');
  } catch {
    return; // sin servidor propio: no hay nada que sostener
  }

  fuente.addEventListener('boot', (evento) => mirarArranque(evento.data));

  /* Un servidor sin el endpoint contesta 404 y el navegador NO reintenta: la
     conexión queda cerrada y esto se acaba solo. Si en cambio se cayó la
     conexión de un servidor que sí existe, el navegador reconecta por su
     cuenta — que es justo lo que hace falta al recargar. */
  fuente.addEventListener('error', () => {
    if (fuente?.readyState === EventSource.CLOSED) fuente = null;
  });
}
