document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.getElementById('form-login');

    if (formLogin) {
        formLogin.addEventListener('submit', async (evento) => {
            evento.preventDefault(); // Evita que la página se recargue en blanco

            // Capturamos los datos que escribió el usuario
            const email = document.getElementById('email').value;
            const password = document.getElementById('input-pass').value;

            try {
                // Le pegamos al backend de tu compañero
                const respuesta = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: password })
                });

                const datos = await respuesta.json();

                if (respuesta.ok) {
                    // Si el login es correcto, guardamos el Token y el Nombre en la memoria
                    localStorage.setItem('tokenSeguridad', datos.token); 
                    localStorage.setItem('usuarioNombre', datos.usuario.nombre);
                    
                    // ¡Y TE TELETRANSPORTAMOS AL CATÁLOGO!
                    window.location.href = 'catalogo.html';
                } else {
                    alert("Error al iniciar sesión: " + (datos.error || datos.message));
                }
            } catch (error) {
                console.error("Error de red:", error);
                alert("No se pudo conectar con el servidor de Node.js");
            }
        });
    }
});