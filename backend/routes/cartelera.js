// Endpoints manejados:
// GET  /api/cartelera
// GET  /api/cartelera/:id
// GET  /api/cartelera/:id/funcion/:funcionId
// POST /api/cartelera/compra

'use strict';

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'peliculas.json');
const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
let peliculasEnMemoria = JSON.parse(JSON.stringify(rawData.peliculas));

let ticketCounter = 1;

// Layout fijo de la sala (8 filas × 8 columnas)
const FILAS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const COLUMNAS = [1, 2, 3, 4, 5, 6, 7, 8];

// Utilidades internas
function sendJSON(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

// Lee el body de una petición POST y lo parsea como JSON.
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(new Error('El cuerpo de la petición no es JSON válido.'));
      }
    });
    req.on('error', reject);
  });
}

// GET /api/cartelera
// Devuelve la lista resumida de todas las películas.
function handleGetCartelera(req, res) {
  const resumen = peliculasEnMemoria.map(p => ({
    id: p.id,
    titulo: p.titulo,
    poster: p.poster,
    genero: p.genero,
    duracion: p.duracion,
    clasificacion: p.clasificacion,
    año: p.año,
    director: p.director,
    cantidadFunciones: p.funciones.length
  }));

  sendJSON(res, 200, {
    success: true,
    total: resumen.length,
    data: resumen
  });
}

// GET /api/cartelera/:id
// Devuelve el detalle completo de una película + sus funciones disponibles.
function handleGetPelicula(req, res, id) {
  const pelicula = peliculasEnMemoria.find(p => p.id === id);

  if (!pelicula) {
    return sendJSON(res, 404, {
      success: false,
      mensaje: `No se encontró ninguna película con id: ${id}`
    });
  }

  //detalle de la pelicula con sus funciones disponibles
  const detalle = {
    id: pelicula.id,
    titulo: pelicula.titulo,
    poster: pelicula.poster,
    sinopsis: pelicula.sinopsis,
    genero: pelicula.genero,
    duracion: pelicula.duracion,
    clasificacion: pelicula.clasificacion,
    año: pelicula.año,
    director: pelicula.director,
    funciones: pelicula.funciones.map(f => ({
      id: f.id,
      hora: f.hora,
      sala: f.sala,
      precio: f.precio,
      asientosOcupados: f.asientosOcupados.length,
      asientosDisponibles: (FILAS.length * COLUMNAS.length) - f.asientosOcupados.length
    }))
  };

  sendJSON(res, 200, { success: true, data: detalle });
}

// GET /api/cartelera/:id/funcion/:funcionId
// Devuelve el layout completo de asientos para una función específica.
function handleGetFuncion(req, res, peliculaId, funcionId) {
  const pelicula = peliculasEnMemoria.find(p => p.id === peliculaId);
  if (!pelicula) {
    return sendJSON(res, 404, {
      success: false,
      mensaje: `No se encontró ninguna película con id: ${peliculaId}`
    });
  }

  const funcion = pelicula.funciones.find(f => f.id === funcionId);
  if (!funcion) {
    return sendJSON(res, 404, {
      success: false,
      mensaje: `No se encontró la función "${funcionId}" para la película con id: ${peliculaId}`
    });
  }

  // Generar el mapa completo de asientos con su estado
  const asientos = [];
  FILAS.forEach(fila => {
    COLUMNAS.forEach(col => {
      const codigo = `${fila}${col}`;
      asientos.push({
        id: codigo,
        fila: fila,
        columna: col,
        estado: funcion.asientosOcupados.includes(codigo) ? 'ocupado' : 'disponible'
      });
    });
  });

  sendJSON(res, 200, {
    success: true,
    data: {
      pelicula: {
        id: pelicula.id,
        titulo: pelicula.titulo,
        poster: pelicula.poster
      },
      funcion: {
        id: funcion.id,
        hora: funcion.hora,
        sala: funcion.sala,
        precio: funcion.precio
      },
      layout: {
        filas: FILAS.length,
        columnas: COLUMNAS.length,
        total: FILAS.length * COLUMNAS.length
      },
      asientos: asientos,
      asientosOcupados: funcion.asientosOcupados,
      totalOcupados: funcion.asientosOcupados.length,
      totalDisponibles: (FILAS.length * COLUMNAS.length) - funcion.asientosOcupados.length
    }
  });
}

// POST /api/cartelera/compra
// Valida disponibilidad de asientos, los marca como ocupados en memoria
// y devuelve un ticket virtual de confirmación.
async function handlePostCompra(req, res) {
  let body;
  try {
    body = await parseBody(req);
  } catch (e) {
    return sendJSON(res, 400, { success: false, mensaje: e.message });
  }

  const { peliculaId, funcionId, asientos, usuario } = body;

  // Validaciones
  if (!peliculaId || !funcionId || !asientos || !usuario) {
    return sendJSON(res, 400, {
      success: false,
      mensaje: 'Faltan datos requeridos: peliculaId, funcionId, asientos y usuario son obligatorios.'
    });
  }
  if (!usuario.nombre || !usuario.email) {
    return sendJSON(res, 400, {
      success: false,
      mensaje: 'El nombre y el correo electrónico del usuario son obligatorios.'
    });
  }
  if (!Array.isArray(asientos) || asientos.length === 0) {
    return sendJSON(res, 400, {
      success: false,
      mensaje: 'Debe seleccionar al menos un asiento.'
    });
  }

  // Buscar película y función
  const pelicula = peliculasEnMemoria.find(p => p.id === parseInt(peliculaId, 10));
  if (!pelicula) {
    return sendJSON(res, 404, {
      success: false,
      mensaje: `Película con id ${peliculaId} no encontrada.`
    });
  }

  const funcion = pelicula.funciones.find(f => f.id === funcionId);
  if (!funcion) {
    return sendJSON(res, 404, {
      success: false,
      mensaje: `Función ${funcionId} no encontrada.`
    });
  }

  // Verificar disponibilidad
  const asientosConflicto = asientos.filter(a => funcion.asientosOcupados.includes(a));
  if (asientosConflicto.length > 0) {
    return sendJSON(res, 409, {
      success: false,
      mensaje: `Los siguientes asientos ya están ocupados: ${asientosConflicto.join(', ')}`,
      asientosConflicto
    });
  }

  // Marcar asientos como ocupados
  funcion.asientosOcupados = [...funcion.asientosOcupados, ...asientos];

  // Generar ticket virtual
  const total = funcion.precio * asientos.length;
  const fecha = new Date();
  const fechaStr = fecha.toISOString().slice(0, 10).replace(/-/g, '');
  const ticketId = `TICKET-${fechaStr}-${String(ticketCounter++).padStart(3, '0')}`;

  sendJSON(res, 201, {
    success: true,
    ticket: {
      id: ticketId,
      fechaHora: fecha.toISOString(),
      pelicula: {
        id: pelicula.id,
        titulo: pelicula.titulo,
        poster: pelicula.poster
      },
      funcion: {
        id: funcion.id,
        hora: funcion.hora,
        sala: funcion.sala
      },
      asientos: asientos,
      cantidadEntradas: asientos.length,
      precioPorEntrada: funcion.precio,
      total,
      usuario: {
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono || 'No proporcionado'
      },
      mensaje: `¡Gracias por tu compra, ${usuario.nombre}! Disfruta la película.`
    }
  });
}

async function handleAPIRequest(req, res, pathname) {
  const method = req.method.toUpperCase();

  // GET /api/cartelera (lista completa)
  if (method === 'GET' && pathname === '/api/cartelera') {
    handleGetCartelera(req, res);
    return true;
  }

  // POST /api/cartelera/compra
  if (method === 'POST' && pathname === '/api/cartelera/compra') {
    await handlePostCompra(req, res);
    return true;
  }

  // GET /api/cartelera/:id/funcion/:funcionId
  const matchFuncion = pathname.match(/^\/api\/cartelera\/(\d+)\/funcion\/([^/]+)$/);
  if (method === 'GET' && matchFuncion) {
    const peliculaId = parseInt(matchFuncion[1], 10);
    const funcionId = decodeURIComponent(matchFuncion[2]);
    handleGetFuncion(req, res, peliculaId, funcionId);
    return true;
  }

  // GET /api/cartelera/:id (detalle de película)
  const matchPelicula = pathname.match(/^\/api\/cartelera\/(\d+)$/);
  if (method === 'GET' && matchPelicula) {
    const id = parseInt(matchPelicula[1], 10);
    handleGetPelicula(req, res, id);
    return true;
  }

  // Ruta de API no reconocida
  return false;
}

module.exports = { handleAPIRequest };
