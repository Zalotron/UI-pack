// CATALOG — abre el catálogo de Web UI.
//
// Un solo ejecutable, sin nada instalado al lado: sirve los archivos, abre el
// navegador y se apaga solo cuando se cierra la pestaña.
//
// ⛔ EL SERVIDOR ESTÁ ACÁ ADENTRO, NO LLAMA A NODE.
// La alternativa era un lanzador que arrancara `node serve.mjs`, pero eso no
// es portable: deja de andar en cualquier máquina que no tenga Node en el
// PATH, que es justamente la que uno quiere que abra esto sin preparar nada.
// `serve.mjs` sigue existiendo para `npm run dev`, que es otra cosa: ahí uno
// está programando y quiere un servidor que NO se muera solo.
//
// Se compila sin consola:
//
//	go build -ldflags "-H=windowsgui -s -w" -o CATALOG.exe ./tools/catalog
package main

import (
	"errors"
	"fmt"
	"log"
	"mime"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"
)

// Puerto por defecto. Se puede pasar otro como primer argumento.
const puertoPorDefecto = "5173"

/*
El titulo de la pagina, que es como se llama la ventana de la aplicacion.

	Es lo unico que permite distinguirla entre todas las del navegador.
*/
const tituloVentana = "Web UI"

// ---------------------------------------------------------------------------
// CUANTO SE ESPERA CUANDO NO HAY NADIE.
//
// Ya no hay nada que estimar: la conexion abierta dice si hay alguien mirando.
// Estos dos margenes cubren los unicos huecos que quedan.
const (
	// Desde que levanta hasta que se conecta la primera pagina. Tiene que cubrir
	// lo que tarda el navegador en abrirse DE CERO.
	esperaArranque = 30 * time.Second

	// Desde que se va la ultima pagina. Corto: lo unico que tiene que cubrir es
	// una RECARGA, que corta la conexion y abre otra enseguida.
	esperaDespedida = 4 * time.Second
)

/*
⛔ SE MIRA SI EL NAVEGADOR SIGUE CONECTADO, NO SE LE PREGUNTA CADA TANTO.

	Antes esto eran avisos periódicos, y adivinar nunca terminó de funcionar:

	  · una pestaña TAPADA tiene los timers estrangulados —el navegador los baja
	    a uno por minuto— así que había que darle un margen largo, y con ese
	    margen un servidor sin nadie mirando sobrevivía un minuto y medio;
	  · y peor: al matar el navegador de golpe, un proceso hijo sobrevivía unos
	    segundos y SEGUÍA avisando, así que el margen se renovaba solo. Quedaba
	    colgado sin ninguna ventana abierta. Se vio.

	Una conexión abierta no adivina nada. El navegador la sostiene mientras la
	página exista —minimizada, tapada, da igual— y la CORTA en el momento en que
	la pestaña se cierra o el proceso muere. El sistema operativo avisa del
	corte: no hay latido que perder ni margen que estimar.

	Lo único que queda de margen es para la RECARGA: al recargar, la conexión se
	corta y la página nueva abre otra enseguida.
*/
type vigia struct {
	mu    sync.Mutex
	vivos int
	timer *time.Timer
}

// entra: hay una página más mirando.
func (v *vigia) entra() {
	v.mu.Lock()
	defer v.mu.Unlock()
	v.vivos++
	if v.timer != nil {
		v.timer.Stop()
		v.timer = nil
	}
}

// sale: una página menos. Si no queda ninguna, arranca la cuenta.
func (v *vigia) sale() {
	v.mu.Lock()
	defer v.mu.Unlock()
	v.vivos--
	if v.vivos <= 0 {
		v.vivos = 0
		v.contar(esperaDespedida)
	}
}

// contar arma la cuenta regresiva. Con el candado ya tomado.
func (v *vigia) contar(d time.Duration) {
	if v.timer != nil {
		v.timer.Stop()
	}
	v.timer = time.AfterFunc(d, func() {
		v.mu.Lock()
		solo := v.vivos == 0
		v.mu.Unlock()
		if !solo {
			return // volvió alguien: era una recarga
		}
		log.Println("nadie mirando: apagando.")
		os.Exit(0)
	})
}

// esperar arma la cuenta desde afuera (el arranque, antes de que llegue nadie).
func (v *vigia) esperar(d time.Duration) {
	v.mu.Lock()
	defer v.mu.Unlock()
	v.contar(d)
}

// raiz busca la carpeta del proyecto: la que tiene el index.html.
//
// Se arranca por la carpeta del EJECUTABLE y no por el directorio actual: a un
// .exe se lo abre con doble click, y ahí el directorio actual puede ser
// cualquier cosa. Se sube hasta encontrarlo para que también funcione si
// alguien lo deja en una subcarpeta.
func raiz() (string, error) {
	var candidatos []string
	if exe, err := os.Executable(); err == nil {
		candidatos = append(candidatos, filepath.Dir(exe))
	}
	if cwd, err := os.Getwd(); err == nil {
		candidatos = append(candidatos, cwd)
	}

	for _, inicio := range candidatos {
		dir := inicio
		for i := 0; i < 6; i++ {
			if _, err := os.Stat(filepath.Join(dir, "index.html")); err == nil {
				return dir, nil
			}
			padre := filepath.Dir(dir)
			if padre == dir {
				break
			}
			dir = padre
		}
	}
	return "", errors.New("no encuentro index.html: dejá el ejecutable en la carpeta del proyecto")
}

/*
⛔ SE ABRE COMO VENTANA, NO COMO PESTANA.

	Un catalogo no es una pagina que uno visita: es una herramienta. En una
	pestana queda perdido entre las otras veinte, con barra de direcciones y
	marcadores alrededor — y encima el navegador ENFOCA la pestana vieja en vez
	de cargar de nuevo, que es el bug de "sigo viendo lo viejo".

	Un navegador basado en Chromium abierto con `--app=` da una ventana limpia:
	sin pestanas, sin barra, con su propio icono en la barra de tareas. No hace
	falta empaquetar nada ni sumar una dependencia — en Windows, Edge esta
	siempre. Si no hay ninguno, se cae al navegador de siempre y listo.
*/
func abrirVentana(url string) bool {
	// Se cede el derecho ANTES de lanzar: despues ya es tarde, la ventana nueva
	// aparece atras y traerla al frente vuelve a estar prohibido.
	permitirTraerAlFrente()

	for _, exe := range navegadoresApp() {
		if exe == "" {
			continue
		}
		ruta := exe
		if !filepath.IsAbs(ruta) {
			encontrado, err := exec.LookPath(ruta)
			if err != nil {
				continue
			}
			ruta = encontrado
		} else if _, err := os.Stat(ruta); err != nil {
			continue
		}

		/* ⚠ SIN `ocultarVentana()` aca: eso es para los comandos auxiliares
		   —netstat, taskkill— que no tienen que parpadear. Aca la ventana es
		   justamente lo que se quiere ver. */
		/* Maximizada: el catalogo es una grilla de componentes y una columna de
		   ajustes al lado — cuanto mas ancho, mas se ve de una sola vez. */
		cmd := exec.Command(ruta, "--app="+url, "--start-maximized")
		if err := cmd.Start(); err == nil {
			log.Printf("abierto como ventana con %s -> %s", filepath.Base(ruta), url)

			/* Y se la trae adelante. En otro hilo: buscar la ventana implica
			   esperar a que el navegador arranque y pinte, y este de aca tiene
			   que seguir para levantar el servidor — que es justamente lo que
			   la ventana necesita para tener algo que mostrar. */
			go traerAlFrente(tituloVentana, 8*time.Second)
			return true
		}
	}
	return false
}

// navegadoresApp: los que entienden `--app=`, en orden de preferencia.
func navegadoresApp() []string {
	switch runtime.GOOS {
	case "windows":
		return []string{
			filepath.Join(os.Getenv("ProgramFiles(x86)"), `Microsoft\Edge\Application\msedge.exe`),
			filepath.Join(os.Getenv("ProgramFiles"), `Microsoft\Edge\Application\msedge.exe`),
			filepath.Join(os.Getenv("ProgramFiles"), `Google\Chrome\Application\chrome.exe`),
			filepath.Join(os.Getenv("ProgramFiles(x86)"), `Google\Chrome\Application\chrome.exe`),
			filepath.Join(os.Getenv("LOCALAPPDATA"), `Google\Chrome\Application\chrome.exe`),
		}
	case "darwin":
		return []string{
			"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
			"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
		}
	default:
		return []string{"google-chrome", "chromium", "chromium-browser", "microsoft-edge"}
	}
}

// abrirNavegador abre la URL en el navegador por defecto.
//
// En Windows va por rundll32 y NO por `cmd /c start`: este programa se compila
// sin consola, y lanzar cmd le haría aparecer una ventana negra por un
// instante — justo lo que se quiso evitar.
func abrirNavegador(url string) {
	permitirTraerAlFrente()

	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	if err := cmd.Start(); err != nil {
		log.Printf("no pude abrir el navegador: %v", err)
	}
}

func main() {
	dir, err := raiz()
	if err != nil {
		morir(err)
	}
	// Sin consola, los mensajes van a un archivo al lado del proyecto.
	if f, err := os.OpenFile(filepath.Join(dir, "catalog.log"),
		os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644); err == nil {
		log.SetOutput(f)
		defer f.Close()
	}

	puerto := puertoPorDefecto
	abrir := true
	ventana := true
	for _, arg := range os.Args[1:] {
		switch {
		case arg == "--tab":
			// Para quien prefiera la pestana de siempre.
			ventana = false
		case arg == "--no-open":
			// Para cuando la pestaña ya está abierta: levantar el servidor sin
			// abrir una segunda. También es lo que permite probar el apagado
			// automático, que con una pestaña viva no se puede observar —
			// justamente porque la pestaña lo mantiene vivo.
			abrir = false
		case arg != "":
			puerto = arg
		}
	}
	/* El numero de ESTE arranque. Se usa para dos cosas y las dos importan:
	   viaja en la conexion —para que una ventana vieja se entere de que el
	   servidor cambio y se recargue— y va pegado a la URL que se abre. */
	arranque := strconv.FormatInt(time.Now().UnixNano(), 36)

	url := "http://localhost:" + puerto

	/* ⛔ CADA APERTURA ESTRENA URL.
	   El servidor ya manda `no-store` y le saca las preguntas de revalidacion,
	   asi que de aca en adelante nada se guarda. Pero lo que el navegador
	   guardo ANTES sigue en su caja, y para el documento principal eso alcanza
	   para que una apertura te muestre la version de ayer — paso.
	   Una URL que nunca se vio no puede estar cacheada. Y como el documento
	   baja fresco, lo que el pide detras tambien.
	   No se ve en ningun lado: la ventana de `--app` no tiene barra. */
	urlAbrir := url + "/?v=" + arranque

	/* ⛔ ANTES DE EMPEZAR SE BAJA CUALQUIER SERVIDOR ANTERIOR. SIEMPRE.

	   Antes esto solo pasaba si el puerto estaba tomado, y no alcanzaba: quedaba
	   un CATALOG.exe viejo en OTRO puerto sirviendo una copia vieja del catalogo,
	   o un `npm run dev` olvidado —que no sabe apagarse— quedandose con el
	   puerto. Uno cerraba la ventana, volvia horas despues y seguia ahi.

	   Se baja a dos: cualquier otro ejemplar de este mismo programa, y lo que
	   sea que este escuchando ESTE puerto. Ninguna de las dos es una redada: la
	   primera va por nombre de ejecutable y la segunda por puerto.

	   ⚠ Y NO SE INTENTA EL BIND PARA VER SI FALLA. En Windows un `listen` en
	   127.0.0.1 tiene exito AUNQUE otro proceso ya escuche el mismo puerto en la
	   direccion comodin. Quedaban dos servidores vivos contestando al azar — se
	   vio, los endpoints daban 404 porque respondia el otro. Preguntar con una
	   conexion es lo unico que no miente. */
	matarOtrosCatalogos()
	if yaHayServidor(puerto) {
		log.Printf("el puerto %s esta ocupado: bajo lo que haya.", puerto)
		matarPrevios(puerto)

		if yaHayServidor(puerto) {
			// No se pudo. Peor es no mostrar nada: se abre contra lo que quedo.
			log.Printf("no pude liberar el puerto: abro contra lo que hay.")
			if abrir {
				if !ventana || !abrirVentana(urlAbrir) {
					abrirNavegador(urlAbrir)
				}
			}
			return
		}
	}

	// Go no conoce .mjs de fábrica, y servirlo con el tipo equivocado hace que
	// el navegador se niegue a ejecutarlo como módulo.
	_ = mime.AddExtensionType(".mjs", "text/javascript; charset=utf-8")
	_ = mime.AddExtensionType(".js", "text/javascript; charset=utf-8")

	v := &vigia{}
	v.esperar(esperaArranque)

	archivos := http.FileServer(http.Dir(dir))
	mux := http.NewServeMux()

	/* La conexión que dice "acá sigue habiendo alguien". Ver catalog/keepalive.js.
	   Queda abierta mientras la página exista; el navegador la corta sola. */
	mux.HandleFunc("/__alive", func(w http.ResponseWriter, r *http.Request) {
		fl, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "sin streaming", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Connection", "keep-alive")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "event: boot"+"\n"+"data: %s"+"\n"+"\n", arranque)
		fl.Flush()

		v.entra()
		defer v.sale()

		/* Un latido cada tanto. No es para saber si la página sigue —eso lo dice
		   la conexión— sino para ENTERARSE de un corte que el sistema no avisó,
		   que pasa cuando el proceso del otro lado muere de mala manera. */
		latido := time.NewTicker(15 * time.Second)
		defer latido.Stop()
		for {
			select {
			case <-r.Context().Done():
				return
			case <-latido.C:
				if _, err := fmt.Fprint(w, ": late"+"\n"+"\n"); err != nil {
					return
				}
				fl.Flush()
			}
		}
	})

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		/* ⛔ `no-store` Y NO `no-cache`. No son sinónimos: `no-cache` deja
		   guardar y obliga a revalidar, y el servidor de archivos contesta 304
		   con gusto — el navegador se queda con su copia. Para MIRAR lo que uno
		   acaba de cambiar eso es exactamente lo que no se quiere.
		   `no-store` prohíbe guardar, así que cada carga baja de nuevo. */
		w.Header().Set("Cache-Control", "no-store")

		/* ⛔ Y SE LE SACAN LAS PREGUNTAS DE REVALIDACION.
		   `no-store` le prohibe guardar de aca en adelante, pero lo que ya tenia
		   guardado de antes sigue ahi: al recargar pregunta "¿cambio desde tal
		   fecha?" y el servidor de archivos contesta 304 con gusto — el navegador
		   se queda con su copia vieja y uno jura que el servidor esta mal.
		   Sin la pregunta no hay 304 posible: siempre va el archivo entero. */
		r.Header.Del("If-Modified-Since")
		r.Header.Del("If-None-Match")
		archivos.ServeHTTP(w, r)
	})

	/* ⛔ LAS DOS FAMILIAS DE LOOPBACK, NO UNA.
	   `localhost` puede resolver a ::1 antes que a 127.0.0.1. Escuchando una
	   sola, el navegador podía tocar la puerta del otro lado y encontrarse con
	   que no había nadie — o peor, con otro servidor.

	   Solo loopback: el catálogo es para esta máquina. Abrirlo a la red
	   expondría la carpeta del proyecto entera sin que nadie lo haya pedido. */
	oyentes := escuchar(puerto)
	if len(oyentes) == 0 {
		morir(fmt.Errorf("no pude abrir el puerto %s", puerto))
	}

	log.Printf("Web UI — catálogo en %s", url)
	if abrir {
		if !ventana || !abrirVentana(urlAbrir) {
			abrirNavegador(urlAbrir)
		}
	}

	errores := make(chan error, len(oyentes))
	for _, lis := range oyentes {
		go func(l net.Listener) { errores <- http.Serve(l, mux) }(lis)
	}
	morir(<-errores)
}

/*
matarOtrosCatalogos baja cualquier otro ejemplar de este mismo programa.

	Por NOMBRE DE EJECUTABLE, no por puerto: el que sobro puede estar sirviendo
	en otro puerto, y sigue siendo un servidor colgado igual.
	Que no haya ninguno no es un error — el comando devuelve fallo y se ignora.
*/
func matarOtrosCatalogos() {
	exe, err := os.Executable()
	if err != nil {
		return
	}
	nombre := filepath.Base(exe)
	yo := os.Getpid()

	if runtime.GOOS == "windows" {
		// El filtro deja afuera al proceso actual: matarse a uno mismo antes de
		// levantar el servidor seria una forma rara de no arrancar nunca.
		cmd := exec.Command("taskkill", "/F", "/IM", nombre, "/FI", fmt.Sprintf("PID ne %d", yo))
		cmd.SysProcAttr = ocultarVentana()
		_ = cmd.Run()
		return
	}

	salida, err := exec.Command("pgrep", "-x", nombre).Output()
	if err != nil {
		return
	}
	for _, linea := range strings.Fields(string(salida)) {
		pid, err := strconv.Atoi(linea)
		if err != nil || pid == yo {
			continue
		}
		matarPID(pid)
	}
}

// matarPrevios baja a quien esté escuchando ese puerto y espera a que lo
// suelte. Silencioso a propósito: si no se puede, quien llama lo nota porque el
// puerto sigue ocupado.
func matarPrevios(puerto string) {
	for _, pid := range pidsEscuchando(puerto) {
		if pid <= 4 || pid == os.Getpid() {
			continue // 0 y 4 son del sistema; y a uno mismo no se mata
		}
		log.Printf("bajando el servidor anterior (PID %d)", pid)
		matarPID(pid)
	}

	// Soltar el puerto no es instantáneo: se espera a que de verdad quede libre.
	for i := 0; i < 20; i++ {
		if !yaHayServidor(puerto) {
			return
		}
		time.Sleep(100 * time.Millisecond)
	}
}

// pidsEscuchando devuelve los procesos con ese puerto en escucha.
func pidsEscuchando(puerto string) []int {
	var salida []byte
	var err error

	if runtime.GOOS == "windows" {
		salida, err = exec.Command("netstat", "-ano", "-p", "tcp").Output()
	} else {
		salida, err = exec.Command("lsof", "-ti", "tcp:"+puerto, "-sTCP:LISTEN").Output()
	}
	if err != nil {
		log.Printf("no pude averiguar quién tiene el puerto: %v", err)
		return nil
	}

	vistos := map[int]bool{}
	var pids []int
	for _, linea := range strings.Split(string(salida), "\n") {
		campos := strings.Fields(linea)
		if runtime.GOOS == "windows" {
			// Proto  Direccion local  Direccion remota  Estado  PID
			if len(campos) < 5 || !strings.EqualFold(campos[3], "LISTENING") {
				continue
			}
			if !strings.HasSuffix(campos[1], ":"+puerto) {
				continue
			}
			campos = campos[4:]
		}
		if len(campos) == 0 {
			continue
		}
		pid, err := strconv.Atoi(strings.TrimSpace(campos[0]))
		if err != nil || vistos[pid] {
			continue
		}
		vistos[pid] = true
		pids = append(pids, pid)
	}
	return pids
}

func matarPID(pid int) {
	if runtime.GOOS == "windows" {
		// taskkill y no Process.Kill: baja también lo que el proceso haya
		// dejado colgando, que es lo que pasa con un `npm run dev`.
		cmd := exec.Command("taskkill", "/F", "/T", "/PID", strconv.Itoa(pid))
		cmd.SysProcAttr = ocultarVentana()
		if err := cmd.Run(); err != nil {
			log.Printf("no pude bajar el PID %d: %v", pid, err)
		}
		return
	}
	if p, err := os.FindProcess(pid); err == nil {
		_ = p.Kill()
	}
}

// yaHayServidor pregunta si alguien contesta ya en ese puerto.
func yaHayServidor(puerto string) bool {
	for _, host := range []string{"127.0.0.1", "[::1]"} {
		c, err := net.DialTimeout("tcp", host+":"+puerto, 400*time.Millisecond)
		if err == nil {
			_ = c.Close()
			return true
		}
	}
	return false
}

// escuchar abre el puerto en las dos familias de loopback. Devuelve las que
// hayan salido bien: una máquina sin IPv6 sigue andando con una sola.
func escuchar(puerto string) []net.Listener {
	var out []net.Listener
	for _, host := range []string{"127.0.0.1", "[::1]"} {
		lis, err := net.Listen("tcp", host+":"+puerto)
		if err != nil {
			log.Printf("no pude escuchar en %s: %v", host, err)
			continue
		}
		out = append(out, lis)
	}
	return out
}

// morir deja el motivo escrito y sale. Sin consola no hay dónde quejarse, así
// que el archivo es la única forma de que alguien se entere.
func morir(err error) {
	msg := fmt.Sprintf("CATALOG: %v\n", err)
	log.Print(msg)
	if cwd, e := os.Getwd(); e == nil {
		_ = os.WriteFile(filepath.Join(cwd, "catalog-error.log"),
			[]byte(strings.TrimSpace(msg)+"\n"), 0o644)
	}
	os.Exit(1)
}
