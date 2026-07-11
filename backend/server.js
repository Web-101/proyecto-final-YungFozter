'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const { handleAPIRequest } = require('./routes/cartelera');

const PORT = process.env.PORT || 3000;
const frontendDir = path.join(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
}

function serveStaticFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 - Archivo no encontrado');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] ${method} ${pathname}`);

  setCORSHeaders(res);

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname.startsWith('/api/')) {
    try {
      const handled = await handleAPIRequest(req, res, pathname);
      if (!handled) {
        const body = JSON.stringify({
          success: false,
          mensaje: `Ruta del API no encontrada: ${method} ${pathname}`
        });
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(body);
      }
    } catch (err) {
      console.error('Error en el API:', err);
      const body = JSON.stringify({
        success: false,
        mensaje: 'Error interno del servidor. Intenta de nuevo más tarde.'
      });
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(body);
    }
    return;
  }

  if (pathname === '/' || pathname === '/index.html') {
    const htmlPath = path.join(frontendDir, 'Html', 'DashboardScreen.html');
    serveStaticFile(res, htmlPath);
    return;
  }

  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(frontendDir, safePath);

  serveStaticFile(res, filePath);
});

server.listen(PORT, () => {
  console.log('CineWeb API — Servidor iniciado  (Node.js nativo — sin frameworks)');
  console.log(`Servidor: http://localhost:${PORT}`);
  console.log(`API Base: http://localhost:${PORT}/api`);
  console.log('Endpoints disponibles:');
  console.log(`GET http://localhost:${PORT}/api/cartelera`);
  console.log(`GET http://localhost:${PORT}/api/cartelera/:id`);
  console.log(`GET http://localhost:${PORT}/api/cartelera/:id/funcion/:funcionId`);
  console.log(`POST http://localhost:${PORT}/api/cartelera/compra`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`El puerto ${PORT} ya está en uso. Detén el otro proceso e inténtalo de nuevo.\n`);
  } else {
    console.error('Error del servidor:', err.message, '\n');
  }
  process.exit(1);
});

module.exports = server;
