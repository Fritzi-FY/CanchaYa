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
        if (!mostrarPasarela)
            return;
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
        }
        catch (err) {
            console.error(err);
            agregarNotificacion("Error al cargar el catálogo de canchas.", "error");
        }
    };
    const cargarMisReservas = async () => {
        try {
            const data = await apiFetch('/reservas/me');
            setMisReservas(data);
        }
        catch (err) {
            console.error(err);
        }
    };
    const cargarOcupacionCalendario = async () => {
        try {
            const data = await apiFetch('/reservas');
            setTodasLasReservas(data);
        }
        catch (err) {
            console.error(err);
        }
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
        }
        catch (err) {
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
        }
        catch (err) {
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
        if (!cancha)
            return;
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
        }
        catch (err) {
            agregarNotificacion(err.message || "Error al registrar la reserva", "error");
        }
        finally {
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
        }
        else if (diffHoras >= 2) {
            reembolso = Number((totalPago * 0.5).toFixed(2));
            penalidad = Number((totalPago * 0.5).toFixed(2));
        }
        else {
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
        }
        catch (err) {
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
            }
            else {
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
        }
        catch (err) {
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
        if (!confirm("¿Seguro que deseas desactivar esta cancha? Esto no borrará el histórico de reservas pero evitará nuevas solicitudes."))
            return;
        try {
            await apiFetch(`/canchas/${id}`, {
                method: 'DELETE'
            });
            agregarNotificacion("Cancha desactivada correctamente.");
            cargarCanchas();
        }
        catch (err) {
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
        }
        catch (err) {
            agregarNotificacion("Error al obtener reportes administrativos.", "error");
        }
    };
    useEffect(() => {
        if (subVistaAdmin) {
            cargarReportes();
        }
    }, [subVistaAdmin, fechaInicioReporte, fechaFinReporte]);
    const comprobarHoraOcupada = (hora) => {
        const ocupadasFiltradas = todasLasReservas.filter(r => r.cancha_id === parseInt(canchaId) && r.fecha_reserva === fecha && r.estado !== "CANCELADO");
        return ocupadasFiltradas.some(r => {
            const inicio = r.hora_inicio.substring(0, 5);
            const fin = r.hora_fin.substring(0, 5);
            return hora >= inicio && hora < fin;
        });
    };
    const construirGraficos = () => {
        if (instanciasCharts.current.barras)
            instanciasCharts.current.barras.destroy();
        if (instanciasCharts.current.lineas)
            instanciasCharts.current.lineas.destroy();
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
        if (deporteFiltro === "TODOS")
            return true;
        return (c.deporte || "").toUpperCase() === deporteFiltro;
    });
    const getIconoDeporte = (deporte) => {
        const dep = (deporte || "").toUpperCase();
        if (dep.includes("TENIS"))
            return "🎾";
        if (dep.includes("BÁSQUET"))
            return "🏀";
        if (dep.includes("VÓLEY"))
            return "🏐";
        return "⚽";
    };
    return (React.createElement("div", { className: "min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white" },
        React.createElement("header", { className: "sticky top-0 z-40 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-2xl" },
            React.createElement("div", { className: "flex items-center gap-3 cursor-pointer", onClick: () => setVista("home") },
                React.createElement("div", { className: "w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20" }, "\u26BD"),
                React.createElement("div", null,
                    React.createElement("span", { className: "text-xl font-black tracking-tight text-white flex items-center gap-1" },
                        "Cancha",
                        React.createElement("span", { className: "gradient-text" }, "YA")),
                    React.createElement("span", { className: "block text-[10px] text-slate-400 font-medium tracking-wider uppercase" }, "Reserva tu cancha al instante"))),
            React.createElement("nav", { className: "hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300" },
                React.createElement("button", { onClick: () => setVista("home"), className: `hover:text-emerald-400 transition ${vista === 'home' ? 'text-emerald-400 font-bold' : ''}` }, "\uD83C\uDFE0 Inicio"),
                React.createElement("a", { href: "#catalogo", onClick: () => { if (vista !== 'home')
                        setVista('home'); }, className: "hover:text-emerald-400 transition" }, "\u26BD Explorar Canchas"),
                React.createElement("a", { href: "#como-funciona", onClick: () => { if (vista !== 'home')
                        setVista('home'); }, className: "hover:text-emerald-400 transition" }, "\u2753 \u00BFC\u00F3mo Funciona?"),
                token && (React.createElement("button", { onClick: () => { setVista("reservas"); setSubVistaAdmin(false); }, className: `hover:text-emerald-400 transition ${vista === 'reservas' && !subVistaAdmin ? 'text-emerald-400 font-bold' : ''}` }, "\uD83D\uDCCB Mis Reservas")),
                token && usuarioRol === "ADMIN" && (React.createElement("button", { onClick: () => { setVista("admin"); setSubVistaAdmin(true); }, className: `px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition ${subVistaAdmin ? 'bg-emerald-500/20 font-bold' : ''}` }, "\uD83D\uDC51 Panel Admin"))),
            React.createElement("div", { className: "flex items-center gap-3" }, token ? (React.createElement("div", { className: "flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5" },
                React.createElement("div", { className: "w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-xs font-bold text-emerald-400" }, usuarioRol === 'ADMIN' ? '👑' : '👤'),
                React.createElement("div", { className: "hidden sm:block text-left" },
                    React.createElement("span", { className: "block text-xs font-bold text-slate-200" }, usuarioRol),
                    React.createElement("span", { className: "block text-[10px] text-slate-400" }, "Sesi\u00F3n Activa")),
                React.createElement("button", { onClick: cerrarSesion, className: "ml-2 text-xs text-rose-400 hover:text-rose-300 font-bold bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg transition" }, "Salir"))) : (React.createElement("div", { className: "flex items-center gap-2" },
                React.createElement("button", { onClick: () => { setAuthTab("login"); setMostrarAuthModal(true); }, className: "px-4 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition" }, "\uD83D\uDD11 Iniciar Sesi\u00F3n"),
                React.createElement("button", { onClick: () => { setAuthTab("registro"); setMostrarAuthModal(true); }, className: "px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-xl shadow-lg shadow-emerald-500/20 transition transform active:scale-95" }, "\u2728 Registrarse"))))),
        React.createElement("main", { className: "flex-1" },
            vista === "home" && (React.createElement("div", { className: "space-y-16 pb-16" },
                React.createElement("section", { className: "relative overflow-hidden pt-12 pb-20 px-4 lg:px-8 max-w-7xl mx-auto text-center" },
                    React.createElement("div", { className: "absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" }),
                    React.createElement("div", { className: "absolute top-1/3 right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" }),
                    React.createElement("div", { className: "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-6 animate-pulse-border" },
                        React.createElement("span", null, "\u2728 La Plataforma N\u00B01 de Reservas Deportivas en Per\u00FA")),
                    React.createElement("h1", { className: "text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight max-w-4xl mx-auto" },
                        "Reserva tu Cancha Deportiva en ",
                        React.createElement("span", { className: "gradient-text" }, "Segundos")),
                    React.createElement("p", { className: "text-slate-300 text-base sm:text-xl max-w-2xl mx-auto mb-8 font-normal leading-relaxed" }, "Explora la disponibilidad en tiempo real para canchas de f\u00FAtbol, tenis, b\u00E1squetbol y v\u00F3ley. Elige tu horario favorito y asegura tu lugar con confirmaci\u00F3n inmediata."),
                    React.createElement("div", { className: "flex flex-wrap items-center justify-center gap-4 mb-12" },
                        React.createElement("a", { href: "#catalogo", className: "px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-500/25 transition transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2" },
                            React.createElement("span", null, "\u26BD Explorar Canchas Disponibles")),
                        !token ? (React.createElement("button", { onClick: () => { setAuthTab("login"); setMostrarAuthModal(true); }, className: "px-7 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold text-sm sm:text-base transition flex items-center gap-2" },
                            React.createElement("span", null, "\uD83D\uDD11 Iniciar Sesi\u00F3n / Registrarse"))) : (React.createElement("button", { onClick: () => setVista("reservas"), className: "px-7 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold text-sm sm:text-base transition flex items-center gap-2" },
                            React.createElement("span", null, "\uD83D\uDCC5 Ver Matriz de Reservas")))),
                    React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-slate-800/80" },
                        React.createElement("div", { className: "glass-card p-4 rounded-2xl text-center" },
                            React.createElement("span", { className: "block text-2xl sm:text-3xl font-black text-emerald-400" }, "+500"),
                            React.createElement("span", { className: "text-xs text-slate-400 font-medium" }, "Reservas Exitosas")),
                        React.createElement("div", { className: "glass-card p-4 rounded-2xl text-center" },
                            React.createElement("span", { className: "block text-2xl sm:text-3xl font-black text-cyan-400" }, "8+"),
                            React.createElement("span", { className: "text-xs text-slate-400 font-medium" }, "Canchas Premium")),
                        React.createElement("div", { className: "glass-card p-4 rounded-2xl text-center" },
                            React.createElement("span", { className: "block text-2xl sm:text-3xl font-black text-emerald-400" }, "100%"),
                            React.createElement("span", { className: "text-xs text-slate-400 font-medium" }, "Confirmaci\u00F3n Online")),
                        React.createElement("div", { className: "glass-card p-4 rounded-2xl text-center" },
                            React.createElement("span", { className: "block text-2xl sm:text-3xl font-black text-cyan-400" }, "24/7"),
                            React.createElement("span", { className: "text-xs text-slate-400 font-medium" }, "Horario Operativo")))),
                React.createElement("section", { id: "catalogo", className: "max-w-7xl mx-auto px-4 lg:px-8 space-y-8 scroll-mt-20" },
                    React.createElement("div", { className: "text-center space-y-2" },
                        React.createElement("h2", { className: "text-2xl sm:text-4xl font-extrabold text-white" },
                            "Cat\u00E1logo de Canchas ",
                            React.createElement("span", { className: "gradient-text" }, "en Tiempo Real")),
                        React.createElement("p", { className: "text-slate-400 text-sm max-w-xl mx-auto" }, "Selecciona tu disciplina favorita y revisa el precio por hora y tipo de superficie.")),
                    React.createElement("div", { className: "flex flex-wrap items-center justify-center gap-2 sm:gap-3" }, ["TODOS", "FÚTBOL", "TENIS", "BÁSQUETBOL", "VÓLEY"].map((dep) => (React.createElement("button", { key: dep, onClick: () => setDeporteFiltro(dep), className: `px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${deporteFiltro === dep ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'glass-card text-slate-300 hover:text-white'}` },
                        React.createElement("span", null, getIconoDeporte(dep)),
                        React.createElement("span", null, dep))))),
                    React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" }, canchasFiltradas.length > 0 ? (canchasFiltradas.map((cancha) => (React.createElement("div", { key: cancha.id, className: "glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition" },
                        React.createElement("div", null,
                            React.createElement("div", { className: "flex justify-between items-start mb-3" },
                                React.createElement("span", { className: "text-3xl" }, getIconoDeporte(cancha.deporte)),
                                React.createElement("div", { className: "flex gap-2" },
                                    React.createElement("span", { className: "px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase" }, cancha.tipo_suelo),
                                    React.createElement("span", { className: "px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-extrabold uppercase" }, cancha.deporte))),
                            React.createElement("h3", { className: "text-lg font-bold text-white mb-1" }, cancha.nombre),
                            React.createElement("p", { className: "text-xs text-slate-400 flex items-center gap-1" },
                                React.createElement("span", null, "\uD83D\uDD52 Horario: 08:00 a 22:00 hrs"))),
                        React.createElement("div", { className: "pt-4 border-t border-slate-800 flex items-center justify-between" },
                            React.createElement("div", null,
                                React.createElement("span", { className: "block text-[10px] text-slate-400 uppercase font-semibold" }, "Tarifa Promedio"),
                                React.createElement("span", { className: "text-xl font-black text-emerald-400" },
                                    "S/. ",
                                    cancha.precio_hora,
                                    ".00 ",
                                    React.createElement("span", { className: "text-xs font-normal text-slate-400" }, "/ hora"))),
                            React.createElement("button", { onClick: () => {
                                    setCanchaId(cancha.id.toString());
                                    if (token) {
                                        setVista("reservas");
                                    }
                                    else {
                                        setMostrarAuthModal(true);
                                        setAuthTab("login");
                                        agregarNotificacion("Inicia sesión para reservar esta cancha.", "info");
                                    }
                                }, className: "px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-emerald-500/20 active:scale-95" }, "Reservar Cancha")))))) : (React.createElement("div", { className: "col-span-full glass-panel p-12 text-center rounded-2xl space-y-3" },
                        React.createElement("span", { className: "text-4xl" }, "\uD83C\uDFDF\uFE0F"),
                        React.createElement("h3", { className: "text-lg font-bold text-white" }, "No hay canchas registradas en esta categor\u00EDa"),
                        React.createElement("p", { className: "text-xs text-slate-400" }, "Selecciona otro deporte arriba para explorar m\u00E1s espacios deportivos."))))),
                React.createElement("section", { id: "como-funciona", className: "max-w-7xl mx-auto px-4 lg:px-8 py-12 scroll-mt-20" },
                    React.createElement("div", { className: "glass-panel rounded-3xl p-8 sm:p-12 border border-slate-800 space-y-10" },
                        React.createElement("div", { className: "text-center space-y-2" },
                            React.createElement("span", { className: "text-emerald-400 text-xs font-extrabold uppercase tracking-wider" }, "Paso a Paso"),
                            React.createElement("h2", { className: "text-2xl sm:text-4xl font-extrabold text-white" }, "\u00BFC\u00F3mo Funciona CanchaYA?"),
                            React.createElement("p", { className: "text-slate-400 text-sm max-w-lg mx-auto" }, "Reservar una cancha deportiva nunca fue tan f\u00E1cil y r\u00E1pido.")),
                        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8" },
                            React.createElement("div", { className: "glass-card p-6 rounded-2xl text-center space-y-3" },
                                React.createElement("div", { className: "w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-2xl flex items-center justify-center mx-auto" }, "1"),
                                React.createElement("h3", { className: "text-base font-bold text-white" }, "1. Explora & Filtra"),
                                React.createElement("p", { className: "text-xs text-slate-400 leading-relaxed" }, "Selecciona tu disciplina (F\u00FAtbol, Tenis, B\u00E1squet, V\u00F3ley) y tipo de suelo de tu preferencia.")),
                            React.createElement("div", { className: "glass-card p-6 rounded-2xl text-center space-y-3" },
                                React.createElement("div", { className: "w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-black text-2xl flex items-center justify-center mx-auto" }, "2"),
                                React.createElement("h3", { className: "text-base font-bold text-white" }, "2. Elige tu Horario"),
                                React.createElement("p", { className: "text-xs text-slate-400 leading-relaxed" }, "Revisa la matriz de disponibilidad en tiempo real entre 08:00 y 22:00 hrs para la fecha deseada.")),
                            React.createElement("div", { className: "glass-card p-6 rounded-2xl text-center space-y-3" },
                                React.createElement("div", { className: "w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-2xl flex items-center justify-center mx-auto" }, "3"),
                                React.createElement("h3", { className: "text-base font-bold text-white" }, "3. Confirma & Juega"),
                                React.createElement("p", { className: "text-xs text-slate-400 leading-relaxed" }, "Simula tu pago seguro y recibe la confirmaci\u00F3n inmediata garantizada sin riesgo de overbooking."))))),
                React.createElement("section", { className: "max-w-7xl mx-auto px-4 lg:px-8" },
                    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6" },
                        React.createElement("div", { className: "glass-card p-6 rounded-2xl flex items-start gap-4" },
                            React.createElement("span", { className: "text-3xl" }, "\uD83D\uDEE1\uFE0F"),
                            React.createElement("div", null,
                                React.createElement("h4", { className: "text-sm font-bold text-white mb-1" }, "Cero Overbooking"),
                                React.createElement("p", { className: "text-xs text-slate-400" }, "Protecci\u00F3n a nivel de base de datos MySQL mediante restricci\u00F3n \u00FAnica relacional."))),
                        React.createElement("div", { className: "glass-card p-6 rounded-2xl flex items-start gap-4" },
                            React.createElement("span", { className: "text-3xl" }, "\uD83D\uDCB0"),
                            React.createElement("div", null,
                                React.createElement("h4", { className: "text-sm font-bold text-white mb-1" }, "Pol\u00EDticas de Reembolso"),
                                React.createElement("p", { className: "text-xs text-slate-400" }, "100% de devoluci\u00F3n con >24h de anticipaci\u00F3n y 50% entre 2 y 24h."))),
                        React.createElement("div", { className: "glass-card p-6 rounded-2xl flex items-start gap-4" },
                            React.createElement("span", { className: "text-3xl" }, "\uD83D\uDCF1"),
                            React.createElement("div", null,
                                React.createElement("h4", { className: "text-sm font-bold text-white mb-1" }, "100% M\u00F3vil & R\u00E1pido"),
                                React.createElement("p", { className: "text-xs text-slate-400" }, "Dise\u00F1o ultrarr\u00E1pido optimizado para smartphones y navegadores modernos."))))))),
            vista === "reservas" && (React.createElement("div", { className: "max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8 animate-fade-in" },
                React.createElement("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-panel p-6 rounded-2xl" },
                    React.createElement("div", null,
                        React.createElement("h1", { className: "text-xl sm:text-2xl font-bold text-white" }, "\uD83D\uDCC5 Matriz de Reserva de Canchas"),
                        React.createElement("p", { className: "text-xs text-slate-400" }, "Selecciona el d\u00EDa y la cancha para reservar tu horario de 08:00 a 22:00 hrs.")),
                    React.createElement("div", { className: "flex gap-2" },
                        React.createElement("button", { onClick: () => setVista("home"), className: "px-3 py-2 text-xs font-bold glass-card text-slate-300 hover:text-white rounded-xl" }, "\uD83C\uDFE0 Ir al Inicio"),
                        usuarioRol === "ADMIN" && (React.createElement("button", { onClick: () => { setVista("admin"); setSubVistaAdmin(true); }, className: "px-3 py-2 text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl" }, "\uD83D\uDC51 Ir a Panel Admin")))),
                React.createElement("div", { className: "glass-panel p-6 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" },
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-slate-400 mb-1" }, "Seleccionar Cancha"),
                        React.createElement("select", { value: canchaId, onChange: (e) => setCanchaId(e.target.value), className: "w-full glass-input p-2.5 rounded-xl text-sm font-semibold" }, canchas.map(c => (React.createElement("option", { key: c.id, value: c.id, className: "bg-slate-900 text-white" },
                            getIconoDeporte(c.deporte),
                            " ",
                            c.nombre,
                            " (S/. ",
                            c.precio_hora,
                            "/h)"))))),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-slate-400 mb-1" }, "Fecha de Reserva"),
                        React.createElement("input", { type: "date", value: fecha, min: new Date().toISOString().split('T')[0], onChange: (e) => setFecha(e.target.value), className: "w-full glass-input p-2.5 rounded-xl text-sm font-semibold" })),
                    React.createElement("div", { className: "flex items-end" },
                        React.createElement("div", { className: "w-full bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center" },
                            React.createElement("span", { className: "text-[10px] text-slate-400 block font-bold uppercase" }, "Estado de la Cancha"),
                            React.createElement("span", { className: "text-xs font-bold text-emerald-400" }, "\uD83D\uDFE2 Operativa (08:00 - 22:00)")))),
                React.createElement("div", { className: "glass-panel p-6 rounded-2xl space-y-4" },
                    React.createElement("h2", { className: "text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between" },
                        React.createElement("span", null,
                            "\u23F0 Disponibilidad de Horarios para el ",
                            fecha),
                        React.createElement("span", { className: "text-xs font-normal text-slate-400" }, "Slots de 60 minutos")),
                    React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3" }, HORAS_OPERATIVAS.map((hora) => {
                        const ocupado = comprobarHoraOcupada(hora);
                        const horaFin = `${String(parseInt(hora) + 1).padStart(2, '0')}:00`;
                        return (React.createElement("div", { key: hora, className: `p-4 rounded-xl border text-center transition flex flex-col justify-between space-y-2 ${ocupado
                                ? 'bg-rose-950/40 border-rose-900/60 text-rose-300'
                                : 'glass-card hover:border-emerald-500/60'}` },
                            React.createElement("div", null,
                                React.createElement("span", { className: "block text-sm font-black font-mono" },
                                    hora,
                                    " - ",
                                    horaFin),
                                React.createElement("span", { className: `text-[10px] font-bold ${ocupado ? 'text-rose-400' : 'text-emerald-400'}` }, ocupado ? '🔴 Ocupado' : '🟢 Disponible')),
                            !ocupado ? (React.createElement("button", { onClick: () => iniciarFlujoPago(hora), className: "w-full py-1.5 px-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow transition" }, "Reservar")) : (React.createElement("span", { className: "text-[10px] text-slate-500 font-semibold block py-1.5" }, "No disponible"))));
                    }))),
                React.createElement("div", { className: "glass-panel p-6 rounded-2xl space-y-4" },
                    React.createElement("h2", { className: "text-base font-bold text-white border-b border-slate-800 pb-3" }, "\uD83D\uDCCB Mis Reservas Realizadas"),
                    misReservas.length > 0 ? (React.createElement("div", { className: "space-y-3" }, misReservas.map((r) => (React.createElement("div", { key: r.id, className: "glass-card p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" },
                        React.createElement("div", null,
                            React.createElement("div", { className: "flex items-center gap-2" },
                                React.createElement("span", { className: "font-bold text-white text-sm" },
                                    "Reserva #",
                                    r.id,
                                    " - ",
                                    r.Cancha?.nombre || `Cancha #${r.cancha_id}`),
                                React.createElement("span", { className: `px-2 py-0.5 rounded text-[10px] font-bold ${r.estado === 'APROBADO' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}` }, r.estado)),
                            React.createElement("p", { className: "text-xs text-slate-400 font-mono mt-1" },
                                "\uD83D\uDCC5 ",
                                r.fecha_reserva,
                                " | \uD83D\uDD52 ",
                                r.hora_inicio,
                                " - ",
                                r.hora_fin,
                                " | \uD83D\uDCB0 Total: S/. ",
                                r.total_pago,
                                ".00")),
                        r.estado === 'APROBADO' && (React.createElement("button", { onClick: () => precalcularCancelacion(r), className: "px-3 py-1.5 text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg transition" }, "Cancelaci\u00F3n / Reembolso"))))))) : (React.createElement("p", { className: "text-xs text-slate-400 text-center py-6" }, "A\u00FAn no has realizado ninguna reserva."))))),
            vista === "admin" && usuarioRol === "ADMIN" && (React.createElement("div", { className: "max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8 animate-fade-in" },
                React.createElement("div", { className: "flex justify-between items-center glass-panel p-6 rounded-2xl border-l-4 border-emerald-500" },
                    React.createElement("div", null,
                        React.createElement("h1", { className: "text-xl sm:text-2xl font-bold text-white" }, "\uD83D\uDC51 Panel de Control Administrativo"),
                        React.createElement("p", { className: "text-xs text-slate-400" }, "Gesti\u00F3n de Canchas, Dashboard Financiero y Bit\u00E1cora Global de Transacciones.")),
                    React.createElement("button", { onClick: () => { setVista("reservas"); setSubVistaAdmin(false); }, className: "px-3 py-2 text-xs font-bold glass-card text-slate-300 hover:text-white rounded-xl" }, "\uD83D\uDCC5 Ir a Reservas")),
                React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" },
                    React.createElement("div", { className: "glass-card p-5 rounded-2xl" },
                        React.createElement("span", { className: "text-xs text-slate-400 font-bold block uppercase" }, "Ingresos Totales"),
                        React.createElement("span", { className: "text-2xl font-black text-emerald-400" },
                            "S/. ",
                            (reportData.resumen && reportData.resumen.ingresosTotales) || 0,
                            ".00")),
                    React.createElement("div", { className: "glass-card p-5 rounded-2xl" },
                        React.createElement("span", { className: "text-xs text-slate-400 font-bold block uppercase" }, "P\u00E9rdidas (Reembolsos)"),
                        React.createElement("span", { className: "text-2xl font-black text-rose-400" },
                            "S/. ",
                            (reportData.resumen && reportData.resumen.perdidasReembolsos) || 0,
                            ".00")),
                    React.createElement("div", { className: "glass-card p-5 rounded-2xl" },
                        React.createElement("span", { className: "text-xs text-slate-400 font-bold block uppercase" }, "Penalidades Cobradas"),
                        React.createElement("span", { className: "text-2xl font-black text-cyan-400" },
                            "S/. ",
                            (reportData.resumen && reportData.resumen.penalidadesCobradas) || 0,
                            ".00")),
                    React.createElement("div", { className: "glass-card p-5 rounded-2xl" },
                        React.createElement("span", { className: "text-xs text-slate-400 font-bold block uppercase" }, "Total Reservas"),
                        React.createElement("span", { className: "text-2xl font-black text-white" }, (reportData.resumen && reportData.resumen.conteoReservas) || 0))),
                React.createElement("div", { className: "glass-panel p-6 rounded-2xl space-y-6" },
                    React.createElement("h2", { className: "text-base font-bold text-white border-b border-slate-800 pb-3" },
                        "\uD83C\uDFDF\uFE0F ",
                        editandoCanchaId ? 'Editar Cancha Existente' : 'Crear Nueva Cancha Deportiva'),
                    React.createElement("form", { onSubmit: guardarCancha, className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" },
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-xs font-bold text-slate-400 mb-1" }, "Nombre de la Cancha"),
                            React.createElement("input", { type: "text", required: true, value: nombreCancha, onChange: e => setNombreCancha(e.target.value), placeholder: "Ej: Santiago Bernab\u00E9u", className: "w-full glass-input p-2.5 rounded-xl text-sm" })),
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-xs font-bold text-slate-400 mb-1" }, "Tipo de Suelo"),
                            React.createElement("select", { value: sueloCancha, onChange: e => setSueloCancha(e.target.value), className: "w-full glass-input p-2.5 rounded-xl text-sm" },
                                React.createElement("option", { value: "GRASS", className: "bg-slate-900 text-white" }, "GRASS"),
                                React.createElement("option", { value: "LOSA", className: "bg-slate-900 text-white" }, "LOSA"),
                                React.createElement("option", { value: "SINT\u00C9TICO", className: "bg-slate-900 text-white" }, "SINT\u00C9TICO"))),
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-xs font-bold text-slate-400 mb-1" }, "Precio por Hora (S/.)"),
                            React.createElement("input", { type: "number", required: true, min: "1", value: precioCancha, onChange: e => setPrecioCancha(e.target.value), className: "w-full glass-input p-2.5 rounded-xl text-sm" })),
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-xs font-bold text-slate-400 mb-1" }, "Disciplina Deportiva"),
                            React.createElement("select", { value: deporteCancha, onChange: e => setDeporteCancha(e.target.value), className: "w-full glass-input p-2.5 rounded-xl text-sm" },
                                React.createElement("option", { value: "F\u00DATBOL", className: "bg-slate-900 text-white" }, "F\u00DATBOL"),
                                React.createElement("option", { value: "TENIS", className: "bg-slate-900 text-white" }, "TENIS"),
                                React.createElement("option", { value: "B\u00C1SQUETBOL", className: "bg-slate-900 text-white" }, "B\u00C1SQUETBOL"),
                                React.createElement("option", { value: "V\u00D3LEY", className: "bg-slate-900 text-white" }, "V\u00D3LEY"))),
                        React.createElement("div", { className: "col-span-full flex gap-3" },
                            React.createElement("button", { type: "submit", className: "px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow transition" }, editandoCanchaId ? 'Actualizar Cancha' : 'Guardar Cancha'),
                            editandoCanchaId && (React.createElement("button", { type: "button", onClick: () => setEditandoCanchaId(null), className: "px-4 py-2.5 glass-card text-xs font-bold rounded-xl" }, "Cancelar")))),
                    React.createElement("div", { className: "space-y-3 pt-4" },
                        React.createElement("h3", { className: "text-xs font-bold text-slate-400 uppercase" }, "Gesti\u00F3n de Canchas Registradas"),
                        React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3" }, canchas.map(c => (React.createElement("div", { key: c.id, className: "glass-card p-4 rounded-xl flex items-center justify-between" },
                            React.createElement("div", null,
                                React.createElement("span", { className: "font-bold text-white text-sm block" }, c.nombre),
                                React.createElement("span", { className: "text-xs text-slate-400" },
                                    c.deporte,
                                    " | ",
                                    c.tipo_suelo,
                                    " | S/. ",
                                    c.precio_hora,
                                    "/h")),
                            React.createElement("div", { className: "flex gap-2" },
                                React.createElement("button", { onClick: () => iniciarEdicionCancha(c), className: "text-xs text-cyan-400 hover:text-cyan-300 font-bold" }, "Editar"),
                                React.createElement("button", { onClick: () => deactivarCancha(c.id), className: "text-xs text-rose-400 hover:text-rose-300 font-bold" }, "Desactivar")))))))),
                React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
                    React.createElement("div", { className: "glass-panel p-6 rounded-2xl space-y-4" },
                        React.createElement("h3", { className: "text-sm font-bold text-white" }, "\uD83D\uDCCA Ingresos Totales por Cancha"),
                        React.createElement("canvas", { ref: chartBarrasRef })),
                    React.createElement("div", { className: "glass-panel p-6 rounded-2xl space-y-4" },
                        React.createElement("h3", { className: "text-sm font-bold text-white" }, "\uD83D\uDCC8 Frecuencia de Reservas por Hora"),
                        React.createElement("canvas", { ref: chartLineasRef }))),
                React.createElement("div", { className: "glass-panel p-6 rounded-2xl space-y-4" },
                    React.createElement("h3", { className: "text-sm font-bold text-white border-b border-slate-800 pb-3" }, "\uD83D\uDEE1\uFE0F Bit\u00E1cora de Transacciones Global (Audit Log)"),
                    React.createElement("div", { className: "space-y-3 max-h-[300px] overflow-y-auto pr-2" }, reportData.auditorias.map(log => (React.createElement("div", { key: log.id, className: "p-3 bg-slate-900/80 border-l-4 border-emerald-500 rounded-r-xl text-xs space-y-1" },
                        React.createElement("div", { className: "flex justify-between items-center" },
                            React.createElement("span", { className: "font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20" }, log.accion),
                            React.createElement("span", { className: "text-slate-500 font-mono text-[10px]" }, new Date(log.fecha).toLocaleString())),
                        React.createElement("p", { className: "text-slate-300 font-medium" }, log.detalles),
                        React.createElement("p", { className: "text-[10px] text-slate-400" },
                            "Por: ",
                            (log.Usuario && log.Usuario.nombre) ? log.Usuario.nombre : "Sistema",
                            " (",
                            (log.Usuario && log.Usuario.email) ? log.Usuario.email : "N/A",
                            ")"))))))))),
        React.createElement("footer", { className: "glass-panel border-t border-slate-800/80 py-8 px-4 text-center text-xs text-slate-500 space-y-2" },
            React.createElement("p", { className: "font-semibold text-slate-400" }, "\u26BD CanchaYA \u00A9 2026 - Sistema de Reservas de Canchas Deportivas en Tiempo Real."),
            React.createElement("p", { className: "text-[10px]" }, "Construido con tecnolog\u00EDa de alta disponibilidad y arquitectura Specification-First (Spec Kit).")),
        mostrarAuthModal && (React.createElement("div", { className: "fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" },
            React.createElement("div", { className: "glass-panel border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-md w-full relative shadow-2xl animate-scale-up space-y-6" },
                React.createElement("button", { onClick: () => setMostrarAuthModal(false), className: "absolute top-4 right-4 text-slate-400 hover:text-white text-lg" }, "\u2715"),
                React.createElement("div", { className: "text-center space-y-1" },
                    React.createElement("span", { className: "text-3xl" }, "\u26BD"),
                    React.createElement("h3", { className: "text-xl font-bold text-white" },
                        "Acceso a ",
                        React.createElement("span", { className: "gradient-text" }, "CanchaYA")),
                    React.createElement("p", { className: "text-xs text-slate-400" }, "Inicia sesi\u00F3n o crea una cuenta para reservar en tiempo real")),
                React.createElement("div", { className: "flex bg-slate-900 p-1 rounded-xl border border-slate-800" },
                    React.createElement("button", { onClick: () => setAuthTab("login"), className: `w-1/2 py-2 text-xs font-bold rounded-lg transition ${authTab === 'login' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}` }, "\uD83D\uDD11 Iniciar Sesi\u00F3n"),
                    React.createElement("button", { onClick: () => setAuthTab("registro"), className: `w-1/2 py-2 text-xs font-bold rounded-lg transition ${authTab === 'registro' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}` }, "\u2728 Registrarse")),
                authTab === "login" ? (React.createElement("form", { onSubmit: handleLogin, className: "space-y-4" },
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-slate-400 mb-1" }, "Correo Electr\u00F3nico"),
                        React.createElement("input", { type: "email", required: true, value: email, onChange: e => setEmail(e.target.value), placeholder: "tu@correo.com", className: "w-full glass-input p-3 rounded-xl text-sm" })),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-slate-400 mb-1" }, "Contrase\u00F1a"),
                        React.createElement("input", { type: "password", required: true, value: password, onChange: e => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", className: "w-full glass-input p-3 rounded-xl text-sm" })),
                    React.createElement("button", { type: "submit", className: "w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95" }, "Ingresar a mi Cuenta"))) : (React.createElement("form", { onSubmit: handleRegister, className: "space-y-4" },
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-slate-400 mb-1" }, "Nombre Completo"),
                        React.createElement("input", { type: "text", required: true, value: nombre, onChange: e => setNombre(e.target.value), placeholder: "Ej: Carlos Silva", className: "w-full glass-input p-3 rounded-xl text-sm" })),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-slate-400 mb-1" }, "Correo Electr\u00F3nico"),
                        React.createElement("input", { type: "email", required: true, value: email, onChange: e => setEmail(e.target.value), placeholder: "tu@correo.com", className: "w-full glass-input p-3 rounded-xl text-sm" })),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-slate-400 mb-1" }, "Contrase\u00F1a"),
                        React.createElement("input", { type: "password", required: true, value: password, onChange: e => setPassword(e.target.value), placeholder: "M\u00EDnimo 6 caracteres", className: "w-full glass-input p-3 rounded-xl text-sm" })),
                    React.createElement("button", { type: "submit", className: "w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95" }, "Crear Mi Cuenta"))),
                React.createElement("div", { className: "pt-2 border-t border-slate-800 space-y-2" },
                    React.createElement("span", { className: "block text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider" }, "\u26A1 Autocompletar Cuenta de Prueba"),
                    React.createElement("div", { className: "grid grid-cols-3 gap-2" },
                        React.createElement("button", { onClick: () => { setEmail("admin@canchaya.com"); setPassword("123456"); setAuthTab("login"); }, className: "p-2 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-[10px] font-bold text-emerald-400 text-center" }, "\uD83D\uDC51 Admin"),
                        React.createElement("button", { onClick: () => { setEmail("juan@gmail.com"); setPassword("123456"); setAuthTab("login"); }, className: "p-2 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-[10px] font-bold text-cyan-400 text-center" }, "\u26BD Juan"),
                        React.createElement("button", { onClick: () => { setEmail("lionel.messi@canchaya.com"); setPassword("123456"); setAuthTab("login"); }, className: "p-2 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-[10px] font-bold text-purple-400 text-center" }, "\uD83C\uDF1F Messi")))))),
        mostrarPasarela && slotParaReservar && (React.createElement("div", { className: "fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50" },
            React.createElement("div", { className: "glass-panel border border-slate-700 rounded-3xl p-6 max-w-md w-full relative animate-scale-up space-y-4" },
                React.createElement("h3", { className: "text-lg font-bold text-white" }, "\uD83D\uDCB3 Checkout Pasarela CanchaYA"),
                React.createElement("p", { className: "text-xs text-slate-400" },
                    "Tu slot expira en: ",
                    React.createElement("span", { className: "font-bold text-orange-400 font-mono" },
                        Math.floor(tiempoRestante / 60),
                        ":",
                        (tiempoRestante % 60).toString().padStart(2, '0'))),
                React.createElement("form", { onSubmit: ejecutarPagoYReserva, className: "space-y-4" },
                    React.createElement("div", null,
                        React.createElement("label", { className: "text-[10px] font-bold text-slate-400 uppercase" }, "N\u00FAmero de Tarjeta"),
                        React.createElement("input", { type: "text", required: true, placeholder: "4111 2222 3333 4444", className: "w-full p-2.5 glass-input rounded-xl text-sm font-mono" })),
                    React.createElement("div", { className: "grid grid-cols-2 gap-3" },
                        React.createElement("div", null,
                            React.createElement("label", { className: "text-[10px] font-bold text-slate-400 uppercase" }, "Expira"),
                            React.createElement("input", { type: "text", required: true, placeholder: "MM/YY", className: "w-full p-2.5 glass-input rounded-xl text-sm" })),
                        React.createElement("div", null,
                            React.createElement("label", { className: "text-[10px] font-bold text-slate-400 uppercase" }, "CVV"),
                            React.createElement("input", { type: "password", required: true, placeholder: "123", className: "w-full p-2.5 glass-input rounded-xl text-sm" }))),
                    React.createElement("div", { className: "flex gap-3 pt-2" },
                        React.createElement("button", { type: "button", onClick: () => { setMostrarPasarela(false); setSlotParaReservar(null); agregarNotificacion("Reserva cancelada voluntariamente.", "info"); }, className: "w-1/3 glass-card p-2.5 rounded-xl text-xs font-bold text-slate-300" }, "Cancelar"),
                        React.createElement("button", { type: "submit", disabled: procesandoPago, className: "w-2/3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-2.5 rounded-xl font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition" }, procesandoPago ? "Procesando..." : `Pagar S/. ${slotParaReservar.total}.00`)))))),
        mostrarConfirmarCancelacion && reservaParaCancelar && (React.createElement("div", { className: "fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50" },
            React.createElement("div", { className: "glass-panel border border-rose-500/50 rounded-3xl p-6 max-w-md w-full relative animate-scale-up space-y-4" },
                React.createElement("h3", { className: "text-lg font-bold text-white mb-2" }, "\u26A0\uFE0F Confirmar Cancelaci\u00F3n"),
                React.createElement("p", { className: "text-xs text-slate-300 mb-4" }, "Esta acci\u00F3n no se puede deshacer y aplica la pol\u00EDtica de cancelaci\u00F3n de CanchaYA."),
                React.createElement("div", { className: "bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 text-xs mb-6" },
                    React.createElement("p", null,
                        React.createElement("span", { className: "font-bold text-slate-400" }, "Reserva:"),
                        " #00",
                        reservaParaCancelar.id),
                    React.createElement("p", null,
                        React.createElement("span", { className: "font-bold text-slate-400" }, "Total Pagado:"),
                        " S/. ",
                        reservaParaCancelar.total_pago,
                        ".00"),
                    React.createElement("hr", { className: "border-slate-800" }),
                    React.createElement("div", { className: "space-y-1" },
                        React.createElement("p", { className: "text-emerald-400 font-semibold" },
                            "\uD83D\uDCB0 Reembolso Estimado: S/. ",
                            cancellationOutcomes.reembolso,
                            ".00"),
                        React.createElement("p", { className: "text-rose-400 font-semibold" },
                            "\u26A0\uFE0F Penalidad Aplicada: S/. ",
                            cancellationOutcomes.penalidad,
                            ".00"))),
                React.createElement("div", { className: "flex gap-3" },
                    React.createElement("button", { type: "button", onClick: () => { setMostrarConfirmarCancelacion(false); setReservaParaCancelar(null); }, className: "w-1/2 glass-card p-2.5 rounded-xl text-xs font-bold text-slate-300" }, "Regresar"),
                    React.createElement("button", { onClick: ejecutarCancelacion, className: "w-1/2 bg-rose-600 hover:bg-rose-500 text-white p-2.5 rounded-xl font-bold text-xs transition shadow-md" }, "Confirmar Cancelaci\u00F3n"))))),
        React.createElement("div", { className: "fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none" }, notificaciones.map(n => (React.createElement("div", { key: n.id, className: `p-4 rounded-2xl shadow-2xl border text-xs font-bold w-72 pointer-events-auto flex items-center justify-between transition-all duration-300 animate-slide-in
                        ${n.tipo === 'success' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' : n.tipo === 'error' ? 'bg-rose-950/90 text-rose-300 border-rose-500/40' : 'bg-cyan-950/90 text-cyan-300 border-cyan-500/40'}` },
            React.createElement("span", null, n.texto),
            React.createElement("button", { onClick: () => setNotificaciones(prev => prev.filter(item => item.id !== n.id)), className: "text-xs opacity-60 hover:opacity-100 ml-2" }, "\u2715")))))));
}
// Render root
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App, null));
