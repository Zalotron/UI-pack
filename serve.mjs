/* ===========================================================================
   Servidor estático para ver el catálogo. Solo módulos nativos de Node,
   cero dependencias, funciona offline.

     node serve.mjs          -> http://localhost:5173
     node serve.mjs 8080     -> otro puerto
     node serve.mjs --open   -> abre el navegador solo

   Hace falta porque los ES Modules no cargan desde file://.
   No forma parte de la librería.

   =========================================================================== */

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { spawn } from 'node:child_process';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const args = process.argv.slice(2);
const PORT = Number(args.find((a) => /^\d+$/.test(a))) || 5173;
const ABRIR = args.includes('--open');
const URL_LOCAL = `http://localhost:${PORT}`;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

/** Abre el navegador por defecto, en cada sistema a su manera. */
function abrirNavegador(url) {
  const [cmd, args] = process.platform === 'win32'
    ? ['cmd', ['/c', 'start', '', url]]
    : process.platform === 'darwin'
      ? ['open', [url]]
      : ['xdg-open', [url]];
  spawn(cmd, args, { detached: true, stdio: 'ignore' }).unref();
}

const server = createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);

  let filePath = normalize(join(ROOT, url === '/' ? 'index.html' : url));

  // No dejamos salir de la carpeta del proyecto.
  if (!filePath.startsWith(ROOT.replace(new RegExp(`\\${sep}$`), '') + sep) && filePath !== ROOT) {
    res.writeHead(403).end('403 Forbidden');
    return;
  }

  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = join(filePath, 'index.html');
    await stat(filePath);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end(`404 — no existe ${url}`);
    return;
  }

  res.writeHead(200, {
    'content-type': TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream',
    'cache-control': 'no-cache',
  });
  createReadStream(filePath).pipe(res);
});

/* Si el puerto ya esta ocupado, lo mas probable es que el catalogo YA se este
   sirviendo — alguien hizo doble click en CATALOG.exe. Levantar un segundo
   servidor no ayudaria a nadie: se abre la pestaña contra el que ya esta y este
   se va sin hacer ruido. */
server.on('error', (error) => {
  if (error.code !== 'EADDRINUSE') throw error;
  console.log(`  ya hay algo sirviendo en ${URL_LOCAL}: abro ahi.`);
  if (ABRIR) abrirNavegador(URL_LOCAL);
  process.exit(0);
});

server.listen(PORT, () => {
  console.log(`
  Web UI — catalogo
  ${URL_LOCAL}
`);
  console.log('  Ctrl+C para salir\n');
  if (ABRIR) abrirNavegador(URL_LOCAL);
});
