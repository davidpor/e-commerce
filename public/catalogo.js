// 1. REEMPLAZÁ ESTA URL por la que encuentres en el código de Node.js
const URL_API = 'http://localhost:3000/api/products'; 

const contenedor = document.querySelector('.grilla-4cols');

async function cargarProductos() {
    try {
        const respuesta = await fetch(URL_API);
        const productos = await respuesta.json();
        
        contenedor.innerHTML = ''; // Limpiamos el HTML vacío

        productos.forEach(prod => {
            
            // Como vimos que NO hay columna de imagen en la BD, usamos un placeholder si viene vacía
            const imagenSegura = prod.imagen ? prod.imagen : 'https://via.placeholder.com/300x300/222222/ff9900?text=Sin+Imagen';
            
            // Formateamos el precio para que se vea lindo (ej: 1.500,00)
            const precioFormateado = Number(prod.precio_lista).toLocaleString('es-AR');
            
            // Si la descripción es nula en la BD, le ponemos un texto por defecto
            const descripcionSegura = prod.descripcion ? prod.descripcion : 'Sin descripción disponible.';
            const marcaSegura = prod.marca ? prod.marca : 'Genérico';

            const tarjetaHTML = `
                <div class="tarjeta-v2">
                    <div class="t-img-box">
                        <span class="category-pildora">${marcaSegura}</span>
                        <img src="${imagenSegura}" alt="${prod.nombre}">
                        <button class="fav-heart"><i class="fa-regular fa-heart"></i></button>
                    </div>
                    
                    <div class="t-content-box">
                        <div class="t-head">
                            <h3>${prod.nombre}</h3>
                            <div class="price">$${precioFormateado}</div>
                        </div>
                        
                        <p class="t-desc">${descripcionSegura}</p>
                        
                        <ul class="t-specs">
                            <li><span class="dot-naranja"></span> SKU: ${prod.sku}</li>
                            <li><span class="dot-naranja"></span> Stock: ${prod.stock_actual}</li>
                        </ul>
                        
                        <button class="btn-agregar-pedido">Agregar al carrito</button>
                    </div>
                </div>
            `;
            
            contenedor.innerHTML += tarjetaHTML;
        });

    } catch (error) {
        console.error("Error conectando a la API:", error);
        contenedor.innerHTML = `<p style="color:red; grid-column: 1/-1; text-align:center;">
            No se pudo conectar con el servidor. ¿Asegurate de que Node.js esté corriendo?
        </p>`;
    }
}

// Ejecutamos la función
cargarProductos();