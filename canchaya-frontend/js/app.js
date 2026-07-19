const { useState, useEffect, useRef } = React;

function App() {
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [usuarioRol, setUsuarioRol] = useState(localStorage.getItem("rol") || "CLIENTE");
    const [vista, setVista] = useState("home"); // 'home', 'reservas', 'admin'
    const [subVistaAdmin, setSubVistaAdmin] = useState(false);
    
    // Auth Modal & Tabs
    const [mostrarAuthModal, setMostrarAuthModal] = useState(false);
    const [authTab, setAuthTab] = useState("login"); // 'login' or 'registro'

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

    // Cargar catálogo de canchas siempre (visitantes y autenticados)
    useEffect(() => {
        cargarCanchas();
        if (token) {
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
            setMostrarAuthModal(false);
            setVista("reservas");
            agregarNotificacion(`¡Bienvenido de nuevo, ${data.usuario.nombre}!`, "success");
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
            setAuthTab("login");
            agregarNotificacion("¡Registro exitoso! Ya puedes iniciar sesión con tu cuenta.", "success");
        } catch (err) {
            agregarNotificacion(err.message || "Error en el registro", "error");
        }
    };

    const cerrarSesion = () => {
        localStorage.clear();
        setToken("");
        setUsuarioRol("CLIENTE");
        setVista("home");
        setSubVistaAdmin(false);
        agregarNotificacion("Has cerrado sesión correctamente.", "info");
    };

    const iniciarFlujoPago = (horaSlot) => {
        if (!token) {
            setMostrarAuthModal(true);
            setAuthTab("login");
            agregarNotificacion("Inicia sesión para reservar un horario.", "info");
            return;
        }
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
            agregarNotificacion("💳 ¡Pago simulado aprobado! Tu reserva ha sido confirmada.", "success");
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

    useEffect(() => {
        if (subVistaAdmin) {
            cargarReportes();
        }
    }, [subVistaAdmin, fechaInicioReporte, fechaFinReporte]);

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

        const ingresosCanchas = {};
        const conteoHoras = {};

        HORAS_OPERATIVAS.forEach(h => conteoHoras[h] = 0);

        reportData.reservas.forEach(r => {
            const nombreCancha = (r.Cancha && r.Cancha.nombre) ? r.Cancha.nombre : `Cancha #${r.cancha_id}`;
            if (r.estado === "APROBADO") {
                ingresosCanchas[nombreCancha] = (ingresosCanchas[nombreCancha] || 0) + parseFloat(r.total_pago);
                const hInicio = r.hora_inicio.substring(0, 5);
                if (conteoHoras[hInicio] !== undefined) {
                    conteoHoras[hInicio]++;
                }
            }
        });

        if (chartBarrasRef.current) {
            instanciasCharts.current.barras = new Chart(chartBarrasRef.current, {
                type: 'bar',
                data: {
                    labels: Object.keys(ingresosCanchas).length > 0 ? Object.keys(ingresosCanchas) : ['Sin datos'],
                    datasets: [{
                        label: 'Ingresos por Cancha (S/.)',
                        data: Object.values(ingresosCanchas).length > 0 ? Object.values(ingresosCanchas) : [0],
                        backgroundColor: '#10b981',
                        borderRadius: 8
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
                        label: 'Frecuencia de Reservas',
                        data: Object.values(conteoHoras),
                        borderColor: '#06b6d4',
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: { responsive: true, plugins: { legend: { display: false } } }
            });
        }
    };

    const canchasFiltradas = canchas.filter(c => {
        if (deporteFiltro === "TODOS") return true;
        return (c.deporte || "").toUpperCase() === deporteFiltro;
    });

    const getIconoDeporte = (deporte) => {
        const dep = (deporte || "").toUpperCase();
        if (dep.includes("TENIS")) return "🎾";
        if (dep.includes("BÁSQUET")) return "🏀";
        if (dep.includes("VÓLEY")) return "🏐";
        return "⚽";
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
            
            {/* GLASSMORPHIC NAVBAR */}
            <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setVista("home")}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">
                        ⚽
                    </div>
                    <div>
                        <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                            Cancha<span className="gradient-text">YA</span>
                        </span>
                        <span className="block text-[10px] text-slate-400 font-medium tracking-wider uppercase">Reserva tu cancha al instante</span>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
                    <button onClick={() => setVista("home")} className={`hover:text-emerald-400 transition ${vista === 'home' ? 'text-emerald-400 font-bold' : ''}`}>
                        🏠 Inicio
                    </button>
                    <a href="#catalogo" onClick={() => { if(vista !== 'home') setVista('home'); }} className="hover:text-emerald-400 transition">
                        ⚽ Explorar Canchas
                    </a>
                    <a href="#como-funciona" onClick={() => { if(vista !== 'home') setVista('home'); }} className="hover:text-emerald-400 transition">
                        ❓ ¿Cómo Funciona?
                    </a>
                    {token && (
                        <button onClick={() => { setVista("reservas"); setSubVistaAdmin(false); }} className={`hover:text-emerald-400 transition ${vista === 'reservas' && !subVistaAdmin ? 'text-emerald-400 font-bold' : ''}`}>
                            📋 Mis Reservas
                        </button>
                    )}
                    {token && usuarioRol === "ADMIN" && (
                        <button onClick={() => { setVista("admin"); setSubVistaAdmin(true); }} className={`px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition ${subVistaAdmin ? 'bg-emerald-500/20 font-bold' : ''}`}>
                            👑 Panel Admin
                        </button>
                    )}
                </nav>

                {/* User status / Auth Action */}
                <div className="flex items-center gap-3">
                    {token ? (
                        <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-xs font-bold text-emerald-400">
                                {usuarioRol === 'ADMIN' ? '👑' : '👤'}
                            </div>
                            <div className="hidden sm:block text-left">
                                <span className="block text-xs font-bold text-slate-200">{usuarioRol}</span>
                                <span className="block text-[10px] text-slate-400">Sesión Activa</span>
                            </div>
                            <button onClick={cerrarSesion} className="ml-2 text-xs text-rose-400 hover:text-rose-300 font-bold bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg transition">
                                Salir
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button onClick={() => { setAuthTab("login"); setMostrarAuthModal(true); }} className="px-4 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition">
                                🔑 Iniciar Sesión
                            </button>
                            <button onClick={() => { setAuthTab("registro"); setMostrarAuthModal(true); }} className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-xl shadow-lg shadow-emerald-500/20 transition transform active:scale-95">
                                ✨ Registrarse
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1">

                {/* VISTA LANDING / HOME */}
                {vista === "home" && (
                    <div className="space-y-16 pb-16">
                        
                        {/* HERO BANNER SECTION */}
                        <section className="relative overflow-hidden pt-12 pb-20 px-4 lg:px-8 max-w-7xl mx-auto text-center">
                            {/* Background glows */}
                            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="absolute top-1/3 right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-6 animate-pulse-border">
                                <span>✨ La Plataforma N°1 de Reservas Deportivas en Perú</span>
                            </div>

                            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight max-w-4xl mx-auto">
                                Reserva tu Cancha Deportiva en <span className="gradient-text">Segundos</span>
                            </h1>

                            <p className="text-slate-300 text-base sm:text-xl max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
                                Explora la disponibilidad en tiempo real para canchas de fútbol, tenis, básquetbol y vóley. Elige tu horario favorito y asegura tu lugar con confirmación inmediata.
                            </p>

                            <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
                                <a href="#catalogo" className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-500/25 transition transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2">
                                    <span>⚽ Explorar Canchas Disponibles</span>
                                </a>
                                {!token ? (
                                    <button onClick={() => { setAuthTab("login"); setMostrarAuthModal(true); }} className="px-7 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold text-sm sm:text-base transition flex items-center gap-2">
                                        <span>🔑 Iniciar Sesión / Registrarse</span>
                                    </button>
                                ) : (
                                    <button onClick={() => setVista("reservas")} className="px-7 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold text-sm sm:text-base transition flex items-center gap-2">
                                        <span>📅 Ver Matriz de Reservas</span>
                                    </button>
                                )}
                            </div>

                            {/* STATS COUNTER BAR */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-slate-800/80">
                                <div className="glass-card p-4 rounded-2xl text-center">
                                    <span className="block text-2xl sm:text-3xl font-black text-emerald-400">+500</span>
                                    <span className="text-xs text-slate-400 font-medium">Reservas Exitosas</span>
                                </div>
                                <div className="glass-card p-4 rounded-2xl text-center">
                                    <span className="block text-2xl sm:text-3xl font-black text-cyan-400">8+</span>
                                    <span className="text-xs text-slate-400 font-medium">Canchas Premium</span>
                                </div>
                                <div className="glass-card p-4 rounded-2xl text-center">
                                    <span className="block text-2xl sm:text-3xl font-black text-emerald-400">100%</span>
                                    <span className="text-xs text-slate-400 font-medium">Confirmación Online</span>
                                </div>
                                <div className="glass-card p-4 rounded-2xl text-center">
                                    <span className="block text-2xl sm:text-3xl font-black text-cyan-400">24/7</span>
                                    <span className="text-xs text-slate-400 font-medium">Horario Operativo</span>
                                </div>
                            </div>
                        </section>

                        {/* INTERACTIVE COURT CATALOG SECTION */}
                        <section id="catalogo" className="max-w-7xl mx-auto px-4 lg:px-8 space-y-8 scroll-mt-20">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Catálogo de Canchas <span className="gradient-text">en Tiempo Real</span></h2>
                                <p className="text-slate-400 text-sm max-w-xl mx-auto">Selecciona tu disciplina favorita y revisa el precio por hora y tipo de superficie.</p>
                            </div>

                            {/* SPORT FILTERS BAR */}
                            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                                {["TODOS", "FÚTBOL", "TENIS", "BÁSQUETBOL", "VÓLEY"].map((dep) => (
                                    <button
                                        key={dep}
                                        onClick={() => setDeporteFiltro(dep)}
                                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${deporteFiltro === dep ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'glass-card text-slate-300 hover:text-white'}`}
                                    >
                                        <span>{getIconoDeporte(dep)}</span>
                                        <span>{dep}</span>
                                    </button>
                                ))}
                            </div>

                            {/* COURT CARDS GRID */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {canchasFiltradas.length > 0 ? (
                                    canchasFiltradas.map((cancha) => (
                                        <div key={cancha.id} className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition">
                                            <div>
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="text-3xl">{getIconoDeporte(cancha.deporte)}</span>
                                                    <div className="flex gap-2">
                                                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase">
                                                            {cancha.tipo_suelo}
                                                        </span>
                                                        <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-extrabold uppercase">
                                                            {cancha.deporte}
                                                        </span>
                                                    </div>
                                                </div>
                                                <h3 className="text-lg font-bold text-white mb-1">{cancha.nombre}</h3>
                                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                                    <span>🕒 Horario: 08:00 a 22:00 hrs</span>
                                                </p>
                                            </div>

                                            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                                                <div>
                                                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">Tarifa Promedio</span>
                                                    <span className="text-xl font-black text-emerald-400">S/. {cancha.precio_hora}.00 <span className="text-xs font-normal text-slate-400">/ hora</span></span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setCanchaId(cancha.id.toString());
                                                        if (token) {
                                                            setVista("reservas");
                                                        } else {
                                                            setMostrarAuthModal(true);
                                                            setAuthTab("login");
                                                            agregarNotificacion("Inicia sesión para reservar esta cancha.", "info");
                                                        }
                                                    }}
                                                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-emerald-500/20 active:scale-95"
                                                >
                                                    Reservar Cancha
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full glass-panel p-12 text-center rounded-2xl space-y-3">
                                        <span className="text-4xl">🏟️</span>
                                        <h3 className="text-lg font-bold text-white">No hay canchas registradas en esta categoría</h3>
                                        <p className="text-xs text-slate-400">Selecciona otro deporte arriba para explorar más espacios deportivos.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* CÓMO FUNCIONA SECTION */}
                        <section id="como-funciona" className="max-w-7xl mx-auto px-4 lg:px-8 py-12 scroll-mt-20">
                            <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-slate-800 space-y-10">
                                <div className="text-center space-y-2">
                                    <span className="text-emerald-400 text-xs font-extrabold uppercase tracking-wider">Paso a Paso</span>
                                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white">¿Cómo Funciona CanchaYA?</h2>
                                    <p className="text-slate-400 text-sm max-w-lg mx-auto">Reservar una cancha deportiva nunca fue tan fácil y rápido.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="glass-card p-6 rounded-2xl text-center space-y-3">
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-2xl flex items-center justify-center mx-auto">
                                            1
                                        </div>
                                        <h3 className="text-base font-bold text-white">1. Explora & Filtra</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed">Selecciona tu disciplina (Fútbol, Tenis, Básquet, Vóley) y tipo de suelo de tu preferencia.</p>
                                    </div>

                                    <div className="glass-card p-6 rounded-2xl text-center space-y-3">
                                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-black text-2xl flex items-center justify-center mx-auto">
                                            2
                                        </div>
                                        <h3 className="text-base font-bold text-white">2. Elige tu Horario</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed">Revisa la matriz de disponibilidad en tiempo real entre 08:00 y 22:00 hrs para la fecha deseada.</p>
                                    </div>

                                    <div className="glass-card p-6 rounded-2xl text-center space-y-3">
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-2xl flex items-center justify-center mx-auto">
                                            3
                                        </div>
                                        <h3 className="text-base font-bold text-white">3. Confirma & Juega</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed">Simula tu pago seguro y recibe la confirmación inmediata garantizada sin riesgo de overbooking.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* GARANTÍAS Y BENEFICIOS */}
                        <section className="max-w-7xl mx-auto px-4 lg:px-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="glass-card p-6 rounded-2xl flex items-start gap-4">
                                    <span className="text-3xl">🛡️</span>
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-1">Cero Overbooking</h4>
                                        <p className="text-xs text-slate-400">Protección a nivel de base de datos MySQL mediante restricción única relacional.</p>
                                    </div>
                                </div>
                                <div className="glass-card p-6 rounded-2xl flex items-start gap-4">
                                    <span className="text-3xl">💰</span>
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-1">Políticas de Reembolso</h4>
                                        <p className="text-xs text-slate-400">100% de devolución con &gt;24h de anticipación y 50% entre 2 y 24h.</p>
                                    </div>
                                </div>
                                <div className="glass-card p-6 rounded-2xl flex items-start gap-4">
                                    <span className="text-3xl">📱</span>
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-1">100% Móvil & Rápido</h4>
                                        <p className="text-xs text-slate-400">Diseño ultrarrápido optimizado para smartphones y navegadores modernos.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>
                )}

                {/* VISTA MATRIZ DE RESERVAS Y PANEL CLIENTE */}
                {vista === "reservas" && (
                    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8 animate-fade-in">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-panel p-6 rounded-2xl">
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-white">📅 Matriz de Reserva de Canchas</h1>
                                <p className="text-xs text-slate-400">Selecciona el día y la cancha para reservar tu horario de 08:00 a 22:00 hrs.</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setVista("home")} className="px-3 py-2 text-xs font-bold glass-card text-slate-300 hover:text-white rounded-xl">
                                    🏠 Ir al Inicio
                                </button>
                                {usuarioRol === "ADMIN" && (
                                    <button onClick={() => { setVista("admin"); setSubVistaAdmin(true); }} className="px-3 py-2 text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl">
                                        👑 Ir a Panel Admin
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* FILTROS DE RESERVA */}
                        <div className="glass-panel p-6 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Seleccionar Cancha</label>
                                <select
                                    value={canchaId}
                                    onChange={(e) => setCanchaId(e.target.value)}
                                    className="w-full glass-input p-2.5 rounded-xl text-sm font-semibold"
                                >
                                    {canchas.map(c => (
                                        <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                                            {getIconoDeporte(c.deporte)} {c.nombre} (S/. {c.precio_hora}/h)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Fecha de Reserva</label>
                                <input
                                    type="date"
                                    value={fecha}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setFecha(e.target.value)}
                                    className="w-full glass-input p-2.5 rounded-xl text-sm font-semibold"
                                />
                            </div>

                            <div className="flex items-end">
                                <div className="w-full bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Estado de la Cancha</span>
                                    <span className="text-xs font-bold text-emerald-400">🟢 Operativa (08:00 - 22:00)</span>
                                </div>
                            </div>
                        </div>

                        {/* MATRIZ DE HORARIOS (SLOTS DE 1 HORA) */}
                        <div className="glass-panel p-6 rounded-2xl space-y-4">
                            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
                                <span>⏰ Disponibilidad de Horarios para el {fecha}</span>
                                <span className="text-xs font-normal text-slate-400">Slots de 60 minutos</span>
                            </h2>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                {HORAS_OPERATIVAS.map((hora) => {
                                    const ocupado = comprobarHoraOcupada(hora);
                                    const horaFin = `${String(parseInt(hora) + 1).padStart(2, '0')}:00`;

                                    return (
                                        <div
                                            key={hora}
                                            className={`p-4 rounded-xl border text-center transition flex flex-col justify-between space-y-2 ${
                                                ocupado
                                                    ? 'bg-rose-950/40 border-rose-900/60 text-rose-300'
                                                    : 'glass-card hover:border-emerald-500/60'
                                            }`}
                                        >
                                            <div>
                                                <span className="block text-sm font-black font-mono">{hora} - {horaFin}</span>
                                                <span className={`text-[10px] font-bold ${ocupado ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                    {ocupado ? '🔴 Ocupado' : '🟢 Disponible'}
                                                </span>
                                            </div>

                                            {!ocupado ? (
                                                <button
                                                    onClick={() => iniciarFlujoPago(hora)}
                                                    className="w-full py-1.5 px-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow transition"
                                                >
                                                    Reservar
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-slate-500 font-semibold block py-1.5">No disponible</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* MIS RESERVAS (HISTORIAL DEL CLIENTE) */}
                        <div className="glass-panel p-6 rounded-2xl space-y-4">
                            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">📋 Mis Reservas Realizadas</h2>
                            
                            {misReservas.length > 0 ? (
                                <div className="space-y-3">
                                    {misReservas.map((r) => (
                                        <div key={r.id} className="glass-card p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white text-sm">Reserva #{r.id} - {r.Cancha?.nombre || `Cancha #${r.cancha_id}`}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.estado === 'APROBADO' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                                                        {r.estado}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-mono mt-1">
                                                    📅 {r.fecha_reserva} | 🕒 {r.hora_inicio} - {r.hora_fin} | 💰 Total: S/. {r.total_pago}.00
                                                </p>
                                            </div>

                                            {r.estado === 'APROBADO' && (
                                                <button
                                                    onClick={() => precalcularCancelacion(r)}
                                                    className="px-3 py-1.5 text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg transition"
                                                >
                                                    Cancelación / Reembolso
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 text-center py-6">Aún no has realizado ninguna reserva.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* VISTA PANEL ADMINISTRADOR */}
                {vista === "admin" && usuarioRol === "ADMIN" && (
                    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center glass-panel p-6 rounded-2xl border-l-4 border-emerald-500">
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-white">👑 Panel de Control Administrativo</h1>
                                <p className="text-xs text-slate-400">Gestión de Canchas, Dashboard Financiero y Bitácora Global de Transacciones.</p>
                            </div>
                            <button onClick={() => { setVista("reservas"); setSubVistaAdmin(false); }} className="px-3 py-2 text-xs font-bold glass-card text-slate-300 hover:text-white rounded-xl">
                                📅 Ir a Reservas
                            </button>
                        </div>

                        {/* RESUMEN FINANCIERO METRICS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="glass-card p-5 rounded-2xl">
                                <span className="text-xs text-slate-400 font-bold block uppercase">Ingresos Totales</span>
                                <span className="text-2xl font-black text-emerald-400">S/. {(reportData.resumen && reportData.resumen.ingresosTotales) || 0}.00</span>
                            </div>
                            <div className="glass-card p-5 rounded-2xl">
                                <span className="text-xs text-slate-400 font-bold block uppercase">Pérdidas (Reembolsos)</span>
                                <span className="text-2xl font-black text-rose-400">S/. {(reportData.resumen && reportData.resumen.perdidasReembolsos) || 0}.00</span>
                            </div>
                            <div className="glass-card p-5 rounded-2xl">
                                <span className="text-xs text-slate-400 font-bold block uppercase">Penalidades Cobradas</span>
                                <span className="text-2xl font-black text-cyan-400">S/. {(reportData.resumen && reportData.resumen.penalidadesCobradas) || 0}.00</span>
                            </div>
                            <div className="glass-card p-5 rounded-2xl">
                                <span className="text-xs text-slate-400 font-bold block uppercase">Total Reservas</span>
                                <span className="text-2xl font-black text-white">{(reportData.resumen && reportData.resumen.conteoReservas) || 0}</span>
                            </div>
                        </div>

                        {/* FORMULARIO CRUD CANCHAS */}
                        <div className="glass-panel p-6 rounded-2xl space-y-6">
                            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
                                🏟️ {editandoCanchaId ? 'Editar Cancha Existente' : 'Crear Nueva Cancha Deportiva'}
                            </h2>

                            <form onSubmit={guardarCancha} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">Nombre de la Cancha</label>
                                    <input type="text" required value={nombreCancha} onChange={e => setNombreCancha(e.target.value)} placeholder="Ej: Santiago Bernabéu" className="w-full glass-input p-2.5 rounded-xl text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">Tipo de Suelo</label>
                                    <select value={sueloCancha} onChange={e => setSueloCancha(e.target.value)} className="w-full glass-input p-2.5 rounded-xl text-sm">
                                        <option value="GRASS" className="bg-slate-900 text-white">GRASS</option>
                                        <option value="LOSA" className="bg-slate-900 text-white">LOSA</option>
                                        <option value="SINTÉTICO" className="bg-slate-900 text-white">SINTÉTICO</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">Precio por Hora (S/.)</label>
                                    <input type="number" required min="1" value={precioCancha} onChange={e => setPrecioCancha(e.target.value)} className="w-full glass-input p-2.5 rounded-xl text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">Disciplina Deportiva</label>
                                    <select value={deporteCancha} onChange={e => setDeporteCancha(e.target.value)} className="w-full glass-input p-2.5 rounded-xl text-sm">
                                        <option value="FÚTBOL" className="bg-slate-900 text-white">FÚTBOL</option>
                                        <option value="TENIS" className="bg-slate-900 text-white">TENIS</option>
                                        <option value="BÁSQUETBOL" className="bg-slate-900 text-white">BÁSQUETBOL</option>
                                        <option value="VÓLEY" className="bg-slate-900 text-white">VÓLEY</option>
                                    </select>
                                </div>
                                <div className="col-span-full flex gap-3">
                                    <button type="submit" className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow transition">
                                        {editandoCanchaId ? 'Actualizar Cancha' : 'Guardar Cancha'}
                                    </button>
                                    {editandoCanchaId && (
                                        <button type="button" onClick={() => setEditandoCanchaId(null)} className="px-4 py-2.5 glass-card text-xs font-bold rounded-xl">
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>

                            {/* LISTADO DE CANCHAS ADMIN */}
                            <div className="space-y-3 pt-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase">Gestión de Canchas Registradas</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {canchas.map(c => (
                                        <div key={c.id} className="glass-card p-4 rounded-xl flex items-center justify-between">
                                            <div>
                                                <span className="font-bold text-white text-sm block">{c.nombre}</span>
                                                <span className="text-xs text-slate-400">{c.deporte} | {c.tipo_suelo} | S/. {c.precio_hora}/h</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => iniciarEdicionCancha(c)} className="text-xs text-cyan-400 hover:text-cyan-300 font-bold">Editar</button>
                                                <button onClick={() => deactivarCancha(c.id)} className="text-xs text-rose-400 hover:text-rose-300 font-bold">Desactivar</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* CHARTS DE RENDIMIENTO */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass-panel p-6 rounded-2xl space-y-4">
                                <h3 className="text-sm font-bold text-white">📊 Ingresos Totales por Cancha</h3>
                                <canvas ref={chartBarrasRef}></canvas>
                            </div>
                            <div className="glass-panel p-6 rounded-2xl space-y-4">
                                <h3 className="text-sm font-bold text-white">📈 Frecuencia de Reservas por Hora</h3>
                                <canvas ref={chartLineasRef}></canvas>
                            </div>
                        </div>

                        {/* BITÁCORA GLOBAL DE AUDITORÍA */}
                        <div className="glass-panel p-6 rounded-2xl space-y-4">
                            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">🛡️ Bitácora de Transacciones Global (Audit Log)</h3>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                {reportData.auditorias.map(log => (
                                    <div key={log.id} className="p-3 bg-slate-900/80 border-l-4 border-emerald-500 rounded-r-xl text-xs space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{log.accion}</span>
                                            <span className="text-slate-500 font-mono text-[10px]">{new Date(log.fecha).toLocaleString()}</span>
                                        </div>
                                        <p className="text-slate-300 font-medium">{log.detalles}</p>
                                        <p className="text-[10px] text-slate-400">Por: {(log.Usuario && log.Usuario.nombre) ? log.Usuario.nombre : "Sistema"} ({(log.Usuario && log.Usuario.email) ? log.Usuario.email : "N/A"})</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* FOOTER */}
            <footer className="glass-panel border-t border-slate-800/80 py-8 px-4 text-center text-xs text-slate-500 space-y-2">
                <p className="font-semibold text-slate-400">⚽ CanchaYA &copy; 2026 - Sistema de Reservas de Canchas Deportivas en Tiempo Real.</p>
                <p className="text-[10px]">Construido con tecnología de alta disponibilidad y arquitectura Specification-First (Spec Kit).</p>
            </footer>

            {/* MODAL POPUP AUTH (LOGIN / REGISTRO) */}
            {mostrarAuthModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="glass-panel border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-md w-full relative shadow-2xl animate-scale-up space-y-6">
                        
                        <button onClick={() => setMostrarAuthModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg">✕</button>

                        <div className="text-center space-y-1">
                            <span className="text-3xl">⚽</span>
                            <h3 className="text-xl font-bold text-white">Acceso a <span className="gradient-text">CanchaYA</span></h3>
                            <p className="text-xs text-slate-400">Inicia sesión o crea una cuenta para reservar en tiempo real</p>
                        </div>

                        {/* TAB SELECTOR */}
                        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                            <button
                                onClick={() => setAuthTab("login")}
                                className={`w-1/2 py-2 text-xs font-bold rounded-lg transition ${authTab === 'login' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
                            >
                                🔑 Iniciar Sesión
                            </button>
                            <button
                                onClick={() => setAuthTab("registro")}
                                className={`w-1/2 py-2 text-xs font-bold rounded-lg transition ${authTab === 'registro' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
                            >
                                ✨ Registrarse
                            </button>
                        </div>

                        {/* FORM LOGIN */}
                        {authTab === "login" ? (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">Correo Electrónico</label>
                                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" className="w-full glass-input p-3 rounded-xl text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">Contraseña</label>
                                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full glass-input p-3 rounded-xl text-sm" />
                                </div>
                                <button type="submit" className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95">
                                    Ingresar a mi Cuenta
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">Nombre Completo</label>
                                    <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Carlos Silva" className="w-full glass-input p-3 rounded-xl text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">Correo Electrónico</label>
                                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" className="w-full glass-input p-3 rounded-xl text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">Contraseña</label>
                                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full glass-input p-3 rounded-xl text-sm" />
                                </div>
                                <button type="submit" className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95">
                                    Crear Mi Cuenta
                                </button>
                            </form>
                        )}

                        {/* BOTONES DE AUTO-COMPLETADO RÁPIDO PARA PRUEBAS */}
                        <div className="pt-2 border-t border-slate-800 space-y-2">
                            <span className="block text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">⚡ Autocompletar Cuenta de Prueba</span>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => { setEmail("admin@canchaya.com"); setPassword("123456"); setAuthTab("login"); }} className="p-2 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-[10px] font-bold text-emerald-400 text-center">
                                    👑 Admin
                                </button>
                                <button onClick={() => { setEmail("juan@gmail.com"); setPassword("123456"); setAuthTab("login"); }} className="p-2 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-[10px] font-bold text-cyan-400 text-center">
                                    ⚽ Juan
                                </button>
                                <button onClick={() => { setEmail("lionel.messi@canchaya.com"); setPassword("123456"); setAuthTab("login"); }} className="p-2 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-[10px] font-bold text-purple-400 text-center">
                                    🌟 Messi
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* MODAL PASARELA DE PAGO */}
            {mostrarPasarela && slotParaReservar && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="glass-panel border border-slate-700 rounded-3xl p-6 max-w-md w-full relative animate-scale-up space-y-4">
                        <h3 className="text-lg font-bold text-white">💳 Checkout Pasarela CanchaYA</h3>
                        <p className="text-xs text-slate-400">Tu slot expira en: <span className="font-bold text-orange-400 font-mono">{Math.floor(tiempoRestante / 60)}:{(tiempoRestante % 60).toString().padStart(2, '0')}</span></p>
                        
                        <form onSubmit={ejecutarPagoYReserva} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Número de Tarjeta</label>
                                <input type="text" required placeholder="4111 2222 3333 4444" className="w-full p-2.5 glass-input rounded-xl text-sm font-mono" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Expira</label>
                                    <input type="text" required placeholder="MM/YY" className="w-full p-2.5 glass-input rounded-xl text-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">CVV</label>
                                    <input type="password" required placeholder="123" className="w-full p-2.5 glass-input rounded-xl text-sm" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setMostrarPasarela(false); setSlotParaReservar(null); agregarNotificacion("Reserva cancelada voluntariamente.", "info"); }} className="w-1/3 glass-card p-2.5 rounded-xl text-xs font-bold text-slate-300">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={procesandoPago} className="w-2/3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-2.5 rounded-xl font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition">
                                    {procesandoPago ? "Procesando..." : `Pagar S/. ${slotParaReservar.total}.00`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CONFIRMAR CANCELACIÓN */}
            {mostrarConfirmarCancelacion && reservaParaCancelar && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="glass-panel border border-rose-500/50 rounded-3xl p-6 max-w-md w-full relative animate-scale-up space-y-4">
                        <h3 className="text-lg font-bold text-white mb-2">⚠️ Confirmar Cancelación</h3>
                        <p className="text-xs text-slate-300 mb-4">Esta acción no se puede deshacer y aplica la política de cancelación de CanchaYA.</p>
                        
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 text-xs mb-6">
                            <p><span className="font-bold text-slate-400">Reserva:</span> #00{reservaParaCancelar.id}</p>
                            <p><span className="font-bold text-slate-400">Total Pagado:</span> S/. {reservaParaCancelar.total_pago}.00</p>
                            <hr className="border-slate-800" />
                            <div className="space-y-1">
                                <p className="text-emerald-400 font-semibold">💰 Reembolso Estimado: S/. {cancellationOutcomes.reembolso}.00</p>
                                <p className="text-rose-400 font-semibold">⚠️ Penalidad Aplicada: S/. {cancellationOutcomes.penalidad}.00</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={() => { setMostrarConfirmarCancelacion(false); setReservaParaCancelar(null); }} className="w-1/2 glass-card p-2.5 rounded-xl text-xs font-bold text-slate-300">
                                Regresar
                            </button>
                            <button onClick={ejecutarCancelacion} className="w-1/2 bg-rose-600 hover:bg-rose-500 text-white p-2.5 rounded-xl font-bold text-xs transition shadow-md">
                                Confirmar Cancelación
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NOTIFICACIONES FLOTANTES */}
            <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
                {notificaciones.map(n => (
                    <div key={n.id} className={`p-4 rounded-2xl shadow-2xl border text-xs font-bold w-72 pointer-events-auto flex items-center justify-between transition-all duration-300 animate-slide-in
                        ${n.tipo === 'success' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' : n.tipo === 'error' ? 'bg-rose-950/90 text-rose-300 border-rose-500/40' : 'bg-cyan-950/90 text-cyan-300 border-cyan-500/40'}`}>
                        <span>{n.texto}</span>
                        <button onClick={() => setNotificaciones(prev => prev.filter(item => item.id !== n.id))} className="text-xs opacity-60 hover:opacity-100 ml-2">✕</button>
                    </div>
                ))}
            </div>

        </div>
    );
}

// Render root
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
