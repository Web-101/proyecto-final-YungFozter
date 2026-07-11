// Filtrado por género (solo tres opciones)
        function filtrarPorGenero(genero) {
            const buttons = document.querySelectorAll('.btn-filter');
            buttons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.genero === genero);
            });

            const cards = document.querySelectorAll('.movie-card');
            cards.forEach(card => {
                const meta = card.querySelector('.movie-meta').textContent;
                const generoCard = card.dataset.genero;
                const mostrar = (genero === 'Todos') || (generoCard && generoCard === genero) || meta.includes(genero);
                card.style.display = mostrar ? 'block' : 'none';
            });
        }

        // Asignar eventos a los botones de filtro
        document.querySelectorAll('.btn-filter').forEach(btn => {
            btn.addEventListener('click', function () {
                filtrarPorGenero(this.dataset.genero);
            });
        });

        // Búsqueda en tiempo real
        const searchInput = document.getElementById('buscar-titulo');
        if (searchInput) {
            searchInput.addEventListener('input', function (e) {
                const query = e.target.value.toLowerCase().trim();
                const cards = document.querySelectorAll('.movie-card');
                cards.forEach(card => {
                    const title = card.querySelector('.movie-title').textContent.toLowerCase();
                    card.style.display = title.includes(query) ? 'block' : 'none';
                });
            });
        }