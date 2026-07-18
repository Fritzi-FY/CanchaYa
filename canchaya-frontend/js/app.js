const { useState, useEffect, useRef } = React;

function App() {
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [usuarioRol, setUsuarioRol] = useState(localStorage.getItem("rol") || "CLIENTE");
    const [vista, setVista] = useState(token ? "reservas" : "login"); // 'login', 'registro', 'reservas'
    const [subVistaAdmin, setSubVistaAdmin] = useState(false);

    // Auth forms
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nombre, setNombre] = useState("");

    // Catalog & Filters
    const [canchas, setCanchas] = useState([]);
    const [canchaId, setCanchaId] = useState("");
    const [deporteFiltro, setDeporteFiltro] = useState("TODOS");
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    
    // Reservations state
    const [misReservas, setMisReservas] = useState([]);
    const [todasLasReservas, setTodasLasReservas] = useState([]);
    const [notificaciones, setNotificaciones] = useState([]);

    // Checkout modal
    const [mostrarPasarela, setMostrarPasarela] = useState(false);
    const [slotParaReservar, setSlotParaReservar] = useState(null);
    const [tiempoRestante, setTiempoRestante] = useState(300);
    const [procesandoPago, setProcesandoPago] = useState(false);

    // Cancellation modal
    const [mostrarConfirmarCancelacion, setMostrarConfirmarCancelacion] = useState(false);
    const [reservaParaCancelar, setReservaParaCancelar] = useState(null);
    const [cancellationOutcomes, setCancellationOutcomes] = useState({ reembolso: 0, penalidad: 0 });

    // Admin Dashboard states
    const [fechaInicioReporte, setFechaInicioReporte] = useState("");
    const [fechaFinReporte, setFechaFinReporte] = useState("");
    const [reportData, setReportData] = useState({
        reservas: [],
        auditorias: [],
        resumen: { ingresosTotales: 0, perdidasReembolsos: 0, penalidadesCobradas: 0, conteoReservas: 0 }
    });

    // Admin Court Management
    const [nombreCancha, setNombreCancha] = useState("");
    const [sueloCancha, setSueloCancha] = useState("GRASS");
    const [precioCancha, setPrecioCancha] = useState(50);
    const [deporteCancha, setDeporteCancha] = useState("FÚTBOL");
    const [editandoCanchaId, setEditandoCanchaId] = useState(null);

    // Chart References
    const chartBarrasRef = useRef(null);
    const chartLineasRef = useRef(null);
    const instanciasCharts = useRef({ barras: null, lineas: null });

    // Run when core parameters change
    useEffect(() => {
        if (token) {
            cargarCanchas();
            cargarMisReservas();
            cargarOcupacionCalendario();
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            cargarOcupacionCalendario();
        }
    }, [fecha, canchaId]);

    // Timer for Checkout
    useEffect(() => {
        if (!mostrarPasarela) return;
        if (tiempoRestante <= 0) {
            setMostrarPasarela(false);
            setSlotParaReservar(null);
            agregarNotificacion("Tiempo de pago expirado. El slot fue liberado.", "error");
            return;
        }
        const timer = setInterval(() => setTiempoRestante(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [tiempoRestante, mostrarPasarela]);

    // Rebuild admin charts on report update
    useEffect(() => {
        if (subVistaAdmin && reportData.reservas.length >= 0) {
            construirGraficos();
        }
    }, [subVistaAdmin, reportData]);

    const agregarNotificacion = (texto, tipo = "success") => {
        const id = Date.now();
        setNotificaciones(prev => [...prev, { id, texto, tipo }]);
        setTimeout(() => {
            setNotificaciones(prev => prev.filter(n => n.id !== id));
        }, 4500);
    };

    // --- API Calls ---

    const cargarCanchas = async () => {
        try {
            const data = await apiFetch('/canchas');
            setCanchas(data);
            if (data.length > 0 && !canchaId) {
                setCanchaId(data[0].id.toString());
            }
        } catch (err) {
            console.error(err);
            agregarNotificacion("Error al cargar el catálogo de canchas.", "error");
        }
    };

    const cargarMisReservas = async () => {
        try {
            const data = await apiFetch('/reservas/me');
            setMisReservas(data);
        } catch (err) { console.error(err); }
    };

    const cargarOcupacionCalendario = async () => {
        try {
            const data = await apiFetch('/reservas');
            setTodasLasReservas(data);
        } catch (err) { console.error(err); }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const data = await apiFetch('/auth/login', {
                method: "POST",
                body: JSON.stringify({ email, password })
            });
            localStorage.setItem("token", data.token);
            localStorage.setItem("rol", data.usuario.rol);

            setToken(data.token);
            setUsuarioRol(data.usuario.rol);
            setVista("reservas");
            agregarNotificacion("¡Sesión iniciada con éxito!", "success");
        } catch (err) {
            agregarNotificacion(err.message || "Credenciales incorrectas", "error");
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await apiFetch('/auth/register', {
                method: "POST",
                body: JSON.stringify({ nombre, email, password })
            });
            setVista("login");
            agregarNotificacion("¡Registro exitoso! Ya puedes iniciar sesión.", "success");
        } catch (err) {
            agregarNotificacion(err.message || "Error en el registro", "error");
        }
    };

    const iniciarFlujoPago = (horaSlot) => {
        const cancha = canchas.find(c => c.id.toString() === canchaId);
        if (!cancha) return;
        
        const costo = Number(cancha.precio_hora);
        const horaFin = `${String(parseInt(horaSlot) + 1).padStart(2, '0')}:00`;
        
        setSlotParaReservar({ horaInicio: `${horaSlot}:00`, horaFin: `${horaFin}:00`, total: costo });
        setTiempoRestante(300);
        setMostrarPasarela(true);
    };

    const ejecutarPagoYReserva = async (e) => {
        e.preventDefault();
        setProcesandoPago(true);
        try {
            await apiFetch('/reservas', {
                method: "POST",
                body: JSON.stringify({
                    cancha_id: parseInt(canchaId),
                    fecha_reserva: fecha,
                    hora_inicio: slotParaReservar.horaInicio,
                    hora_fin: slotParaReservar.horaFin
                })
            });
            setMostrarPasarela(false);
            setSlotParaReservar(null);
            cargarMisReservas();
            cargarOcupacionCalendario();
            agregarNotificacion("💳 Pago aprobado. ¡Cancha reservada con éxito!", "success");
        } catch (err) {
            agregarNotificacion(err.message || "Error al registrar la reserva", "error");
        } finally {
            setProcesandoPago(false);
        }
    };

    const precalcularCancelacion = (reserva) => {
        const totalPago = Number(reserva.total_pago);
        const fechaReserva = reserva.fecha_reserva;
        const horaInicio = reserva.hora_inicio;

        const fechaReservaStart = new Date(`${fechaReserva}T${horaInicio}`);
        const ahora = new Date();
        const diffMs = fechaReservaStart.getTime() - ahora.getTime();
        const diffHoras = diffMs / (1000 * 60 * 60);

        let reembolso = 0;
        let penalidad = 0;

        if (diffHoras >= 24) {
            reembolso = totalPago;
            penalidad = 0;
        } else if (diffHoras >= 2) {
            reembolso = Number((totalPago * 0.5).toFixed(2));
            penalidad = Number((totalPago * 0.5).toFixed(2));
        } else {
            reembolso = 0;
            penalidad = totalPago;
        }

        setCancellationOutcomes({ reembolso, penalidad });
        setReservaParaCancelar(reserva);
        setMostrarConfirmarCancelacion(true);
    };

    const ejecutarCancelacion = async () => {
        try {
            await apiFetch(`/reservas/${reservaParaCancelar.id}/cancelar`, {
                method: 'PUT'
            });
            setMostrarConfirmarCancelacion(false);
            setReservaParaCancelar(null);
            cargarMisReservas();
            cargarOcupacionCalendario();
            if (subVistaAdmin) {
                cargarReportes();
            }
            agregarNotificacion("Reserva cancelada correctamente.", "success");
        } catch (err) {
            agregarNotificacion(err.message || "Error al cancelar la reserva", "error");
        }
    };

    // --- Admin CRUD Canchas ---

    const guardarCancha = async (e) => {
        e.preventDefault();
        try {
            const body = {
                nombre: nombreCancha,
                tipo_suelo: sueloCancha,
                precio_hora: Number(precioCancha),
                deporte: deporteCancha
            };

            if (editandoCanchaId) {
                await apiFetch(`/canchas/${editandoCanchaId}`, {
                    method: 'PUT',
                    body: JSON.stringify(body)
                });
                agregarNotificacion("Cancha actualizada con éxito.");
            } else {
                await apiFetch('/canchas', {
                    method: 'POST',
                    body: JSON.stringify(body)
                });
                agregarNotificacion("Nueva cancha creada.");
            }

            // Reset form
            setNombreCancha("");
            setPrecioCancha(50);
            setEditandoCanchaId(null);
            cargarCanchas();
        } catch (err) {
            agregarNotificacion(err.message || "Error al guardar cancha.", "error");
        }
    };

    const iniciarEdicionCancha = (cancha) => {
        setEditandoCanchaId(cancha.id);
        setNombreCancha(cancha.nombre);
        setSueloCancha(cancha.tipo_suelo);
        setPrecioCancha(cancha.precio_hora);
        setDeporteCancha(cancha.deporte);
    };

    const deactivarCancha = async (id) => {
        if (!confirm("¿Seguro que deseas desactivar esta cancha? Esto no borrará el histórico de reservas pero evitará nuevas solicitudes.")) return;
        try {
            await apiFetch(`/canchas/${id}`, {
                method: 'DELETE'
            });
            agregarNotificacion("Cancha desactivada correctamente.");
            cargarCanchas();
        } catch (err) {
            agregarNotificacion(err.message || "Error al desactivar cancha.", "error");
        }
    };

    // --- Admin Dashboard Reports ---

    const cargarReportes = async () => {
        try {
            let path = '/reservas/reportes';
            if (fechaInicioReporte && fechaFinReporte) {
                path += `?fecha_inicio=${fechaInicioReporte}&fecha_fin=${fechaFinReporte}`;
            }
            const data = await apiFetch(path);
            setReportData(data);
        } catch (err) {
            agregarNotificacion("Error al obtener reportes administrativos.", "error");
        }
    };

    // Watch view toggle to query reports
    useEffect(() => {
        if (subVistaAdmin) {
            cargarReportes();
        }
    }, [subVistaAdmin, fechaInicioReporte, fechaFinReporte]);

    // Check if slots are booked
    const comprobarHoraOcupada = (hora) => {
        const ocupadasFiltradas = todasLasReservas.filter(r =>
            r.cancha_id === parseInt(canchaId) && r.fecha_reserva === fecha && r.estado !== "CANCELADO"
        );
        return ocupadasFiltradas.some(r => {
            const inicio = r.hora_inicio.substring(0, 5);
            const fin = r.hora_fin.substring(0, 5);
            return hora >= inicio && hora < fin;
        });
    };

    const construirGraficos = () => {
        if (instanciasCharts.current.barras) instanciasCharts.current.barras.destroy();
        if (instanciasCharts.current.lineas) instanciasCharts.current.lineas.destroy();

        // Calculate chart values based on loaded report data
        const ingresosCanchas = {};
        const conteoHoras = {};

        HORAS_OPERATIVAS.forEach(h => conteoHoras[h] = 0);

        reportData.reservas.forEach(r => {
            const nombreCancha = r.Cancha?.nombre || `Cancha #${r.cancha_id}`;
            if (r.estado === "APROBADO") {
                ingresosCanchas[nombreCancha] = (ingresosCanchas[nombreCancha] || 0) + parseFloat(r.total_pago);
            }
            if (r.estado !== "CANCELADO") {
                const ini = r.hora_inicio.substring(0, 5);
                if (conteoHoras[ini] !== undefined) conteoHoras[ini]++;
            }
        });

        if (chartBarrasRef.current) {
            instanciasCharts.current.barras = new Chart(chartBarrasRef.current, {
                type: 'bar',
                data: {
                    labels: Object.keys(ingresosCanchas),
                    datasets: [{
                        label: 'Ingresos por Cancha (S/.)',
                        data: Object.values(ingresosCanchas),
                        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'],
                        borderRadius: 6
                    }]
                },
                options: { responsive: true, plugins: { legend: { display: false } } }
            });
        }

        if (chartLineasRef.current) {
            instanciasCharts.current.lineas = new Chart(chartLineasRef.current, {
                type: 'line',
                data: {
                    labels: Object.keys(conteoHoras),
                    datasets: [{
                        label: 'Densidad de Reservas',
                        data: Object.values(conteoHoras),
                        borderColor: '#f97316',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: { responsive: true }
            });
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        setToken("");
        setUsuarioRol("CLIENTE");
        setVista("login");
        setSubVistaAdmin(false);
        agregarNotificacion("Sesión cerrada.", "info");
    };

    // Filter courts by sport type
    const canchasFiltradas = canchas.filter(c => deporteFiltro === "TODOS" || c.deporte === deporteFiltro);

    return (
        <div className="min-h-screen flex flex-col justify-between">
            {/* Cabecera Premium */}
            <header className="bg-gradient-to-r from-green-800 to-emerald-950 text-white shadow-xl py-4 px-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">⚽</span>
                    <h1 className="text-2xl font-black tracking-wide font-mono">CanchaYA</h1>
                </div>
                {token && (
                    <div className="flex items-center gap-4">
                        {usuarioRol === "ADMIN" && (
                            <button onClick={() => setSubVistaAdmin(!subVistaAdmin)} 
                                className="bg-white text-green-900 px-4 py-1.5 rounded-lg text-sm font-bold shadow hover:bg-green-50 transition">
                                {subVistaAdmin ? "👀 Vista Cliente" : "🛡️ Dashboard Admin"}
                            </button>
                        )}
                        <span className="text-sm font-semibold opacity-90">Rol: {usuarioRol}</span>
                        <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-xs font-bold transition">
                            Salir
                        </button>
                    </div>
                )}
            </header>

            {/* Cuerpo de la Aplicación */}
            <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6">
                
                {/* VISTA LOGIN */}
                {vista === "login" && (
                    <div className="max-w-md mx-auto my-12 bg-white rounded-2xl shadow-xl p-8 border border-gray-100 animate-fade-in">
                        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Iniciar Sesión</h2>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Electrónico</label>
                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="ejemplo@correo.com" className="w-full p-3 border rounded-xl focus:outline-green-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña</label>
                                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••" className="w-full p-3 border rounded-xl focus:outline-green-500" />
                            </div>
                            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white p-3.5 rounded-xl font-bold transition shadow-lg">
                                Ingresar
                            </button>
                        </form>
                        <p className="text-center text-xs text-gray-500 mt-6">
                            ¿No tienes cuenta? <button onClick={() => setVista("registro")} className="text-green-600 font-bold hover:underline">Regístrate aquí</button>
                        </p>
                    </div>
                )}

                {/* VISTA REGISTRO */}
                {vista === "registro" && (
                    <div className="max-w-md mx-auto my-12 bg-white rounded-2xl shadow-xl p-8 border border-gray-100 animate-fade-in">
                        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Registrarse</h2>
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
                                <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)}
                                    placeholder="Juan Pérez" className="w-full p-3 border rounded-xl focus:outline-green-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Electrónico</label>
                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="ejemplo@correo.com" className="w-full p-3 border rounded-xl focus:outline-green-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña</label>
                                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••" className="w-full p-3 border rounded-xl focus:outline-green-500" />
                            </div>
                            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white p-3.5 rounded-xl font-bold transition shadow-lg">
                                Crear Cuenta
                            </button>
                        </form>
                        <p className="text-center text-xs text-gray-500 mt-6">
                            ¿Ya tienes cuenta? <button onClick={() => setVista("login")} className="text-green-600 font-bold hover:underline">Inicia sesión</button>
                        </p>
                    </div>
                )}

                {/* VISTA RESERVAS CLIENTE */}
                {vista === "reservas" && !subVistaAdmin && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                        
                        {/* 1. Selector de Parámetros */}
                        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 h-fit space-y-4">
                            <h2 className="text-lg font-extrabold text-gray-800 border-b pb-2">🔍 Parámetros de Reserva</h2>
                            
                            {/* Filtro por Deporte (FR-005) */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Filtrar Deporte</label>
                                <div className="flex gap-2">
                                    {["TODOS", "FÚTBOL", "BÁSQUET", "TENIS"].map(dep => (
                                        <button key={dep} onClick={() => setDeporteFiltro(dep)}
                                            className={`text-[10px] font-bold px-2 py-1.5 rounded transition ${deporteFiltro === dep ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                                            {dep}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dropdown dinámico (FR-004) */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Cancha de Destino</label>
                                <select value={canchaId} onChange={e => setCanchaId(e.target.value)} className="w-full p-2.5 border rounded-xl bg-gray-50">
                                    {canchasFiltradas.length === 0 ? (
                                        <option value="">No hay canchas disponibles</option>
                                    ) : (
                                        canchasFiltradas.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.nombre} ({c.deporte}) - S/. {c.precio_hora}/hr
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Fecha del Partido</label>
                                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full p-2.5 border rounded-xl bg-gray-50 font-bold" />
                            </div>
                        </div>

                        {/* 2. Calendario de Slots Operativos */}
                        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                            <h2 className="text-lg font-extrabold text-gray-800 border-b pb-2 mb-4">📅 Horarios Disponibles</h2>
                            <div className="grid grid-cols-2 gap-3 max-h-[450px] overflow-y-auto pr-2">
                                {canchas.find(c => c.id.toString() === canchaId) ? (
                                    HORAS_OPERATIVAS.slice(0, -1).map((hora, index) => {
                                        const ocupado = comprobarHoraOcupada(hora);
                                        return (
                                            <button key={index} disabled={ocupado} onClick={() => iniciarFlujoPago(hora)}
                                                className={`p-3.5 rounded-xl font-bold text-center border text-xs transition shadow-sm
                                                    ${ocupado ? "bg-red-50 text-red-500 border-red-200 cursor-not-allowed" : "bg-green-50 text-green-700 border-green-200 hover:bg-green-600 hover:text-white"}`}>
                                                {hora} <br />
                                                <span className="text-[10px] font-normal">{ocupado ? "🚫 Reservado" : "⚡ Alquilar"}</span>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <p className="text-gray-400 text-sm col-span-2 text-center py-8">Selecciona una cancha válida para ver horarios.</p>
                                )}
                            </div>
                        </div>

                        {/* 3. Mis Separaciones */}
                        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                            <h2 className="text-lg font-extrabold text-gray-800 border-b pb-2 mb-4">📋 Mis Reservas Activas</h2>
                            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                                {misReservas.length === 0 ? (
                                    <p className="text-gray-400 text-sm text-center py-8">No tienes reservas activas.</p>
                                ) : (
                                    misReservas.map(res => (
                                        <div key={res.id} className="bg-gray-50 border border-gray-100 p-4 rounded-xl shadow-sm text-xs relative flex flex-col justify-between gap-2">
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-extrabold text-gray-700">Reserva #00{res.id}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${res.estado === 'APROBADO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {res.estado}
                                                    </span>
                                                </div>
                                                <p className="font-semibold text-gray-800">{res.Cancha?.nombre || `Cancha #${res.cancha_id}`}</p>
                                                <p className="text-gray-500 mt-1">📅 {res.fecha_reserva} | ⏰ {res.hora_inicio.substring(0, 5)} - {res.hora_fin.substring(0, 5)}</p>
                                                <p className="text-green-700 font-extrabold mt-1 text-sm">Tarifa: S/. {res.total_pago}</p>
                                                {res.estado === 'CANCELADO' && (
                                                    <div className="mt-2 text-[10px] text-gray-500 border-t pt-1">
                                                        <p>Reembolsado: <span className="font-bold text-blue-600">S/. {res.reembolso}</span></p>
                                                        <p>Penalidad: <span className="font-bold text-red-600">S/. {res.penalidad}</span></p>
                                                    </div>
                                                )}
                                            </div>
                                            {res.estado === 'APROBADO' && (
                                                <button onClick={() => precalcularCancelacion(res)}
                                                    className="w-full bg-red-50 hover:bg-red-600 hover:text-white text-red-700 text-[10px] font-bold py-1.5 rounded transition">
                                                    ❌ Cancelar Reserva
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                )}

                {/* PANEL ADMINISTRATIVO COMPLETO (Dashboards e Ingresos/Pérdidas y Logs) */}
                {vista === "reservas" && subVistaAdmin && (
                    <div className="space-y-6 animate-fade-in">
                        
                        {/* Filtros de Rango de Fechas para Dashboards (FR-014, FR-015) */}
                        <div className="bg-white p-4 rounded-xl shadow border flex flex-col md:flex-row gap-4 items-end">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Fecha Inicio</label>
                                <input type="date" value={fechaInicioReporte} onChange={e => setFechaInicioReporte(e.target.value)} className="p-2 border rounded-lg text-sm bg-gray-50" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Fecha Fin</label>
                                <input type="date" value={fechaFinReporte} onChange={e => setFechaFinReporte(e.target.value)} className="p-2 border rounded-lg text-sm bg-gray-50" />
                            </div>
                            <button onClick={() => { setFechaInicioReporte(""); setFechaFinReporte(""); }} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold">
                                Limpiar Fechas
                            </button>
                        </div>

                        {/* Métricas Financieras */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow border-l-4 border-green-600 flex flex-col justify-between">
                                <p className="text-xs font-bold uppercase text-gray-400">Ingresos Totales (Caja)</p>
                                <p className="text-3xl font-black text-gray-800 mt-2">S/. {reportData.resumen.ingresosTotales}.00</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow border-l-4 border-blue-600 flex flex-col justify-between">
                                <p className="text-xs font-bold uppercase text-gray-400">Transacciones Realizadas</p>
                                <p className="text-3xl font-black text-gray-800 mt-2">{reportData.resumen.conteoReservas} Reservas</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow border-l-4 border-red-500 flex flex-col justify-between">
                                <p className="text-xs font-bold uppercase text-gray-400">Pérdidas (Reembolsos)</p>
                                <p className="text-3xl font-black text-red-600 mt-2">S/. {reportData.resumen.perdidasReembolsos}.00</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow border-l-4 border-orange-500 flex flex-col justify-between">
                                <p className="text-xs font-bold uppercase text-gray-400">Recaudado por Penalidades</p>
                                <p className="text-3xl font-black text-orange-600 mt-2">S/. {reportData.resumen.penalidadesCobradas}.00</p>
                            </div>
                        </div>

                        {/* Gráficos de Estadísticas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow border">
                                <h3 className="text-sm font-bold text-gray-700 mb-4">Ingresos Consolidados por Cancha</h3>
                                <div className="max-h-[250px] flex justify-center"><canvas ref={chartBarrasRef}></canvas></div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow border">
                                <h3 className="text-sm font-bold text-gray-700 mb-4">Frecuencia Operativa de Reservas</h3>
                                <div className="max-h-[250px] flex justify-center"><canvas ref={chartLineasRef}></canvas></div>
                            </div>
                        </div>

                        {/* Gestión de Canchas (FR-016) y Bitácora Auditoría (FR-017) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* Panel CRUD Canchas */}
                            <div className="bg-white p-6 rounded-2xl shadow border space-y-6">
                                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">🏟️ Gestión de Catálogo de Canchas</h3>
                                
                                <form onSubmit={guardarCancha} className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Nombre</label>
                                        <input type="text" required value={nombreCancha} onChange={e => setNombreCancha(e.target.value)}
                                            placeholder="Ej. Santiago Bernabéu Losa" className="w-full p-2 border rounded text-xs" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase">Suelo</label>
                                        <select value={sueloCancha} onChange={e => setSueloCancha(e.target.value)} className="w-full p-2 border rounded text-xs bg-white">
                                            <option value="GRASS">Césped Sintético</option>
                                            <option value="LOSA">Losa Deportiva</option>
                                            <option value="PARQUET">Parquet</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase">Precio/Hora (S/.)</label>
                                        <input type="number" required min="1" value={precioCancha} onChange={e => setPrecioCancha(Number(e.target.value))} className="w-full p-2 border rounded text-xs" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase">Deporte</label>
                                        <select value={deporteCancha} onChange={e => setDeporteCancha(e.target.value)} className="w-full p-2 border rounded text-xs bg-white">
                                            <option value="FÚTBOL">Fútbol</option>
                                            <option value="BÁSQUET">Básquetbol</option>
                                            <option value="TENIS">Tenis</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xs p-2.5 rounded transition">
                                            {editandoCanchaId ? "💾 Guardar Edición" : "➕ Añadir Cancha"}
                                        </button>
                                    </div>
                                </form>

                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                    {canchas.map(c => (
                                        <div key={c.id} className="p-3 border rounded-xl flex justify-between items-center bg-gray-50 text-xs">
                                            <div>
                                                <p className="font-bold text-gray-800">{c.nombre} <span className="font-normal text-gray-500">({c.deporte})</span></p>
                                                <p className="text-gray-500">Suelo: {c.tipo_suelo} | Precio: S/. {c.precio_hora}</p>
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${c.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                    {c.activo ? "Activo" : "Inactivo"}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => iniciarEdicionCancha(c)} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-2 py-1 rounded font-bold">Editar</button>
                                                {c.activo && (
                                                    <button onClick={() => deactivarCancha(c.id)} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-2 py-1 rounded font-bold">Desactivar</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Bitácora de Transacciones (Log de Auditoría) */}
                            <div className="bg-white p-6 rounded-2xl shadow border flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">🛡️ Bitácora de Transacciones Global (Audit Log)</h3>
                                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                                        {reportData.auditorias.map(log => (
                                            <div key={log.id} className="p-3 border-l-4 border-emerald-600 bg-gray-50 rounded-r-xl text-[10px] space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">{log.accion}</span>
                                                    <span className="text-gray-400 font-mono">{new Date(log.fecha).toLocaleString()}</span>
                                                </div>
                                                <p className="text-gray-700 font-medium">{log.detalles}</p>
                                                <p className="text-[9px] text-gray-500 font-bold">Por: {log.Usuario?.nombre || "Sistema / Externo"} ({log.Usuario?.email || "N/A"})</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-gray-400 text-center py-4 text-xs">
                &copy; 2026 CanchaYA - Sistema de Reserva y Operaciones Deportivas.
            </footer>

            {/* MODAL PASARELA DE PAGO */}
            {mostrarPasarela && slotParaReservar && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full relative animate-scale-up">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">💳 Checkout Pasarela CanchaYA</h3>
                        <p className="text-xs text-gray-500 mb-4">Tu slot expira en: <span className="font-bold text-orange-600 font-mono">{Math.floor(tiempoRestante / 60)}:{(tiempoRestante % 60).toString().padStart(2, '0')}</span></p>
                        
                        <form onSubmit={ejecutarPagoYReserva} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Número de Tarjeta</label>
                                <input type="text" required placeholder="4111 2222 3333 4444" className="w-full p-2.5 border rounded-xl text-sm font-mono focus:outline-green-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Expira</label>
                                    <input type="text" required placeholder="MM/YY" className="w-full p-2.5 border rounded-xl text-sm focus:outline-green-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">CVV</label>
                                    <input type="password" required placeholder="123" className="w-full p-2.5 border rounded-xl text-sm focus:outline-green-500" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setMostrarPasarela(false); setSlotParaReservar(null); agregarNotificacion("Reserva cancelada voluntariamente.", "info"); }} className="w-1/3 border p-2.5 rounded-xl text-xs font-bold">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={procesandoPago} className="w-2/3 bg-green-600 hover:bg-green-700 text-white p-2.5 rounded-xl font-bold text-xs transition shadow-md">
                                    {procesandoPago ? "Procesando..." : `Pagar S/. ${slotParaReservar.total}.00`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CONFIRMAR CANCELACIÓN (FR-011, FR-012) */}
            {mostrarConfirmarCancelacion && reservaParaCancelar && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full relative animate-scale-up border-t-8 border-red-600">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">⚠️ Confirmar Cancelación</h3>
                        <p className="text-xs text-gray-600 mb-4">Esta acción no se puede deshacer y aplica la política de cancelación de CanchaYA.</p>
                        
                        <div className="bg-gray-50 p-4 rounded-xl border space-y-2 text-xs mb-6">
                            <p><span className="font-bold">Reserva:</span> #00{reservaParaCancelar.id}</p>
                            <p><span className="font-bold">Total Pagado:</span> S/. {reservaParaCancelar.total_pago}.00</p>
                            <hr />
                            <div className="space-y-1">
                                <p className="text-blue-700 font-semibold">💰 Reembolso Estimado: S/. {cancellationOutcomes.reembolso}.00</p>
                                <p className="text-red-700 font-semibold">⚠️ Penalidad Aplicada: S/. {cancellationOutcomes.penalidad}.00</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={() => { setMostrarConfirmarCancelacion(false); setReservaParaCancelar(null); }} className="w-1/2 border p-2.5 rounded-xl text-xs font-bold">
                                Regresar
                            </button>
                            <button onClick={ejecutarCancelacion} className="w-1/2 bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-xl font-bold text-xs transition shadow-md">
                                Confirmar Cancelación
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notificaciones Flotantes */}
            <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
                {notificaciones.map(n => (
                    <div key={n.id} className={`p-4 rounded-xl shadow-lg border text-xs font-bold w-64 pointer-events-auto flex items-center justify-between transition-all duration-300 animate-slide-in
                        ${n.tipo === 'success' ? 'bg-green-50 text-green-800 border-green-200' : n.tipo === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
                        <span>{n.texto}</span>
                        <button onClick={() => setNotificaciones(prev => prev.filter(item => item.id !== n.id))} className="text-[10px] opacity-60 hover:opacity-100 ml-2">✕</button>
                    </div>
                ))}
            </div>

        </div>
    );
}

// Render root
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
