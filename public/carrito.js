document.addEventListener("DOMContentLoaded", () => {
    renderizarCarrito();
});

function renderizarCarrito() {
    const listaItems = document.querySelector('.lista-items-carrito');
    const resumenFinal = document.querySelector('.resumen-final-carrito');
    
    // Leemos la memoria
    let carrito = JSON.parse(localStorage.getItem('carritoObraMaestra')) || [];

   // Si el carrito está vacío, ocultamos el botón de pago y mostramos tu diseño
    if (carrito.length === 0) {
        listaItems.innerHTML = `
            <div class="estado-vacio">
                <div class="icono-vacio">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart-icon lucide-shopping-cart"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                </div>
                <h2>Tu pedido está vacío</h2>
                <p>Explora nuestro catálogo para armar tu cotización mayorista.</p>
                <a href="catalogo.html" class="btn-ver-catalogo">Ver Catálogo</a>
            </div>
        `;
        resumenFinal.style.display = 'none'; // Oculta la barra de pagar
        return;
    }

    // Si hay productos, mostramos el botón de pago y vaciamos el contenedor para redibujar
    resumenFinal.style.display = 'flex';
    listaItems.innerHTML = '';
    let totalPrecio = 0;

    // Recorremos cada producto guardado y lo dibujamos
    carrito.forEach(item => {
        let subtotal = item.precio * item.cantidad;
        totalPrecio += subtotal;

        listaItems.innerHTML += `
            <div class="item-fila" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #222; padding-bottom: 15px; margin-bottom: 15px;">
                <div class="item-info" style="display: flex; align-items: center; gap: 15px;">
                    <img src="${item.imagen}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px;" alt="img">
                    <div>
                        <h4 style="margin: 0; font-size: 1.1rem; color: #fff;">${item.nombre}</h4>
                        <span style="color: #888; font-size: 0.9rem;">SKU: ${item.sku}</span>
                    </div>
                </div>
                
                <div class="item-controles" style="display: flex; align-items: center; gap: 20px;">
                    <div class="precio-unitario" style="color: #ccc;">$${Number(item.precio).toLocaleString('es-AR')}</div>
                    
                    <div style="display:flex; align-items:center; gap:10px;">
                        <button onclick="cambiarCantidad('${item.sku}', -1)" style="padding: 5px 10px; background:#333; color:#fff; border:none; border-radius:4px; cursor:pointer;">-</button>
                        <span style="color:#fff; font-weight:bold; width: 20px; text-align:center;">${item.cantidad}</span>
                        <button onclick="cambiarCantidad('${item.sku}', 1)" style="padding: 5px 10px; background:#333; color:#fff; border:none; border-radius:4px; cursor:pointer;">+</button>
                    </div>

                    <div class="subtotal-item" style="color: #f59e0b; font-weight: bold; width: 100px; text-align:right;">$${Number(subtotal).toLocaleString('es-AR')}</div>
                    
                    <button onclick="eliminarDelCarrito('${item.sku}')" style="background: none; border: none; color: #ff4444; cursor: pointer; font-size: 1.2rem;"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `;
    });

    // Actualizamos el total a pagar en el HTML
    document.querySelector('.texto-total').innerHTML = `
        <span style="color: #888; font-size: 1.1rem; display: block;">Total Estimado (Sin envío)</span>
        <span style="font-size: 1.8rem; font-weight: 900; color: #fff;">$${Number(totalPrecio).toLocaleString('es-AR')}</span>
    `;
}

// Función para sumar o restar
window.cambiarCantidad = function(sku, cambio) {
    let carrito = JSON.parse(localStorage.getItem('carritoObraMaestra')) || [];
    let index = carrito.findIndex(item => item.sku === sku);
    
    if (index !== -1) {
        carrito[index].cantidad += cambio;
        
        // Si la cantidad llega a 0, lo eliminamos
        if (carrito[index].cantidad <= 0) {
            carrito.splice(index, 1);
        }
        
        localStorage.setItem('carritoObraMaestra', JSON.stringify(carrito));
        renderizarCarrito(); // Recargamos la vista
    }
}

// Función para el botón de basura
window.eliminarDelCarrito = function(sku) {
    let carrito = JSON.parse(localStorage.getItem('carritoObraMaestra')) || [];
    carrito = carrito.filter(item => item.sku !== sku);
    localStorage.setItem('carritoObraMaestra', JSON.stringify(carrito));
    renderizarCarrito(); // Recargamos la vista
}