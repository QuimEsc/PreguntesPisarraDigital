document.addEventListener('DOMContentLoaded', () => {
    const listaGrupos = document.getElementById('lista-grupos');
    const btnAdd = document.getElementById('btn-add');
    const btnRemove = document.getElementById('btn-remove');
    const btnEnviar = document.getElementById('btn-enviar');
    let grupoCount = 2;

    const actualizarBotones = () => {
        btnRemove.disabled = grupoCount <= 2;
    };

    btnAdd.addEventListener('click', () => {
        grupoCount++;
        const nuevoGrupo = document.createElement('div');
        nuevoGrupo.classList.add('grupo-input');
        nuevoGrupo.innerHTML = `
            <label for="grupo-${grupoCount}">Grup ${grupoCount}:</label>
            <input type="text" id="grupo-${grupoCount}" class="nombre-grupo" maxlength="25" placeholder="Nom del grup ${grupoCount}">
        `;
        listaGrupos.appendChild(nuevoGrupo);
        actualizarBotones();
    });

    btnRemove.addEventListener('click', () => {
        if (grupoCount > 2) {
            listaGrupos.lastElementChild.remove();
            grupoCount--;
            actualizarBotones();
        }
    });

    btnEnviar.addEventListener('click', () => {
        const inputs = document.querySelectorAll('.nombre-grupo');
        const nombresGrupos = [];
        let todosValidos = true;

        inputs.forEach(input => {
            const nombre = input.value.trim();
            if (nombre === '' || nombre.length > 25) {
                input.style.border = '2px solid red';
                todosValidos = false;
            } else {
                input.style.border = '1px solid #ccc';
                nombresGrupos.push(nombre);
            }
        });

        if (todosValidos) {
            // Guardamos los nombres en localStorage para usarlos en la otra página
            localStorage.setItem('gruposJuego', JSON.stringify(nombresGrupos));
            window.location.href = 'juego.html';
        } else {
            alert('Per favor, ompli tots els noms dels grups (màxim 25 caràcters).');
        }
    });

    actualizarBotones();
});