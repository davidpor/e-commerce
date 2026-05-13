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