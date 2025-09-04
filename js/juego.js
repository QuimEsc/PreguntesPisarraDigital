document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const marcadorDiv = document.getElementById('marcador');
    const preguntaEl = document.getElementById('pregunta');
    const opcionesDiv = document.getElementById('opciones');
    const preguntaWrapper = document.getElementById('pregunta-wrapper');
    const loadingOverlay = document.getElementById('loading-overlay');
    const podioOverlay = document.getElementById('podio-overlay');
    const timerText = document.getElementById('timer-text');
    const timerProgress = document.getElementById('timer-progress');
    const bonusRachaEl = document.getElementById('bonus-racha');

    // Estado del juego
    let preguntas = [];
    let puntuaciones = [];
    let preguntaActualIndex = 0;
    let turnoActualIndex = 0;
    const COLORES_GRUPOS = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

    // Variables del temporizador
    let timerInterval;
    let tiempoRestante;
    let tiempoMaximoPregunta;
    let startTime;

    async function init() {
        const nombresGruposJSON = localStorage.getItem('gruposJuego');
        if (!nombresGruposJSON) {
            alert("No s'han trobat grups. Tornant a la pàgina d'inici.");
            window.location.href = 'index.html';
            return;
        }

        const nombresGrupos = JSON.parse(nombresGruposJSON);
        puntuaciones = nombresGrupos.map(nombre => ({ nombre, puntos: 0, racha: 0 }));

        renderMarcador();

        preguntas = await SheetService.getPreguntas();
        loadingOverlay.classList.remove('visible');

        if (preguntas.length === 0) {
            preguntaEl.textContent = "No s'han pogut carregar les preguntes. Revisa la connexió o la configuració de Google Sheets.";
            return;
        }

        preguntas.sort(() => Math.random() - 0.5);
        mostrarSiguientePregunta();
    }

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
            if (grupo.racha > 1) {
                const rachaDiv = document.createElement('div');
                rachaDiv.classList.add('racha-contador');
                rachaDiv.textContent = `x${grupo.racha}`;
                grupoDiv.appendChild(rachaDiv);
            }
            marcadorDiv.appendChild(grupoDiv);
        });
    }

    function mostrarSiguientePregunta() {
        if (preguntaActualIndex >= preguntas.length) {
            finalizarJuego();
            return;
        }

        const preguntaActual = preguntas[preguntaActualIndex];
        const colorTurno = COLORES_GRUPOS[turnoActualIndex % COLORES_GRUPOS.length];
        
        preguntaWrapper.style.backgroundColor = colorTurno;
        // MODIFICACIÓN: Usar innerHTML para interpretar etiquetas HTML
        preguntaEl.innerHTML = preguntaActual.pregunta;

        opcionesDiv.innerHTML = '';
        preguntaActual.opciones.forEach((opcion, index) => {
            const opcionBtn = document.createElement('div');
            opcionBtn.classList.add('opcion');
            // MODIFICACIÓN: Usar innerHTML para las opciones también
            opcionBtn.innerHTML = opcion;
            opcionBtn.addEventListener('click', () => manejarRespuesta(index + 1));
            opcionesDiv.appendChild(opcionBtn);
        });
        
        // MODIFICACIÓN: Pedir a MathJax que renderice el nuevo contenido
        // Se comprueba que la librería MathJax ya esté cargada en la ventana
        if (window.MathJax) {
            MathJax.typesetPromise([preguntaWrapper, opcionesDiv]).catch((err) => {
                console.error('Error al renderitzar MathJax:', err);
            });
        }
        
        tiempoMaximoPregunta = preguntaActual.tiempo;
        startTimer();
        renderMarcador();
    }

    function startTimer() {
        clearInterval(timerInterval);
        tiempoRestante = tiempoMaximoPregunta;
        startTime = Date.now();
        
        timerText.textContent = tiempoRestante;
        timerProgress.style.background = `conic-gradient(var(--color-primario) 360deg, #e9ecef 0deg)`;

        timerInterval = setInterval(() => {
            const tiempoTranscurrido = (Date.now() - startTime) / 1000;
            tiempoRestante = Math.ceil(tiempoMaximoPregunta - tiempoTranscurrido);
            timerText.textContent = tiempoRestante;

            const grados = (tiempoRestante / tiempoMaximoPregunta) * 360;
            timerProgress.style.background = `conic-gradient(var(--color-primario) ${grados}deg, #e9ecef 0deg)`;

            if (tiempoRestante <= 0) {
                tiempoAgotado();
            }
        }, 100);
    }
    
    function tiempoAgotado() {
        clearInterval(timerInterval);
        puntuaciones[turnoActualIndex].racha = 0;
        
        const preguntaActual = preguntas[preguntaActualIndex];
        const respuestaCorrecta = parseInt(preguntaActual.correcta);
        const opciones = opcionesDiv.children;

        for (let opcion of opciones) {
            opcion.classList.add('disabled');
        }
        opciones[respuestaCorrecta - 1].classList.add('correcta');

        setTimeout(pasarSiguienteTurno, 2000);
    }

    function manejarRespuesta(opcionSeleccionada) {
        clearInterval(timerInterval);
        const tiempoTardado = (Date.now() - startTime) / 1000;
        
        const preguntaActual = preguntas[preguntaActualIndex];
        const respuestaCorrecta = parseInt(preguntaActual.correcta);
        const opciones = opcionesDiv.children;
        const grupoActual = puntuaciones[turnoActualIndex];

        for (let opcion of opciones) {
            opcion.classList.add('disabled');
        }

        const botonSeleccionado = opciones[opcionSeleccionada - 1];

        if (opcionSeleccionada === respuestaCorrecta) {
            const puntosBase = 500 + Math.round(500 * (1 - (tiempoTardado / tiempoMaximoPregunta)));
            grupoActual.racha++;
            let bonusRacha = 0;
            if (grupoActual.racha > 1) {
                bonusRacha = (grupoActual.racha - 1) * 50;
                mostrarBonus(bonusRacha);
            }
            const puntosGanados = puntosBase + bonusRacha;
            grupoActual.puntos += puntosGanados;
            botonSeleccionado.classList.add('correcta');
        } else {
            grupoActual.racha = 0;
            botonSeleccionado.classList.add('incorrecta');
            opciones[respuestaCorrecta - 1].classList.add('correcta');
        }

        renderMarcador();
        setTimeout(pasarSiguienteTurno, 2000);
    }

    function mostrarBonus(bonus) {
        bonusRachaEl.textContent = `+${bonus} Racha!`;
        bonusRachaEl.classList.add('show');
        setTimeout(() => {
            bonusRachaEl.classList.remove('show');
        }, 1500);
    }

    function pasarSiguienteTurno() {
        preguntaActualIndex++;
        turnoActualIndex = (turnoActualIndex + 1) % puntuaciones.length;
        mostrarSiguientePregunta();
    }

    function finalizarJuego() {
        document.getElementById('juego-container').style.display = 'none';
        puntuaciones.sort((a, b) => b.puntos - a.puntos);
        
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
        SheetService.guardarPuntuaciones(puntuaciones);
    }
    
    init();
});
