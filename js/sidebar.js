/**
 * ==========================================================================
 * NAVIGATION CONTROLLER - EDUTRACK
 * Manejo del comportamiento interactivo y accesibilidad del Sidebar
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializamos el comportamiento pasándole los IDs correspondientes
    initSidebarToggle('menu-toggle', 'sidebar');
});

/**
 * Inicializa los escuchadores de eventos para el menú lateral responsivo.
 * @param {string} triggerId - ID del botón hamburguesa móvil.
 * @param {string} sidebarId - ID del panel lateral de navegación.
 */
function initSidebarToggle(triggerId, sidebarId) {
    const trigger = document.getElementById(triggerId);
    const sidebar = document.getElementById(sidebarId);

    // 1. CLAUSULA DE GUARDA (Data Integrity)
    // Evita que el código lance un error fatal si el script se carga en una página sin sidebar (como index.html)
    if (!trigger || !sidebar) {
        return; 
    }

    // Buscamos el nodo interno del icono si existe, de lo contrario usamos el botón mismo
    const iconNode = trigger.querySelector('.hamburger-icon') || trigger;

    // 2. ESCUCHADOR PRINCIPAL: Click en botón hamburguesa
    trigger.addEventListener('click', (event) => {
        // Evitamos que el click se propague inmediatamente al documento
        event.stopPropagation();
        
        const isCurrentlyActive = sidebar.classList.contains('active');
        
        if (isCurrentlyActive) {
            closeSidebar(sidebar, trigger, iconNode);
        } else {
            openSidebar(sidebar, trigger, iconNode);
        }
    });

    // 3. EVENTO DE DESENFOQUE: Cierre al hacer click afuera
    document.addEventListener('click', (event) => {
        // Si el menú está abierto y el usuario hace click fuera del sidebar y del botón trigger, lo cerramos
        if (sidebar.classList.contains('active') && !sidebar.contains(event.target) && !trigger.contains(event.target)) {
            closeSidebar(sidebar, trigger, iconNode);
        }
    });

    // 4. ACCESIBILIDAD POR TECLADO (A11y): Soporte para la tecla Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && sidebar.classList.contains('active')) {
            closeSidebar(sidebar, trigger, iconNode);
        }
    });
}

/**
 * Abre el menú lateral y actualiza los atributos de accesibilidad en el DOM.
 */
function openSidebar(sidebar, trigger, iconNode) {
    sidebar.classList.add('active');
    trigger.setAttribute('aria-expanded', 'true');
    // Cambiamos el icono de la hamburguesa (☰) por una equis (✕) de cierre en UTF-8
    iconNode.innerHTML = '&#10005;'; 
}

/**
 * Cierra el menú lateral y restaura los estados iniciales de accesibilidad.
 */
function closeSidebar(sidebar, trigger, iconNode) {
    sidebar.classList.remove('active');
    trigger.setAttribute('aria-expanded', 'false');
    // Restauramos el icono clásico de hamburguesa (☰)
    iconNode.innerHTML = '&#9776;'; 
}