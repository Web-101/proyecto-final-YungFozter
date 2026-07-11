const parametrosUrl = new URLSearchParams(window.location.search);
        const peliculaId = parametrosUrl.get('id');

        const mensajeCarga = document.getElementById('mensaje-carga');
        const seccionDetalles = document.getElementById('seccion-detalles');

        const imagenPoster = document.getElementById('imagen-poster');
        const tituloPelicula = document.getElementById('titulo-pelicula');
        const generoPelicula = document.getElementById('genero-pelicula');
        const duracionPelicula = document.getElementById('duracion-pelicula');
        const clasificacionPelicula = document.getElementById('clasificacion-pelicula');
        const sinopsisPelicula = document.getElementById('sinopsis-pelicula');

        const listaFunciones = document.getElementById('lista-funciones');
        const botonVolver = document.getElementById('boton-volver');

        botonVolver.addEventListener('click', function () {
            window.location.href = '../Html/DashboardScreen.html';
        });
        async function cargarDatosPelicula() {
            try {
                const respuesta = await fetch(`http://localhost:3000/api/cartelera/${peliculaId}`);

                // Convertir la respuesta a formato JSON
                const json = await respuesta.json();

                if (json.success === true) {
                    mostrarDatosEnPantalla(json.data);
                } else {
                    mensajeCarga.textContent = json.mensaje;
                }
            } catch (error) {
                console.error("Error al cargar:", error);
                mensajeCarga.textContent = "Error de conexión. Verifica que el servidor esté encendido.";
            }
        }
        function mostrarDatosEnPantalla(pelicula) {
            tituloPelicula.textContent = pelicula.titulo;
            generoPelicula.textContent = pelicula.genero;
            duracionPelicula.textContent = pelicula.duracion;
            clasificacionPelicula.textContent = pelicula.clasificacion;
            sinopsisPelicula.textContent = pelicula.sinopsis;

            imagenPoster.src = pelicula.poster;

            pelicula.funciones.forEach(function (funcion) {
                const boton = document.createElement('button');
                boton.className = 'boton-funcion';

                boton.textContent = `${funcion.hora} - ${funcion.sala}`;

                boton.addEventListener('click', function () {
                    window.location.href = `asientos.html?peliculaId=${pelicula.id}&funcionId=${funcion.id}`;
                });

                listaFunciones.appendChild(boton);
            });

            mensajeCarga.classList.add('oculto');
            seccionDetalles.classList.remove('oculto');
        }

        if (peliculaId) {
            cargarDatosPelicula();
        } else {
            mensajeCarga.textContent = "No se ha seleccionado ninguna película. Vuelve a la cartelera.";
        }