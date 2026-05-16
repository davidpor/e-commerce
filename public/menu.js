// 1. Capturamos todos los elementos de tu HTML
const btnHamburguesa = document.getElementById('btn-hamburguesa');
const navPrincipal = document.querySelector('.nav-principal'); // Asegurate de que tu <nav> tenga esta clase
const iconoBarras = document.querySelector('.icono-barras');
const iconoX = document.querySelector('.icono-x');

// 2. Le decimos al botón que escuche los clicks
btnHamburguesa.addEventListener('click', () => {
    
    // 3. Activamos o desactivamos la animación de tu CSS
    navPrincipal.classList.toggle('activo');
    
    // 4. Lógica para cambiar el dibujito (Barritas vs 'X')
    if (navPrincipal.classList.contains('activo')) {
        // Si el menú está abierto: Oculto barritas, muestro X
        iconoBarras.style.display = 'none';
        iconoX.style.display = 'block';
    } else {
        // Si el menú está cerrado: Muestro barritas, oculto X
        iconoBarras.style.display = 'block';
        iconoX.style.display = 'none';
    }
});

// Esperamos a que la página cargue completamente
document.addEventListener("DOMContentLoaded", () => {
    
    // Buscamos el botón y el texto en el HTML
    const btnPerfil = document.getElementById('btn-perfil');
    const textoPerfil = document.getElementById('texto-perfil');

    if(btnPerfil && textoPerfil) {
        // Le preguntamos al navegador si hay un usuario guardado
        const usuarioLogueado = localStorage.getItem('usuarioNombre');

        if (usuarioLogueado) {
            // SI ESTÁ LOGUEADO:
            // 1. Cambiamos el texto
            textoPerfil.textContent = "Hola, " + usuarioLogueado;
            
            // 2. Cambiamos a dónde te lleva el clic
            btnPerfil.addEventListener('click', () => {
                window.location.href = 'mi-perfil.html';
            });
        } else {
            // SI NO ESTÁ LOGUEADO (Visitante normal):
            // 1. Queda como "Ingresar"
            textoPerfil.textContent = "Ingresar";
            
            // 2. Lo mandamos al login
            btnPerfil.addEventListener('click', () => {
                window.location.href = 'login.html';
            });
        }
    }
});


// Función global para actualizar el numerito del carrito en todas las páginas
window.actualizarContadorCarrito = function() {
    const contador = document.getElementById('contador-carrito');
    if (!contador) return;

    let carrito = JSON.parse(localStorage.getItem('carritoObraMaestra')) || [];
    
    // Sumamos la cantidad de todos los productos
    let cantidadTotal = carrito.reduce((total, item) => total + item.cantidad, 0);

    if (cantidadTotal > 0) {
        contador.textContent = cantidadTotal;
        contador.style.display = 'flex'; // Lo hacemos visible
    } else {
        contador.style.display = 'none'; // Lo ocultamos si está vacío
    }
}

// Ejecutamos la función apenas carga cualquier página
document.addEventListener("DOMContentLoaded", () => {
    actualizarContadorCarrito();
});