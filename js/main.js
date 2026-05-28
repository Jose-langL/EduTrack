// ==========================================
// VARIABLES GLOBALES Y ESTADO DE LA APP
// ==========================================
let estudiantes = [];
let chartInstance = null;
let estudianteEditandoId = null; // Guarda el ID si estamos editando

// Elementos del DOM
const studentsGrid = document.getElementById('students-section');
const searchInput = document.getElementById('search-input');
const filterCity = document.getElementById('filter-city');
const filterPlan = document.getElementById('filter-plan');

// Elementos del Modal y Formulario
const modalOverlay = document.getElementById('modal-overlay');
const studentForm = document.getElementById('student-form');
const modalTitle = document.getElementById('modal-title');
const btnOpenAdd = document.getElementById('btn-open-add');
const btnCancel = document.getElementById('btn-cancel');

// Elementos de KPIs
const kpiTotalCourses = document.getElementById('kpi-total-courses');
const kpiAvgProgress = document.getElementById('kpi-avg-progress');
const kpiProgressFill = document.getElementById('kpi-progress-fill');
const kpiTotalRevenue = document.getElementById('kpi-total-revenue');

// ==========================================
// 1. CARGA Y PERSISTENCIA DE DATOS (CRUD)
// ==========================================

// cargarDatos(): Leer de localStorage; si no hay datos, cargar dataset inicial y guardar
async function cargarDatos() {
    const datosLocales = localStorage.getItem('estudiantes');
    
    if (datosLocales) {
        estudiantes = JSON.parse(datosLocales);
        inicializarDashboard();
    } else {
        try {
            // Intentamos cargar el archivo estudiantes.json como dataset inicial
            const respuesta = await fetch('./assets/estudiantes.json');
            estudiantes = await respuesta.json();
            guardarDatos();
            inicializarDashboard();
        } catch (error) {
            console.error("Error cargando el dataset inicial:", error);
            estudiantes = []; // Fallback por si el fetch falla
            inicializarDashboard();
        }
    }
}

// guardarDatos(): Serializar el array a JSON y guardar en localStorage
function guardarDatos() {
    localStorage.setItem('estudiantes', JSON.stringify(estudiantes));
}

// ==========================================
// 2. RENDERIZADO DE COMPONENTES E INTERFAZ
// ==========================================

// renderizarCards(lista): Construir HTML de todas las cards y actualizar el DOM
function renderizarCards(lista) {
    studentsGrid.innerHTML = '';

    if (lista.length === 0) {
        studentsGrid.innerHTML = `<p class="no-results">No se encontraron estudiantes con los filtros seleccionados.</p>`;
        return;
    }

    lista.forEach(estudiante => {
        const card = document.createElement('article');
        card.className = 'kpi-card student-card'; // Reutiliza tus clases de CSS
        
        card.innerHTML = `
            <div class="kpi-header">
                <span class="kpi-icon-wrapper ${estudiante.activo ? 'icon-green' : 'icon-blue'}">
                    ${estudiante.activo ? '🟢' : '🔴'}
                </span>
                <div>
                    <h3 class="student-name" style="font-size: 1.1rem; font-weight: 600; margin: 0;">${estudiante.nombre}</h3>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">${estudiante.email}</p>
                </div>
            </div>
            <div class="kpi-body" style="margin-top: 1rem;">
                <p style="margin: 0.25rem 0;"><strong>📍 Ciudad:</strong> ${estudiante.ciudad}</p>
                <p style="margin: 0.25rem 0;"><strong>💻 Curso:</strong> ${estudiante.curso}</p>
                <p style="margin: 0.25rem 0;"><strong>🎟️ Plan:</strong> <span class="badge-plan">${estudiante.plan.toUpperCase()}</span></p>
                <p style="margin: 0.25rem 0;"><strong>💰 Matrícula:</strong> $${estudiante.montoUSD} USD</p>
                
                <div class="kpi-progress-wrapper" style="margin-top: 0.75rem;">
                    <p class="kpi-sub-label">Progreso: ${estudiante.progreso}%</p>
                    <div class="kpi-progress-bar">
                        <div class="kpi-progress-fill" style="width: ${estudiante.progreso}%;"></div>
                    </div>
                </div>
            </div>
            <div class="student-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button onclick="abrirModal(${estudiante.id})" class="btn" style="background: var(--bg-surface); border: 1px solid var(--border-color); padding: 0.4rem 0.8rem; font-size: 0.85rem;">✏️ Editar</button>
                <button onclick="eliminarEstudiante(${estudiante.id})" class="btn btn-cancel" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">🗑️ Eliminar</button>
            </div>
        `;
        studentsGrid.appendChild(card);
    });
}

// actualizarKPIs(): Calcula y muestra las métricas superiores en base a los datos actuales
function actualizarKPIs() {
    // 1. Cursos únicos impartidos
    const cursosUnicos = new Set(estudiantes.map(e => e.curso)).size;
    kpiTotalCourses.innerHTML = `${cursosUnicos} <span class="kpi-unit">activos</span>`;

    // 2. Progreso promedio general
    if (estudiantes.length > 0) {
        const totalProgreso = estudiantes.reduce((sum, e) => sum + Number(e.progreso), 0);
        const promedio = Math.round(totalProgreso / estudiantes.length);
        kpiAvgProgress.innerText = `${promedio}%`;
        kpiProgressFill.style.width = `${promedio}%`;
    } else {
        kpiAvgProgress.innerText = `0%`;
        kpiProgressFill.style.width = `0%`;
    }

    // 3. Ingresos totales acumulados
    const ingresosTotales = estudiantes.reduce((sum, e) => sum + Number(e.montoUSD), 0);
    kpiTotalRevenue.innerText = `$${ingresosTotales.toLocaleString()} USD`;
}

// poblarSelectorCiudades(): Llena dinámicamente el selector de filtros con las ciudades existentes
function poblarSelectorCiudades() {
    const ciudades = [...new Set(estudiantes.map(e => e.ciudad))].sort();
    // Guardamos el valor actual por si se está re-renderizando
    const valorActual = filterCity.value;
    
    filterCity.innerHTML = '<option value="">Todas las ciudades</option>';
    ciudades.forEach(ciudad => {
        const option = document.createElement('option');
        option.value = ciudad;
        option.innerText = ciudad;
        filterCity.appendChild(option);
    });

    filterCity.value = valorActual;
}

// ==========================================
// 3. FILTROS Y BÚSQUEDAS
// ==========================================

// filtrar(): Aplicar búsqueda + filtros sobre el array original y re-renderizar
function filtrar() {
    const busqueda = searchInput.value.toLowerCase().trim();
    const ciudadSeleccionada = filterCity.value;
    const planSeleccionado = filterPlan.value;

    const estudiantesFiltrados = estudiantes.filter(estudiante => {
        const coincideBusqueda = estudiante.nombre.toLowerCase().includes(busqueda) || 
                                 estudiante.email.toLowerCase().includes(busqueda);
        const coincideCiudad = ciudadSeleccionada === "" || estudiante.ciudad === ciudadSeleccionada;
        const coincidePlan = planSeleccionado === "" || estudiante.plan === planSeleccionado;

        return coincideBusqueda && coincideCiudad && coincidePlan;
    });

    renderizarCards(estudiantesFiltrados);
}

// ==========================================
// 4. MODAL Y FORMULARIO (CREAR / EDITAR)
// ==========================================

// abrirModal(id): Abrir el modal; si el id existe, precarga los datos para editar
function abrirModal(id = null) {
    modalOverlay.classList.add('active'); // Muestra el modal asignando clase activa
    studentForm.reset(); // Limpia campos previos

    if (id !== null) {
        // Modo Edición
        estudianteEditandoId = id;
        modalTitle.innerText = "Editar Estudiante";
        
        const estudiante = estudiantes.find(e => e.id === id);
        if (estudiante) {
            document.getElementById('form-name').value = estudiante.nombre;
            document.getElementById('form-email').value = estudiante.email;
            document.getElementById('form-city').value = estudiante.ciudad;
            document.getElementById('form-course').value = estudiante.curso;
            document.getElementById('form-progress').value = estudiante.progreso;
            document.getElementById('form-plan').value = estudiante.plan;
            document.getElementById('form-amount').value = estudiante.montoUSD;
        }
    } else {
        // Modo Registro Nuevo
        estudianteEditandoId = null;
        modalTitle.innerText = "Registrar Estudiante";
    }
}

function cerrarModal() {
    modalOverlay.classList.remove('active');
    studentForm.reset();
    estudianteEditandoId = null;
}

// guardarEstudiante(): Validar formulario, agregar o actualizar en el array y guardar
// Busca esta función en tu ./js/main.js y actualízala así:
function guardarEstudiante(e) {
    e.preventDefault();

    // 1. Capturamos los datos en un objeto limpio
    const datosEstudiante = {
        nombre: document.getElementById('form-name').value.trim(),
        email: document.getElementById('form-email').value.trim(),
        ciudad: document.getElementById('form-city').value,
        curso: document.getElementById('form-course').value.trim(),
        progreso: document.getElementById('form-progress').value,
        plan: document.getElementById('form-plan').value,
        montoUSD: document.getElementById('form-amount').value
    };

    // 2. Usamos nuestro validador externo
    const validacion = Validator.validarFormulario(datosEstudiante);

    // 3. Si hay errores, los mostramos y detenemos la ejecución
    if (!validacion.esValido) {
        // Unimos todos los mensajes de error con un salto de línea
        alert("⚠️ No se pudo guardar el registro:\n\n" + validacion.errores.join("\n"));
        return; // Detiene la función para que no guarde nada roto
    }

    // 4. Si pasa la validación, procesamos los datos finales
    const progresoNumerico = parseInt(datosEstudiante.progreso);
    const montoNumerico = parseFloat(datosEstudiante.montoUSD);

    if (estudianteEditandoId !== null) {
        // --- MODIFICAR ESTUDIANTE EXISTENTE ---
        estudiantes = estudiantes.map(est => {
            if (est.id === estudianteEditandoId) {
                return {
                    ...est,
                    nombre: datosEstudiante.nombre,
                    email: datosEstudiante.email,
                    ciudad: datosEstudiante.ciudad,
                    curso: datosEstudiante.curso,
                    progreso: progresoNumerico,
                    plan: datosEstudiante.plan,
                    montoUSD: montoNumerico
                };
            }
            return est;
        });
    } else {
        // --- REGISTRAR NUEVO ESTUDIANTE ---
        const nuevoEstudiante = {
            id: estudiantes.length > 0 ? Math.max(...estudiantes.map(e => e.id)) + 1 : 1,
            nombre: datosEstudiante.nombre,
            email: datosEstudiante.email,
            ciudad: datosEstudiante.ciudad,
            curso: datosEstudiante.curso,
            progreso: progresoNumerico,
            plan: datosEstudiante.plan,
            montoUSD: montoNumerico,
            activo: progresoNumerico < 100
        };
        estudiantes.push(nuevoEstudiante);
    }

    guardarDatos();
    cerrarModal();
    
    // Refrescar interfaz
    poblarSelectorCiudades();
    actualizarKPIs();
    filtrar();
    actualizarGrafico();
}
// ==========================================
// 5. ELIMINACIÓN DE REGISTROS
// ==========================================

// eliminarEstudiante(id): Eliminar del array, guardar y re-renderizar
function eliminarEstudiante(id) {
    if (confirm("¿Estás seguro de que deseas eliminar este estudiante?")) {
        estudiantes = estudiantes.filter(e => e.id !== id);
        
        guardarDatos();
        poblarSelectorCiudades();
        actualizarKPIs();
        filtrar();
        actualizarGrafico();
    }
}

// ==========================================
// 6. ANALÍTICA Y GRÁFICOS (CHART.JS)
// ==========================================

// actualizarGrafico(): Recalcular conteo por ciudad y actualizar Chart.js
function actualizarGrafico() {
    const ctx = document.getElementById('analyticsChart').getContext('2d');

    // 1. Recalcular las frecuencias de cada ciudad
    const conteoCiudades = {};
    estudiantes.forEach(est => {
        conteoCiudades[est.ciudad] = (conteoCiudades[est.ciudad] || 0) + 1;
    });

    const ciudadesLabels = Object.keys(conteoCiudades);
    const dataValores = Object.values(conteoCiudades);

    // 2. Si ya existe un gráfico previo, lo destruimos para evitar duplicaciones/glitches visuales
    if (chartInstance) {
        chartInstance.destroy();
    }

    // 3. Instanciar el nuevo gráfico
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ciudadesLabels,
            datasets: [{
                label: 'Número de Estudiantes',
                data: dataValores,
                backgroundColor: 'rgba(79, 70, 229, 0.6)', // Color índigo elegante adaptado
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// ==========================================
// INITIALIZACIÓN GENERAL
// ==========================================
function inicializarDashboard() {
    poblarSelectorCiudades();
    actualizarKPIs();
    renderizarCards(estudiantes);
    actualizarGrafico();
}

// Event Listeners de Controles e Interacciones
btnOpenAdd.addEventListener('click', () => abrirModal());
btnCancel.addEventListener('click', cerrarModal);
studentForm.addEventListener('submit', guardarEstudiante);

searchInput.addEventListener('input', filtrar);
filterCity.addEventListener('change', filtrar);
filterPlan.addEventListener('change', filtrar);

// Inicializar la aplicación al cargar la ventana
window.addEventListener('DOMContentLoaded', cargarDatos);