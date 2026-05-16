document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Buscamos todos los botones de "Agregar al carrito" en tu HTML
    const botonesAgregar = document.querySelectorAll('.btn-agregar-pedido');

    botonesAgregar.forEach(boton => {
        boton.addEventListener('click', (evento) => {
            evento.preventDefault(); // Evita que la página salte
            
            // 2. Buscamos la tarjeta "padre" del botón que tocaste
            const tarjeta = boton.closest('.tarjeta-v2');
            
            // 3. Extraemos los textos y la imagen directamente de tu diseño HTML
            const nombre = tarjeta.querySelector('h3').innerText;
            const imagen = tarjeta.querySelector('img').src;
            
            // Limpiamos el precio (le sacamos el símbolo $ y los puntos para poder sumar matemáticamente)
            let precioTexto = tarjeta.querySelector('.price').innerText;
            let precioNum = parseInt(precioTexto.replace('$', '').replace('.', ''));
            
            // Generamos un código SKU falso basado en el nombre para el MVP
            const sku = "SKU-" + nombre.substring(0,4).toUpperCase();

            // 4. LA LÓGICA RECUPERADA: Leemos la memoria y agregamos el producto
            let carrito = JSON.parse(localStorage.getItem('carritoObraMaestra')) || [];
            
            let index = carrito.findIndex(item => item.sku === sku);
            if (index !== -1) {
                carrito[index].cantidad += 1; // Si ya estaba, suma 1
            } else {
                carrito.push({ sku: sku, nombre: nombre, precio: precioNum, imagen: imagen, cantidad: 1 });
            }
            
            // Guardamos todo de vuelta en la memoria
            localStorage.setItem('carritoObraMaestra', JSON.stringify(carrito));
            
            // 5. Adiós al alert, hola al contador dinámico:
            if (typeof window.actualizarContadorCarrito === 'function') {
                window.actualizarContadorCarrito();
            }
            
            // 6. (Opcional visual) Cambiamos el texto del botón por 1 segundo para dar feedback
            const textoOriginal = boton.innerHTML;
            boton.innerHTML = '<i class="fa-solid fa-check"></i> ¡Agregado!';
            boton.style.backgroundColor = '#eec072'; /* Verde éxito */
            
            setTimeout(() => {
                boton.innerHTML = textoOriginal;
                boton.style.backgroundColor = ''; /* Vuelve al naranja original */
            }, 1000);
            
        });
    });
});