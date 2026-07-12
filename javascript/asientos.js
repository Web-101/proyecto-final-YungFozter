const API_BASE = 'http://localhost:3000/api';
        const params = new URLSearchParams(window.location.search);
        const peliculaId = params.get('peliculaId');
        const funcionId = params.get('funcionId');

        let asientosSeleccionados = [];
        let precioPorEntrada = 0;
        let datosFuncion = null;

        const estadoCarga = document.getElementById('estado-carga');
        const estadoError = document.getElementById('estado-error');
        const salaContenedor = document.getElementById('sala-contenedor');
        const salaGrid = document.getElementById('sala-grid');
        const colLabels = document.getElementById('col-labels');
        const headerTitulo = document.getElementById('header-titulo');
        const headerSubtitulo = document.getElementById('header-subtitulo');
        const resumenAsientosTxt = document.getElementById('resumen-asientos-texto');
        const resumenTotal = document.getElementById('resumen-total');
        const resumenPorEntrada = document.getElementById('resumen-por-entrada');
        const btnContinuar = document.getElementById('btn-continuar');
        const btnBack = document.getElementById('btn-back');
        const btnReintentar = document.getElementById('btn-reintentar');

        btnBack.addEventListener('click', (e) => {
            e.preventDefault();
            if (peliculaId) {
                window.location.href = `../Html/pelicula.html?id=${peliculaId}`;
            } else {
                window.history.back();
            }
        });

        btnReintentar.addEventListener('click', () => {
            cargarSala();
        });

        async function cargarSala() {
            if (!peliculaId || !funcionId) {
                mostrarError('Faltan parámetros en la URL. Regresa a la cartelera y selecciona una función.');
                return;
            }
            estadoCarga.style.display = 'flex';
            estadoError.style.display = 'none';
            salaContenedor.style.display = 'none';
            try {
                const resp = await fetch(`${API_BASE}/cartelera/${peliculaId}/funcion/${funcionId}`);

                if (!resp.ok) {
                    const err = await resp.json();
                    throw new Error(err.mensaje || `Error ${resp.status}`);
                }

                const json = await resp.json();
                datosFuncion = json.data;

                headerTitulo.textContent = datosFuncion.pelicula.titulo;
                headerSubtitulo.textContent = `${datosFuncion.funcion.hora} · ${datosFuncion.funcion.sala}`;

                precioPorEntrada = datosFuncion.funcion.precio;
                resumenPorEntrada.textContent = `$${precioPorEntrada.toFixed(2)} por entrada`;

                renderizarSala(datosFuncion);

                estadoCarga.style.display = 'none';
                salaContenedor.style.display = 'block';

            } catch (err) {
                console.error('Error cargando sala:', err);
                mostrarError(err.message || 'No se pudo conectar al servidor.');
            }
        }
        function renderizarSala(datos) {
            const { asientos, layout } = datos;

            salaGrid.innerHTML = '';
            colLabels.innerHTML = '';

            const filas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
            const columnas = [1, 2, 3, 4, 5, 6, 7, 8];

            salaGrid.style.gridTemplateColumns = `24px repeat(${columnas.length}, 1fr)`;
            colLabels.style.gridTemplateColumns = `24px repeat(${columnas.length}, 1fr)`;

            filas.forEach(fila => {
                const etiqueta = document.createElement('div');
                etiqueta.className = 'fila-label';
                etiqueta.textContent = fila;
                salaGrid.appendChild(etiqueta);
                columnas.forEach(col => {
                    const codigo = `${fila}${col}`;
                    const asientoData = asientos.find(a => a.id === codigo);
                    const estado = asientoData ? asientoData.estado : 'disponible';

                    const btn = document.createElement('button');
                    btn.id = `asiento-${codigo}`;
                    btn.className = `asiento ${estado}`;
                    btn.dataset.id = codigo;
                    btn.dataset.estado = estado;
                    btn.title = estado === 'ocupado'
                        ? `Asiento ${codigo} — Ocupado`
                        : `Asiento ${codigo}`;

                    if (estado === 'ocupado') {
                        btn.disabled = true;
                        btn.setAttribute('aria-disabled', 'true');
                    } else {
                        btn.addEventListener('click', () => toggleAsiento(btn, codigo));
                    }

                    salaGrid.appendChild(btn);
                });
            });
            const espacioVacio = document.createElement('div');
            colLabels.appendChild(espacioVacio);

            columnas.forEach(col => {
                const label = document.createElement('div');
                label.className = 'col-label';
                label.textContent = col;
                colLabels.appendChild(label);
            });
        }
        function toggleAsiento(btn, codigo) {
            const estaSeleccionado = asientosSeleccionados.includes(codigo);

            if (estaSeleccionado) {
                asientosSeleccionados = asientosSeleccionados.filter(a => a !== codigo);
                btn.classList.remove('seleccionado');
                btn.classList.add('disponible');
                btn.dataset.estado = 'disponible';
                btn.title = `Asiento ${codigo}`;
            } else {
                asientosSeleccionados.push(codigo);
                btn.classList.remove('disponible');
                btn.classList.add('seleccionado');
                btn.dataset.estado = 'seleccionado';
                btn.title = `Asiento ${codigo} — Seleccionado`;
            }

            actualizarResumen();
        }

        function actualizarResumen() {
            const cantidad = asientosSeleccionados.length;
            const total = cantidad * precioPorEntrada;

            if (cantidad === 0) {
                resumenAsientosTxt.textContent = 'Ninguno seleccionado';
                resumenAsientosTxt.classList.add('placeholder');
                resumenTotal.textContent = '$0.00';
                btnContinuar.disabled = true;
            } else {
                const ordenados = [...asientosSeleccionados].sort();
                resumenAsientosTxt.textContent = ordenados.join(', ');
                resumenAsientosTxt.classList.remove('placeholder');
                resumenTotal.textContent = `$${total.toFixed(2)}`;
                btnContinuar.disabled = false;
            }
        }

        btnContinuar.addEventListener('click', () => {
            if (asientosSeleccionados.length === 0) return;

            const asientosStr = encodeURIComponent(JSON.stringify(asientosSeleccionados));
            const url = `../Html/compra.html`
                + `?peliculaId=${peliculaId}`
                + `&funcionId=${encodeURIComponent(funcionId)}`
                + `&asientos=${asientosStr}`;

            window.location.href = url;
        });
        function mostrarError(msg) {
            estadoCarga.style.display = 'none';
            salaContenedor.style.display = 'none';
            estadoError.style.display = 'block';
            document.getElementById('mensaje-error').textContent = msg;
        }

        cargarSala();