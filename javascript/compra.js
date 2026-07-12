const params = new URLSearchParams(window.location.search);
const peliculaId = params.get('peliculaId');
const funcionId = params.get('funcionId');
const asientosParam = params.get('asientos');

const mensajeCarga = document.getElementById('mensaje-carga');
const seccionCompra = document.getElementById('seccion-compra');
const seccionTicket = document.getElementById('seccion-ticket');
const mensajeError = document.getElementById('mensaje-error');
const btnVolver = document.getElementById('boton-volver');
const btnComprar = document.getElementById('btn-comprar');
const formCompra = document.getElementById('form-compra');

// Elementos del resumen
const resPelicula = document.getElementById('resumen-pelicula');
const resFuncion = document.getElementById('resumen-funcion');
const resAsientos = document.getElementById('resumen-asientos');
const resTotal = document.getElementById('resumen-total');

// Elementos del ticket
const tkMensajeGracias = document.getElementById('ticket-mensaje-gracias');
const tkId = document.getElementById('ticket-id');
const tkPelicula = document.getElementById('ticket-pelicula');
const tkFuncion = document.getElementById('ticket-funcion');
const tkAsientos = document.getElementById('ticket-asientos');
const tkTotal = document.getElementById('ticket-total');
const btnInicio = document.getElementById('btn-inicio');

let asientosSeleccionados = [];
let funcionPrecio = 0;

btnVolver.addEventListener('click', () => {
    window.location.href = `asientos.html?peliculaId=${peliculaId}&funcionId=${encodeURIComponent(funcionId)}`;
});

btnInicio.addEventListener('click', () => {
    window.location.href = 'DashboardScreen.html';
});

async function cargarResumen() {
    if (!peliculaId || !funcionId || !asientosParam) {
        mostrarError("Faltan datos de compra. Por favor vuelve atrás.");
        return;
    }

    try {
        asientosSeleccionados = JSON.parse(decodeURIComponent(asientosParam));
    } catch (e) {
        mostrarError("Error al leer los asientos seleccionados.");
        return;
    }

    if (asientosSeleccionados.length === 0) {
        mostrarError("No has seleccionado ningún asiento.");
        return;
    }

    try {
        const respuesta = await fetch(`http://localhost:3000/api/cartelera/${peliculaId}/funcion/${encodeURIComponent(funcionId)}`);
        const json = await respuesta.json();

        if (json.success) {
            const pelicula = json.data.pelicula;
            const funcion = json.data.funcion;
            funcionPrecio = funcion.precio;

            // Llenar resumen
            resPelicula.textContent = pelicula.titulo;
            resFuncion.textContent = `${funcion.hora} - ${funcion.sala}`;
            resAsientos.textContent = asientosSeleccionados.join(', ');
            
            const total = funcionPrecio * asientosSeleccionados.length;
            resTotal.textContent = `$${total.toFixed(2)}`;

            // Mostrar sección
            mensajeCarga.classList.add('oculto');
            seccionCompra.classList.remove('oculto');
        } else {
            mostrarError(json.mensaje || "Error al cargar los datos de la función.");
        }
    } catch (error) {
        mostrarError("Error de conexión. Verifica que el servidor esté encendido.");
    }
}

function mostrarError(msg) {
    mensajeCarga.textContent = msg;
    mensajeError.textContent = msg;
    mensajeError.classList.remove('oculto');
}

formCompra.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();

    if (!nombre || !email) {
        mensajeError.textContent = "Por favor, completa los campos obligatorios.";
        mensajeError.classList.remove('oculto');
        return;
    }

    mensajeError.classList.add('oculto');
    btnComprar.disabled = true;
    btnComprar.textContent = "Procesando...";

    const payload = {
        peliculaId: peliculaId,
        funcionId: funcionId,
        asientos: asientosSeleccionados,
        usuario: {
            nombre: nombre,
            email: email,
            telefono: telefono || ""
        }
    };

    try {
        const respuesta = await fetch('http://localhost:3000/api/cartelera/compra', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const json = await respuesta.json();

        if (json.success) {
            mostrarTicket(json.ticket);
        } else {
            btnComprar.disabled = false;
            btnComprar.textContent = "Comprar Entradas";
            mensajeError.textContent = json.mensaje || "Error al procesar la compra.";
            mensajeError.classList.remove('oculto');
        }
    } catch (error) {
        btnComprar.disabled = false;
        btnComprar.textContent = "Comprar Entradas";
        mensajeError.textContent = "Error de conexión con el servidor.";
        mensajeError.classList.remove('oculto');
    }
});

function mostrarTicket(ticket) {
    // Ocultar la sección de compra (resumen y formulario)
    seccionCompra.classList.add('oculto');
    btnVolver.classList.add('oculto');

    // Llenar el ticket
    tkMensajeGracias.textContent = `¡Gracias por tu compra, ${ticket.usuario.nombre}!`;
    tkId.textContent = ticket.id;
    tkPelicula.textContent = ticket.pelicula.titulo;
    tkFuncion.textContent = `${ticket.funcion.hora} - ${ticket.funcion.sala}`;
    tkAsientos.textContent = ticket.asientos.join(', ');
    tkTotal.textContent = `$${ticket.total.toFixed(2)}`;

    // Mostrar el ticket
    seccionTicket.classList.remove('oculto');
}

// Iniciar
cargarResumen();
