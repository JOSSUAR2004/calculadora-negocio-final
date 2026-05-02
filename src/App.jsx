import React, { useState, useEffect } from 'react';

const App = () => {
  // ==========================================
  // 1. ESTADO Y PERSISTENCIA (Lógica Original)
  // ==========================================
  const [tasaCOP, setTasaCOP] = useState(() => JSON.parse(localStorage.getItem('g93_tasa')) || 3950);
  const [modo, setModo] = useState('camisetas'); 
  const [historial, setHistorial] = useState(() => JSON.parse(localStorage.getItem('g93_historial')) || []);
  const [stock, setStock] = useState(() => JSON.parse(localStorage.getItem('g93_stock')) || []);
  const [deudas, setDeudas] = useState(() => JSON.parse(localStorage.getItem('g93_deudas')) || []);
  
  // Estados de Interfaz
  const [loteAbierto, setLoteAbierto] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [notificacion, setNotificacion] = useState(null);

  useEffect(() => {
    localStorage.setItem('g93_tasa', JSON.stringify(tasaCOP));
    localStorage.setItem('g93_historial', JSON.stringify(historial));
    localStorage.setItem('g93_stock', JSON.stringify(stock));
    localStorage.setItem('g93_deudas', JSON.stringify(deudas));
  }, [tasaCOP, historial, stock, deudas]);

  // ==========================================
  // 2. CONSTANTES DE IMPORTACIÓN (China -> Col)
  // ==========================================
  const LOGISTICA = {
    COSTO_LIBRA: 3.10,
    ENVIO_CHINA_USA: 10.00,
    CARGOS_FIJOS_USA: 7.00,
    PESO_PAR_GUAYOS: 1.32, // Libras
    COMISION_PASARELA: 0.05 // 5% para pagos digitales
  };

  const PRECIOS_BASE = {
    fan: { costo: 13, venta: 125000 },
    player: { costo: 16, venta: 140000 },
    retro: { costo: 17, venta: 150000 },
    longSleeve: { costo: 17, venta: 155000 },
    children: { costo: 15, venta: 110000 },
    nba: { costo: 23, venta: 180000 },
    f1_nfl: { costo: 25, venta: 195000 }
  };

  // ==========================================
  // 3. FORMULARIOS (Estructura Extendida)
  // ==========================================
  const [formJersey, setFormJersey] = useState({
    nombre: '',
    tipo: 'player',
    parches: 0,
    dorsal: false,
    talla: 'L',
    cliente: ''
  });

  const [formZapato, setFormZapato] = useState({
    nombre: '',
    costoUSD: '',
    margen: 25,
    cantidadCaja: 10,
    talla: '40',
    cliente: ''
  });

  const [formDeuda, setFormDeuda] = useState({ cliente: '', monto: '', concepto: '' });

  // ==========================================
  // 4. MOTOR DE CÁLCULO (Lógica Intacta)
  // ==========================================
  const ejecutarCalculo = (datos, categoria) => {
    let resultado = {
      costoTotalUSD: 0,
      costoTotalCOP: 0,
      precioSugerido: 0,
      gananciaNeta: 0,
      detallesEnvio: {}
    };

    if (categoria === 'zapato') {
      // Lógica de importación con prorrateo de caja
      const fleteIndividual = (LOGISTICA.ENVIO_CHINA_USA + LOGISTICA.CARGOS_FIJOS_USA) / datos.cantidadCaja;
      const pesoIndividual = LOGISTICA.PESO_PAR_GUAYOS * LOGISTICA.COSTO_LIBRA;
      
      resultado.costoTotalUSD = parseFloat(datos.costoUSD) + fleteIndividual + pesoIndividual;
      resultado.costoTotalCOP = resultado.costoTotalUSD * tasaCOP;
      resultado.precioSugerido = resultado.costoTotalCOP / (1 - (datos.margen / 100));
      resultado.gananciaNeta = resultado.precioSugerido - resultado.costoTotalCOP;
      resultado.detallesEnvio = { flete: fleteIndividual, peso: pesoIndividual };
    } else {
      // Lógica de Jerseys con adicionales
      const base = PRECIOS_BASE[datos.tipo];
      const adicionales = (datos.dorsal ? 1 : 0) + (parseInt(datos.parches) || 0);
      
      resultado.costoTotalUSD = base.costo + adicionales;
      resultado.costoTotalCOP = resultado.costoTotalUSD * tasaCOP;
      resultado.precioSugerido = base.venta;
      resultado.gananciaNeta = base.venta - resultado.costoTotalCOP;
    }

    return resultado;
  };

  // ==========================================
  // 5. ACCIONES DE REGISTRO
  // ==========================================
  const guardarTransaccion = (categoria) => {
    const dataForm = categoria === 'zapato' ? formZapato : formJersey;
    if (!dataForm.nombre) return mostrarAviso("Falta el nombre de la referencia");

    const calculos = ejecutarCalculo(dataForm, categoria);
    const nuevaEntrada = {
      id: Date.now(),
      fecha: new Date().toLocaleString(),
      categoria,
      referencia: dataForm.nombre,
      talla: dataForm.talla,
      cliente: dataForm.cliente || 'Venta Local',
      metricas: calculos,
      estado: 'completado'
    };

    setHistorial([nuevaEntrada, ...historial]);
    
    // Si no tiene cliente, se asume que va a Stock
    if (!dataForm.cliente) {
      setStock([{ id: Date.now(), ref: dataForm.nombre, talla: dataForm.talla, tipo: categoria }, ...stock]);
    }

    // Reset Forms
    if (categoria === 'zapato') setFormZapato({ ...formZapato, nombre: '', costoUSD: '' });
    else setFormJersey({ ...formJersey, nombre: '', parches: 0, dorsal: false });
    
    mostrarAviso("Registro guardado con éxito");
  };

  const mostrarAviso = (msg) => {
    setNotificacion(msg);
    setTimeout(() => setNotificacion(null), 3000);
  };

  const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  // ==========================================
  // 6. RENDERIZADO DE INTERFAZ
  // ==========================================
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased pb-20">
      
      {/* NOTIFICACIÓN FLOTANTE */}
      {notificacion && (
        <div className="fixed top-5 right-5 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 animate-bounce text-xs font-black uppercase tracking-widest">
          {notificacion}
        </div>
      )}

      {/* HEADER PREMIUM */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 rotate-3">
              <span className="text-white font-black italic text-xl">G93</span>
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter leading-none">Gol93 <span className="text-indigo-600">Admin</span></h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Engineering Dashboard</span>
            </div>
          </div>

          <nav className="hidden md:flex bg-slate-100 p-1.5 rounded-2xl gap-1">
            {['camisetas', 'zapatos', 'stock', 'deudas'].map(t => (
              <button 
                key={t} 
                onClick={() => setModo(t)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${modo === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4 bg-indigo-50/50 p-2 px-4 rounded-2xl border border-indigo-100">
            <div className="text-right">
              <p className="text-[8px] font-black text-indigo-400 uppercase">Tasa de Cambio</p>
              <input 
                type="number" 
                value={tasaCOP} 
                onChange={e => setTasaCOP(e.target.value)}
                className="bg-transparent font-black text-indigo-700 w-20 outline-none text-lg"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* PANEL IZQUIERDO: FORMULARIOS */}
          <section className="lg:col-span-4 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">Nueva Entrada</h2>
                <span className={`w-3 h-3 rounded-full animate-pulse ${modo === 'zapatos' ? 'bg-orange-400' : 'bg-indigo-400'}`}></span>
              </div>

              {modo === 'camisetas' && (
                <div className="space-y-5">
                  <Input label="Equipo / Referencia" value={formJersey.nombre} onChange={v => setFormJersey({...formJersey, nombre: v})} placeholder="Ej: Liverpool Local 24/25" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase px-1">Calidad</label>
                      <select value={formJersey.tipo} onChange={e => setFormJersey({...formJersey, tipo: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-indigo-100">
                        {Object.keys(PRECIOS_BASE).map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase px-1">Talla</label>
                      <select value={formJersey.talla} onChange={e => setFormJersey({...formJersey, talla: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-sm outline-none">
                        {['S', 'M', 'L', 'XL', 'XXL'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Parches" type="number" value={formJersey.parches} onChange={v => setFormJersey({...formJersey, parches: v})} />
                    <button 
                      onClick={() => setFormJersey({...formJersey, dorsal: !formJersey.dorsal})}
                      className={`mt-6 rounded-2xl font-black text-[10px] transition-all border-2 ${formJersey.dorsal ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-300'}`}
                    >
                      {formJersey.dorsal ? 'CON DORSAL (+1 USD)' : 'SIN DORSAL'}
                    </button>
                  </div>
                  <Input label="Nombre del Cliente (Opcional)" value={formJersey.cliente} onChange={v => setFormJersey({...formJersey, cliente: v})} placeholder="Dejar vacío para Stock" />
                  <button onClick={() => guardarTransaccion('camiseta')} className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase text-[11px] shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all">Registrar Jersey</button>
                </div>
              )}

              {modo === 'zapatos' && (
                <div className="space-y-5">
                  <Input label="Referencia de Guayo" value={formZapato.nombre} onChange={v => setFormZapato({...formZapato, nombre: v})} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Costo China (USD)" type="number" value={formZapato.costoUSD} onChange={v => setFormZapato({...formZapato, costoUSD: v})} />
                    <Input label="Margen (%)" type="number" value={formZapato.margen} onChange={v => setFormZapato({...formZapato, margen: v})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Cant. en Caja" type="number" value={formZapato.cantidadCaja} onChange={v => setFormZapato({...formZapato, cantidadCaja: v})} />
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase px-1">Talla</label>
                      <select value={formZapato.talla} onChange={e => setFormZapato({...formZapato, talla: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-sm outline-none">
                        {['38', '39', '40', '41', '42', '43'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <Input label="Cliente" value={formZapato.cliente} onChange={v => setFormZapato({...formZapato, cliente: v})} />
                  <button onClick={() => guardarTransaccion('zapato')} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase text-[11px] shadow-xl hover:bg-slate-800 transition-all">Registrar Importación</button>
                </div>
              )}
            </div>

            {/* RESUMEN RÁPIDO DE CARTERA */}
            <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase text-indigo-300 mb-2">Total Pendiente Cobro</p>
                <h3 className="text-4xl font-black tracking-tighter">{fmt(deudas.reduce((acc, d) => acc + (parseFloat(d.monto) || 0), 0))}</h3>
              </div>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-800 rounded-full blur-3xl opacity-50"></div>
            </div>
          </section>

          {/* PANEL DERECHO: HISTORIAL Y TABLAS */}
          <section className="lg:col-span-8 space-y-6">
            
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight">Actividad Reciente</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase italic">Auditoría de costos y utilidades</p>
                </div>
                <div className="relative w-full md:w-64">
                  <input 
                    type="text" 
                    placeholder="Buscar referencia..." 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-10 text-xs font-bold outline-none focus:ring-2 ring-indigo-50"
                    onChange={e => setBusqueda(e.target.value)}
                  />
                  <span className="absolute left-4 top-3.5 opacity-20">🔍</span>
                </div>
              </div>

              <div className="divide-y divide-slate-50">
                {historial
                  .filter(i => i.referencia.toLowerCase().includes(busqueda.toLowerCase()))
                  .map(item => (
                  <div key={item.id} className="group transition-all hover:bg-slate-50/50">
                    <div 
                      onClick={() => setLoteAbierto(loteAbierto === item.id ? null : item.id)}
                      className="p-8 flex flex-wrap items-center justify-between gap-6 cursor-pointer"
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-[10px] shadow-sm ${item.categoria === 'zapato' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {item.talla}
                        </div>
                        <div>
                          <h4 className="font-black text-sm uppercase text-slate-800 leading-tight">{item.referencia}</h4>
                          <div className="flex gap-3 mt-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.fecha}</span>
                            <span className="text-[9px] font-black text-indigo-400 uppercase">{item.cliente}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-600 font-black text-lg tracking-tighter">+{fmt(item.metricas.gananciaNeta)}</p>
                        <p className="text-[8px] font-black text-slate-300 uppercase">Ganancia Estimada</p>
                      </div>
                    </div>

                    {/* DESGLOSE MATEMÁTICO (LO QUE PIDIÓ EL USUARIO) */}
                    {loteAbierto === item.id && (
                      <div className="px-8 pb-8 animate-in fade-in slide-in-from-top duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-inner">
                          <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Inversión (COP)</p>
                            <p className="font-bold text-slate-700 text-sm">{fmt(item.metricas.costoTotalCOP)}</p>
                            <p className="text-[10px] text-slate-400 font-medium">Equivale a ${item.metricas.costoTotalUSD.toFixed(2)} USD</p>
                          </div>
                          <div className="space-y-1 border-x border-slate-50 px-4">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Precio Venta</p>
                            <p className="font-black text-indigo-600 text-sm">{fmt(item.metricas.precioSugerido)}</p>
                            <p className="text-[10px] text-emerald-500 font-bold uppercase">Margen: {Math.round((item.metricas.gananciaNeta / item.metricas.precioSugerido) * 100)}%</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Logística Detalle</p>
                            {item.categoria === 'zapato' ? (
                              <div className="text-[10px] font-bold text-slate-500">
                                <p>Flete: ${item.metricas.detallesEnvio.flete.toFixed(2)} USD</p>
                                <p>Peso: ${item.metricas.detallesEnvio.peso.toFixed(2)} USD</p>
                              </div>
                            ) : (
                              <p className="text-[10px] font-bold text-slate-500 uppercase">Tarifa Plana Importación</p>
                            )}
                          </div>
                          <div className="col-span-full pt-4 border-t border-slate-50 flex justify-between">
                            <button onClick={() => setHistorial(historial.filter(h => h.id !== item.id))} className="text-red-400 hover:text-red-600 text-[10px] font-black uppercase transition-colors">Eliminar Registro permanentemente</button>
                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">G93-SYS-REF-{item.id}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SECCIÓN DE STOCK (TABLA) */}
            {modo === 'stock' && (
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 animate-in zoom-in-95 duration-300">
                <h3 className="text-sm font-black uppercase mb-6 text-slate-400 tracking-widest">Inventario en Bodega</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {stock.map(s => (
                    <div key={s.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 relative group">
                      <p className="font-black text-xs uppercase text-slate-700 truncate">{s.ref}</p>
                      <p className="text-[10px] font-bold text-indigo-500">Talla {s.talla}</p>
                      <button 
                        onClick={() => setStock(stock.filter(item => item.id !== s.id))}
                        className="absolute -top-2 -right-2 bg-white shadow-md text-red-500 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

// COMPONENTE DE INPUT REUTILIZABLE
const Input = ({ label, onChange, ...props }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-wider">{label}</label>
    <input 
      {...props} 
      onChange={e => onChange(e.target.value)} 
      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none font-bold text-slate-700 text-sm focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-300" 
    />
  </div>
);

export default App;