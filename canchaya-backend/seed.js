// seed.js
const API_URL = "http://localhost:3000/api";

// 💡 PON AQUÍ LOS MISMOS DATOS CON LOS QUE TE REGISTRASTE EN EL FRONTEND:
const MI_CORREO_ACTUAL = "admin@canchaya.com"; 
const MI_CLAVE_ACTUAL = "123456"; // Pon tu contraseña real aquí

const reservasSimuladas = [
    { cancha_id: 1, fecha_reserva: "2026-07-06", hora_inicio: "18:00", hora_fin: "19:00", total_pago: 60 },
    { cancha_id: 1, fecha_reserva: "2026-07-06", hora_inicio: "19:00", hora_fin: "20:00", total_pago: 60 },
    { cancha_id: 2, fecha_reserva: "2026-07-07", hora_inicio: "08:00", hora_fin: "09:00", total_pago: 40 },
    { cancha_id: 1, fecha_reserva: "2026-07-07", hora_inicio: "20:00", hora_fin: "21:00", total_pago: 60 },
    { cancha_id: 2, fecha_reserva: "2026-07-07", hora_inicio: "19:00", hora_fin: "20:00", total_pago: 40 },
    { cancha_id: 1, fecha_reserva: "2026-07-08", hora_inicio: "14:00", hora_fin: "15:00", total_pago: 60 },
    { cancha_id: 2, fecha_reserva: "2026-07-08", hora_inicio: "18:00", hora_fin: "19:00", total_pago: 40 },
    { cancha_id: 1, fecha_reserva: "2026-07-08", hora_inicio: "21:00", hora_fin: "22:00", total_pago: 60 },
    { cancha_id: 2, fecha_reserva: "2026-07-09", hora_inicio: "20:00", hora_fin: "21:00", total_pago: 40 },
    { cancha_id: 1, fecha_reserva: "2026-07-09", hora_inicio: "19:00", hora_fin: "20:00", total_pago: 60 }
];

async function poblarConMiUsuario() {
    console.log("🚀 Vinculando y subiendo datos de prueba a tu cuenta...");

    // Iniciamos sesión con tus credenciales reales para obtener tu token auténtico
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: MI_CORREO_ACTUAL, password: MI_CLAVE_ACTUAL })
    });
    
    const loginData = await loginRes.json();
    const token = loginData.token;

    if (!token) {
        console.error("❌ Error de autenticación. Revisa que el correo y contraseña en este archivo coincidan con tu cuenta del frontend.");
        return;
    }

    let insertadas = 0;
    for (const res of reservasSimuladas) {
        const respuesta = await fetch(`${API_URL}/reservas`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(res)
        });
        if (respuesta.ok) insertadas++;
    }

    console.log(`\n✅ ¡Éxito rotundo! Se inyectaron ${insertadas} reservas directamente en tu cuenta.`);
    console.log("Refresca tu frontend y abre el panel para ver la magia.");
}

poblarConMiUsuario();