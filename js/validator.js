// ==========================================
// OBJETO GLOBAL DE VALIDACIÓN
// ==========================================
const Validator = {
    
    // REGLA 1: Verificar si un campo está vacío
    esRequerido(valor) {
        return valor !== null && valor !== undefined && valor.trim() !== '';
    },

    // REGLA 2: Validar formato de correo electrónico con Expresión Regular
    esEmailValido(email) {
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regexEmail.test(email);
    },

    // REGLA 3: Validar que el progreso esté entre 0 y 100
    esProgresoValido(progreso) {
        const num = Number(progreso);
        return !isNaN(num) && num >= 0 && num <= 100;
    },

    // REGLA 4: Validar que el monto sea un número positivo o cero
    esMontoValido(monto) {
        const num = Number(monto);
        return !isNaN(num) && num >= 0;
    },

    // FUNCIÓN PRINCIPAL: Valida todo el formulario y devuelve un objeto con los resultados
    validarFormulario(datos) {
        const errores = [];

        // Validar Nombre
        if (!this.esRequerido(datos.nombre)) {
            errores.push("El nombre completo es obligatorio.");
        }

        // Validar Email
        if (!this.esRequerido(datos.email)) {
            errores.push("El correo electrónico es obligatorio.");
        } else if (!this.esEmailValido(datos.email)) {
            errores.push("El formato del correo electrónico no es válido.");
        }

        // Validar Ciudad
        if (!this.esRequerido(datos.ciudad)) {
            errores.push("Debes seleccionar una ciudad de origen.");
        }

        // Validar Curso
        if (!this.esRequerido(datos.curso)) {
            errores.push("El curso asignado es obligatorio.");
        }

        // Validar Progreso
        if (datos.progreso === '' || datos.progreso === undefined) {
            errores.push("El progreso académico es obligatorio.");
        } else if (!this.esProgresoValido(datos.progreso)) {
            errores.push("El progreso debe ser un número entero entre 0 y 100.");
        }

        // Validar Monto
        if (datos.montoUSD === '' || datos.montoUSD === undefined) {
            errores.push("El monto de la matrícula es obligatorio.");
        } else if (!this.esMontoValido(datos.montoUSD)) {
            errores.push("El monto de la matrícula no puede ser un número negativo.");
        }

        return {
            esValido: errores.length === 0,
            errores: errores
        };
    }
};