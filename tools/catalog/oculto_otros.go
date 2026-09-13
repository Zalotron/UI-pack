//go:build !windows

package main

import (
	"syscall"
	"time"
)

// Fuera de Windows no hay ventana que esconder...
func ocultarVentana() *syscall.SysProcAttr { return nil }

// ...ni bloqueo de primer plano que pelear: el gestor de ventanas se encarga.
func permitirTraerAlFrente() {}

func traerAlFrente(string, time.Duration) bool { return false }
