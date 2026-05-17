const generar = async () => {
    try {
        // Buscamos qué librería instaló tu compañero (bcrypt o bcryptjs)
        let motor;
        try {
            motor = require('bcrypt');
        } catch (e) {
            motor = require('bcryptjs');
        }

        // Generamos el hash con fuerza estándar (10)
        const hashPerfecto = await motor.hash('123456', 10);
        
        console.log("\n=================================================");
        console.log("🔑 ESTE ES TU HASH 100% COMPATIBLE:");
        console.log(hashPerfecto);
        console.log("=================================================\n");
        
    } catch (error) {
        console.log("Error al generar:", error);
    }
};

generar();