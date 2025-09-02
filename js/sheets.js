// Objeto para manejar la comunicación con Google Sheets
const SheetService = {
    // ❗️ PEGA AQUÍ LA URL DE TU APLICACIÓN WEB DE GOOGLE APPS SCRIPT
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyGcZpW_IX7lpmrjxto1F_TddP202bzY4bcxWQDA_-UFa8iVfWvT0y1ZcVwRSFwwyre/exec',

    /**
     * Obtiene las preguntas desde la hoja de cálculo.
     * @returns {Promise<Array>} Una promesa que resuelve a un array de preguntas.
     */
    async getPreguntas() {
        try {
            const response = await fetch(this.SCRIPT_URL);
            if (!response.ok) {
                throw new Error('Error en la resposta de la xarxa.');
            }
            const preguntas = await response.json();
            return preguntas;
        } catch (error) {
            console.error("Error al carregar les preguntes:", error);
            // Podrías mostrar un mensaje de error al usuario aquí
            return []; // Devuelve un array vacío en caso de error
        }
    },

    /**
     * Guarda las puntuaciones finales en la hoja de cálculo.
     * @param {Array<Object>} puntuaciones - Array con {nombre, puntos}.
     */
    async guardarPuntuaciones(puntuaciones) {
        try {
            await fetch(this.SCRIPT_URL, {
                method: 'POST',
                mode: 'cors', // El modo 'no-cors' puede ser necesario a veces, pero 'cors' es ideal
                headers: {
                    "Content-Type": "text/plain;charset=utf-8", // Tipo de contenido que espera Apps Script
                },
                body: JSON.stringify(puntuaciones)
            });
            console.log("Puntuacions guardades correctament.");
        } catch (error) {
            console.error("Error al guardar les puntuacions:", error);
        }
    }
};