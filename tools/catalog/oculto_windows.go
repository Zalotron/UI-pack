//go:build windows

package main

import (
	"strings"
	"syscall"
	"time"
	"unsafe"
)

var user32 = syscall.NewLazyDLL("user32.dll")
var kernel32 = syscall.NewLazyDLL("kernel32.dll")

// ocultarVentana evita que los comandos auxiliares —taskkill, netstat— abran
// una consola. Este programa se compila sin ventana: sin esto, cada llamada
// haría parpadear un recuadro negro, que es justo lo que se quiso evitar.
func ocultarVentana() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{HideWindow: true}
}

/*
⛔ SIN ESTO LA VENTANA SE ABRE DETRÁS DE LA QUE ESTABA.

Windows no deja que cualquier proceso se ponga adelante: hay un BLOQUEO DE
PRIMER PLANO, pensado para que nadie te tape lo que estás mirando. Solo puede
traer una ventana al frente quien tiene el foco — y este programa no tiene
ninguna ventana, así que no lo tiene.

Resultado: uno hace doble click desde el explorador de archivos, el catálogo
levanta, y la ventana aparece DEBAJO de la carpeta. Parecía que no había abierto
nada.

Se ataca por los dos lados, porque ninguno alcanza solo:

 1. `AllowSetForegroundWindow` CEDE el derecho antes de lanzar. Es la forma
    prevista, y funciona cuando a este proceso lo acaba de lanzar el usuario.
    Con ASFW_ANY y no con un PID porque el navegador puede estar ya corriendo:
    la ventana nueva la termina creando un proceso que no es el que lanzamos.

 2. Si igual queda atrás, se la busca y se la trae. Traerla tampoco se puede
    "porque sí": el truco documentado es ENGANCHARSE a la cola de entrada de
    quien tiene el foco —con `AttachThreadInput`— porque mientras dos hilos
    comparten esa cola, Windows los considera el mismo a los efectos del
    bloqueo. Se engancha, se trae, se desengancha.

Que falle no es motivo para no abrir: la ventana aparece igual, solo que atrás.
*/
func permitirTraerAlFrente() {
	const asfwAny = ^uintptr(0) // -1
	_, _, _ = user32.NewProc("AllowSetForegroundWindow").Call(asfwAny)
}

// traerAlFrente busca la ventana por su título y la pone adelante.
//
// Se busca por título y no por proceso porque el navegador tiene muchas
// ventanas y muchos procesos: la única que nos interesa es la que muestra
// nuestra página, y su título es el `<title>` del documento.
func traerAlFrente(titulo string, espera time.Duration) bool {
	hasta := time.Now().Add(espera)
	for time.Now().Before(hasta) {
		if h := buscarVentana(titulo); h != 0 {
			alFrente(h)
			return true
		}
		// La ventana tarda en existir: el navegador tiene que arrancar y pintar.
		time.Sleep(150 * time.Millisecond)
	}
	return false
}

func buscarVentana(titulo string) uintptr {
	var encontrada uintptr
	buscado := strings.TrimSpace(titulo)

	cb := syscall.NewCallback(func(h uintptr, _ uintptr) uintptr {
		visible, _, _ := user32.NewProc("IsWindowVisible").Call(h)
		if visible == 0 {
			return 1 // seguir
		}
		buf := make([]uint16, 512)
		n, _, _ := user32.NewProc("GetWindowTextW").Call(
			h, uintptr(unsafe.Pointer(&buf[0])), uintptr(len(buf)))
		if n == 0 {
			return 1
		}
		/* ⛔ COINCIDENCIA EXACTA, NO "QUE CONTENGA".
		   Una ventana de aplicacion de Chromium se llama EXACTAMENTE como el
		   `<title>` del documento. Buscar por subcadena parece mas tolerante y
		   es peor: cualquier otra ventana que mencione el proyecto entra en el
		   saco. Paso — el editor, con "… - Web UI - Visual Studio Code" en el
		   titulo, se vino al frente en lugar del catalogo. */
		if strings.EqualFold(strings.TrimSpace(syscall.UTF16ToString(buf[:n])), buscado) {
			encontrada = h
			return 0 // cortar
		}
		return 1
	})

	_, _, _ = user32.NewProc("EnumWindows").Call(cb, 0)
	return encontrada
}

func alFrente(h uintptr) {
	const swRestore = 9

	fg, _, _ := user32.NewProc("GetForegroundWindow").Call()
	var nada uint32
	hiloFg, _, _ := user32.NewProc("GetWindowThreadProcessId").Call(
		fg, uintptr(unsafe.Pointer(&nada)))
	hiloYo, _, _ := kernel32.NewProc("GetCurrentThreadId").Call()

	// Mientras los dos hilos comparten la cola de entrada, Windows los trata
	// como uno solo y deja de aplicar el bloqueo.
	attach := user32.NewProc("AttachThreadInput")
	if hiloFg != 0 && hiloFg != hiloYo {
		_, _, _ = attach.Call(hiloYo, hiloFg, 1)
		defer attach.Call(hiloYo, hiloFg, 0)
	}

	// Restaurar primero: una ventana minimizada no se puede traer al frente.
	_, _, _ = user32.NewProc("ShowWindow").Call(h, swRestore)
	_, _, _ = user32.NewProc("BringWindowToTop").Call(h)
	_, _, _ = user32.NewProc("SetForegroundWindow").Call(h)

	/* ⛔ Y SI IGUAL NO ALCANZA, SE FUERZA EL ORDEN Z.
	   `SetForegroundWindow` puede ser RECHAZADO sin decir nada: es la parte del
	   bloqueo que protege el foco del teclado, y engancharse a la cola de
	   entrada no siempre basta —este proceso no tiene ventanas ni cola propia—.
	   Se vio: la ventana existia, se encontraba, y seguia atras.

	   El orden Z es otra cosa y NO esta protegido. Subirla a "siempre encima" y
	   bajarla en el mismo suspiro la deja arriba de todo sin dejarla clavada
	   ahi, y sin robarle el teclado a nadie. Es lo que el usuario pide cuando
	   dice que la ventana quedo abajo. */
	const (
		hwndTopmost   = ^uintptr(0) // -1
		hwndNoTopmost = ^uintptr(1) // -2
		swpNoSize     = 0x0001
		swpNoMove     = 0x0002
		swpShowWindow = 0x0040
	)
	pos := user32.NewProc("SetWindowPos")
	banderas := uintptr(swpNoMove | swpNoSize | swpShowWindow)
	_, _, _ = pos.Call(h, hwndTopmost, 0, 0, 0, 0, banderas)
	_, _, _ = pos.Call(h, hwndNoTopmost, 0, 0, 0, 0, banderas)
}
