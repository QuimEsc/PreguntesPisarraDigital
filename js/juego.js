document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const marcadorDiv = document.getElementById('marcador');
    const preguntaEl = document.getElementById('pregunta');
    const opcionesDiv = document.getElementById('opciones');
    const preguntaWrapper = document.getElementById('pregunta-wrapper');
    const loadingOverlay = document.getElementById('loading-overlay');
    const podioOverlay = document.getElementById('podio-overlay');

    // Estado del juego
    let preguntas = [];
    let puntuaciones = [];
    let preguntaActualIndex = 0;
    let turnoActualIndex = 0;
    const COLORES_GRUPOS = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

    /**
     * Inicia el juego.
     */
    async function init() {
        const nombresGruposJSON = localStorage.getItem('gruposJuego');
        if (!nombresGruposJSON) {
            alert("No s'han trobat grups. Tornant a la pàgina d'inici.");
            window.location.href = 'index.html';
            return;
        }

        const nombresGrupos = JSON.parse(nombresGruposJSON);
        puntuaciones = nombresGrupos.map(nombre => ({ nombre, puntos: 0 }));

        renderMarcador();

        preguntas = await SheetService.getPreguntas();
        loadingOverlay.classList.remove('visible');

        if (preguntas.length === 0) {
            preguntaEl.textContent = "No s'han pogut carregar les preguntes. Revisa la connexió o la configuració de Google Sheets.";
            return;
        }

        // Barajar preguntas para que cada juego sea diferente
        preguntas.sort(() => Math.random() - 0.5);

        mostrarSiguientePregunta();
    }

    /**
     * Muestra el marcador con las puntuaciones.
     */
    function renderMarcador() {
        marcadorDiv.innerHTML = '';
        puntuaciones.forEach((grupo, index) => {
            const grupoDiv = document.createElement('div');
            grupoDiv.classList.add('grupo-marcador');
            if (index === turnoActualIndex) {
                grupoDiv.classList.add('turno-actual');
            }
            grupoDiv.style.backgroundColor = COLORES_GRUPOS[index % COLORES_GRUPOS.length];
            grupoDiv.innerHTML = `
                <div class="grupo-nombre">${grupo.nombre}</div>
                <div class="grupo-puntos">${grupo.puntos}</div>
            `;
            marcadorDiv.appendChild(grupoDiv);
        });
    }

    /**
     * Muestra la pregunta y opciones actuales.
     */
    function mostrarSiguientePregunta() {
        if (preguntaActualIndex >= preguntas.length) {
            finalizarJuego();
            return;
        }

        const preguntaActual = preguntas[preguntaActualIndex];
        const colorTurno = COLORES_GRUPOS[turnoActualIndex % COLORES_GRUPOS.length];
        
        preguntaWrapper.style.backgroundColor = colorTurno;
        preguntaEl.textContent = preguntaActual.pregunta;

        opcionesDiv.innerHTML = '';
        preguntaActual.opciones.forEach((opcion, index) => {
            const opcionBtn = document.createElement('div');
            opcionBtn.classList.add('opcion');
            opcionBtn.textContent = opcion;
            opcionBtn.addEventListener('click', () => manejarRespuesta(index + 1));
            opcionesDiv.appendChild(opcionBtn);
        });
        
        renderMarcador();
    }

    /**
     * Procesa la respuesta seleccionada por el usuario.
     * @param {number} opcionSeleccionada - El número de la opción (1-4).
     */
    function manejarRespuesta(opcionSeleccionada) {
        const preguntaActual = preguntas[preguntaActualIndex];
        const respuestaCorrecta = parseInt(preguntaActual.correcta);
        const opciones = opcionesDiv.children;

        // Deshabilitar más clics
        for (let opcion of opciones) {
            opcion.classList.add('disabled');
        }

        const botonSeleccionado = opciones[opcionSeleccionada - 1];

        if (opcionSeleccionada === respuestaCorrecta) {
            puntuaciones[turnoActualIndex].puntos++;
            botonSeleccionado.classList.add('correcta');
        } else {
            botonSeleccionado.classList.add('incorrecta');
            // Mostrar siempre la correcta
            opciones[respuestaCorrecta - 1].classList.add('correcta');
        }

        renderMarcador();

        setTimeout(() => {
            preguntaActualIndex++;
            turnoActualIndex = (turnoActualIndex + 1) % puntuaciones.length;
            mostrarSiguientePregunta();
        }, 1500); // Aumentado a 1.5s para dar tiempo a ver la respuesta
    }

    /**
     * Finaliza el juego, muestra el podio y guarda las puntuaciones.
     */
    function finalizarJuego() {
        // Ocultar el contenedor del juego
        document.getElementById('juego-container').style.display = 'none';
        
        // Ordenar puntuaciones de mayor a menor
        puntuaciones.sort((a, b) => b.puntos - a.puntos);
        
        // Asignar al podio
        const puestos = [
            document.querySelector('#puesto-1'),
            document.querySelector('#puesto-2'),
            document.querySelector('#puesto-3')
        ];

        puntuaciones.slice(0, 3).forEach((grupo, index) => {
            if (puestos[index]) {
                puestos[index].querySelector('.nombre').textContent = grupo.nombre;
                puestos[index].querySelector('.puntos').textContent = `${grupo.puntos} punts`;
            }
        });

        podioOverlay.classList.add('visible');

        // Guardar las puntuaciones en Google Sheets
        SheetService.guardarPuntuaciones(puntuaciones);
    }
    
    // Iniciar el juego
    init();
});