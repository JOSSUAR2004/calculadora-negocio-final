import React, { useState, useEffect } from 'react';

const App = () => {
  // ==========================================
  // 1. ESTADO Y PERSISTENCIA (SISTEMA GOL93)
  // ==========================================
  const [tasaCOP, setTasaCOP] = useState(() => JSON.parse(localStorage.getItem('g93_tasa')) || 3950);
  const [modo, setModo] = useState('camisetas'); 
  const [historial, setHistorial] = useState(() => JSON.parse(localStorage.getItem('g93_historial')) || []);
  const [stock, setStock] = useState(() => JSON.parse(localStorage.getItem('g93_stock')) || []);
  const [deudas, setDeudas] = useState(() => JSON.parse(localStorage.getItem('g93_deudas')) || []);
  
  // Estados de UI
  const [loteAbierto, setLoteAbierto] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [notificacion, setNotificacion] = useState(null);

  // Efecto de persistencia
  useEffect(() => {
    localStorage.setItem('g93_tasa', JSON.stringify(tasaCOP));
    localStorage.setItem('g93_historial', JSON.stringify(historial));
    localStorage.setItem('g93_stock', JSON.stringify(stock));
    localStorage.setItem('g93_deudas', JSON.stringify(deudas));
  }, [tasaCOP, historial, stock, deudas]);

  // ==========================================
  // 2. CONFIGURACIÓN LOGÍSTICA (IMPORT FLOW)
  // ==========================================
  const LOGISTICA = {
    COSTO_LIBRA: 3.10,
    ENVIO_CHINA_USA: 10.00,
    CARGOS_FIJOS_USA: 7.00,
    PESO_PAR_GUAYOS: 1.32,
    COMISION_VENTA: 0.05 
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
  // 3. ESTADOS DE FORMULARIO
  // ==========================================
  const [formJersey, setFormJersey] = useState({
    nombre: '', tipo: 'player', parches: 0, dorsal: false, talla: 'L', cliente: ''
  });

  const [formZapato, setFormZapato] = useState({
    nombre: '', costoUSD: '', margen: 25, cantidadCaja: 10, talla: '40', cliente: ''
  });

  const [formDeuda, setFormDeuda] = useState({ cliente: '', monto: '', concepto: '' });

  // ==========================================
  // 4. MOTOR DE CÁLCULO LOGÍSTICO
  // ==========================================
  const calcularMetricas = (datos, categoria) => {
    let res = {
      costoUSD: 0, costoCOP: 0, venta: 0, ganancia: 0, 
      detalleEnvio: { flete: 0, peso: 0 }
    };

    if (categoria === 'zapato') {
      const fleteUnitario = (LOGISTICA.ENVIO_CHINA_USA + LOGISTICA.CARGOS_FIJOS_USA) / datos.cantidadCaja;
      const pesoUnitario = LOGISTICA.PESO_PAR_GUAYOS * LOGISTICA.COSTO_LIBRA;
      
      res.costoUSD = parseFloat(datos.costoUSD) + fleteUnitario + pesoUnitario;
      res.costoCOP = res.costoUSD * tasaCOP;
      res.venta = res.costoCOP / (1 - (datos.margen / 100));
      res.ganancia = res.venta - res.costoCOP;
      res.detalleEnvio = { flete: fleteUnitario, peso: pesoUnitario };
    } else {
      const base = PRECIOS_BASE[datos.tipo];
      const extra = (datos.dorsal ? 1 : 0) + (parseInt(datos.parches) || 0);
      res.costoUSD = base.costo + extra;
      res.costoCOP = res.costoUSD * tasaCOP;
      res.venta = base.venta;
      res.ganancia = base.venta - res.costoCOP;
    }
    return res;
  };

  // ==========================================
  // 5. FUNCIONES DE ACCIÓN
  // ==========================================
  const handleGuardar = (cat) => {
    const data = cat === 'zapato' ? formZapato : formJersey;
    if (!data.nombre) return msg("Falta el nombre de la referencia");

    const metricas = calcularMetricas(data, cat);
    const item = {
      id: Date.now(),
      fecha: new Date().toLocaleString(),
      cat,
      nombre: data.nombre,
      talla: data.talla,
      cliente: data.cliente || 'Stock',
      metricas,
      detalleOriginal: data
    };

    setHistorial([item, ...historial]);
    if (!data.cliente) setStock([{ id: Date.now(), ...item }, ...stock]);
    
    // Limpieza
    cat === 'zapato' ? setFormZapato({...formZapato, nombre: '', costoUSD: ''}) : 
                     setFormJersey({...formJersey, nombre: '', parches: 0, dorsal: false});
    msg("¡Registro exitoso!");
  };

  const agregarDeuda = () => {
    if (!formDeuda.cliente || !formDeuda.monto) return msg("Datos incompletos");
    setDeudas([{ id: Date.now(), ...formDeuda }, ...deudas]);
    setFormDeuda({ cliente: '', monto: '', concepto: '' });
    msg("Deuda registrada");
  };

  const msg = (m) => { setNotificacion(m); setTimeout(() => setNotificacion(null), 3000); };
  const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  // ==========================================
  // 6. RENDERIZADO DE COMPONENTES
  // ==========================================
  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 font-sans p-2 md:p-6">
      
      {/* ALERTA */}
      {notificacion && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-full shadow-2xl z-50 font-black text-xs uppercase tracking-widest animate-bounce">
          {notificacion}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        
        {/* HEADER GOL93 */}
        <header className="bg-white rounded-[2.5rem] p-6 mb-8 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-black italic shadow-lg shadow-indigo-200 text-xl">G93</div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">Gol93<span className="text-indigo-600">Store</span></h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculadora de Importación</span>
              </div>
            </div>
          </div>

          <nav className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
            {['camisetas', 'zapatos', 'stock', 'deudas'].map(t => (
              <button key={t} onClick={() => setModo(t)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${modo === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
            ))}
          </nav>

          <div className="bg-indigo-50 border border-indigo-100 px-6 py-3 rounded-2xl">
            <label className="block text-[8px] font-black text-indigo-400 uppercase">TRM Hoy</label>
            <input type="number" value={tasaCOP} onChange={e => setTasaCOP(e.target.value)} className="bg-transparent font-black text-indigo-700 text-lg outline-none w-24" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* PANEL DE ACCIÓN (FORMULARIOS) */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100">
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] mb-8">Nueva Operación</h2>

              {modo === 'camisetas' && (
                <div className="space-y-5">
                  <Input label="Referencia" value={formJersey.nombre} onChange={v => setFormJersey({...formJersey, nombre: v})} placeholder="Ej: Real Madrid Local" />
                  <div className="grid grid-cols-2 gap-4">
                    <Select label="Calidad" value={formJersey.tipo} onChange={v => setFormJersey({...formJersey, tipo: v})} options={Object.keys(PRECIOS_BASE)} />
                    <Select label="Talla" value={formJersey.talla} onChange={v => setFormJersey({...formJersey, talla: v})} options={['S', 'M', 'L', 'XL', 'XXL']} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <Input label="Parches" type="number" value={formJersey.parches} onChange={v => setFormJersey({...formJersey, parches: v})} />
                    <button onClick={() => setFormJersey({...formJersey, dorsal: !formJersey.dorsal})} className={`h-[52px] rounded-2xl font-black text-[10px] border-2 transition-all ${formJersey.dorsal ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-300'}`}>DORSAL (+1$)</button>
                  </div>
                  <Input label="Cliente (Opcional)" value={formJersey.cliente} onChange={v => setFormJersey({...formJersey, cliente: v})} placeholder="Vacío = Stock" />
                  <button onClick={() => handleGuardar('camiseta')} className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase text-[11px] shadow-xl hover:translate-y-[-2px] transition-all active:scale-95 mt-4">Guardar Jersey</button>
                </div>
              )}

              {modo === 'zapatos' && (
                <div className="space-y-5">
                  <Input label="Referencia" value={formZapato.nombre} onChange={v => setFormZapato({...formZapato, nombre: v})} placeholder="Ej: Predator Elite FG" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Costo China (USD)" type="number" value={formZapato.costoUSD} onChange={v => setFormZapato({...formZapato, costoUSD: v})} />
                    <Input label="Margen (%)" type="number" value={formZapato.margen} onChange={v => setFormZapato({...formZapato, margen: v})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Pares/Caja" type="number" value={formZapato.cantidadCaja} onChange={v => setFormZapato({...formZapato, cantidadCaja: v})} />
                    <Select label="Talla" value={formZapato.talla} onChange={v => setFormZapato({...formZapato, talla: v})} options={['38', '39', '40', '41', '42', '43', '44']} />
                  </div>
                  <Input label="Cliente" value={formZapato.cliente} onChange={v => setFormZapato({...formZapato, cliente: v})} />
                  <button onClick={() => handleGuardar('zapato')} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase text-[11px] shadow-xl mt-4">Registrar Guayos</button>
                </div>
              )}

              {modo === 'deudas' && (
                <div className="space-y-5">
                  <Input label="Nombre del Cliente" value={formDeuda.cliente} onChange={v => setFormDeuda({...formDeuda, cliente: v})} />
                  <Input label="Monto Pendiente" type="number" value={formDeuda.monto} onChange={v => setFormDeuda({...formDeuda, monto: v})} />
                  <Input label="Concepto" value={formDeuda.concepto} onChange={v => setFormDeuda({...formDeuda, concepto: v})} />
                  <button onClick={agregarDeuda} className="w-full bg-red-500 text-white p-5 rounded-2xl font-black uppercase text-[11px] shadow-xl mt-4">Crear Deuda</button>
                </div>
              )}
            </div>

            {/* DASHBOARD CARD */}
            <div className="bg-indigo-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Cartera Pendiente</p>
                <h3 className="text-4xl font-black tracking-tighter">{fmt(deudas.reduce((a, b) => a + parseFloat(b.monto || 0), 0))}</h3>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-800 rounded-full blur-3xl opacity-50 -mr-10 -mt-10"></div>
            </div>
          </aside>

          {/* PANEL PRINCIPAL (HISTORIAL) */}
          <main className="lg:col-span-8 space-y-6">
            
            {/* BUSCADOR */}
            <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl text-slate-400 font-bold text-lg">🔍</div>
              <input 
                type="text" 
                placeholder="Buscar por equipo, guayo o cliente..." 
                className="bg-transparent flex-1 outline-none font-bold text-sm"
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>

            {/* LISTADO DE ACTIVIDAD */}
            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <h2 className="text-sm font-black uppercase text-slate-800 tracking-tight">Registro General</h2>
                <p className="text-[10px] font-bold text-slate-400 italic">Datos históricos Gol93</p>
              </div>

              <div className="divide-y divide-slate-50">
                {historial
                  .filter(h => h.nombre.toLowerCase().includes(busqueda.toLowerCase()) || h.cliente.toLowerCase().includes(busqueda.toLowerCase()))
                  .map(item => (
                  <div key={item.id} className="group hover:bg-slate-50 transition-colors">
                    <div 
                      onClick={() => setLoteAbierto(loteAbierto === item.id ? null : item.id)}
                      className="p-8 flex flex-wrap items-center justify-between gap-6 cursor-pointer"
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xs shadow-sm ${item.cat === 'zapato' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {item.talla}
                        </div>
                        <div>
                          <h4 className="font-black text-sm uppercase text-slate-800">{item.nombre}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.fecha}</span>
                            <span className="text-[10px] font-black text-indigo-400 uppercase">{item.cliente}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-600 font-black text-xl tracking-tighter">+{fmt(item.metricas.ganancia)}</p>
                        <p className="text-[8px] font-black text-slate-300 uppercase">Detalle de Costos</p>
                      </div>
                    </div>

                    {/* ACORDEÓN DE AUDITORÍA DETALLADA */}
                    {loteAbierto === item.id && (
                      <div className="px-8 pb-8 pt-2 animate-in slide-in-from-top duration-300">
                        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-inner grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase">Costo Inversión</p>
                            <p className="font-black text-slate-700 text-lg">{fmt(item.metricas.costoCOP)}</p>
                            <p className="text-[10px] font-bold text-slate-400 tracking-tight">Costo Unitario: ${item.metricas.costoUSD.toFixed(2)} USD</p>
                          </div>
                          <div className="space-y-1 border-x border-slate-100 px-8">
                            <p className="text-[9px] font-black text-slate-400 uppercase">Precio de Venta</p>
                            <p className="font-black text-indigo-600 text-lg">{fmt(item.metricas.venta)}</p>
                            <p className="text-[10px] font-black text-emerald-500 uppercase">Margen: {Math.round((item.metricas.ganancia / item.metricas.venta) * 100)}%</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase">Logística Aplicada</p>
                            {item.cat === 'zapato' ? (
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-600 uppercase">Flete China-USA: ${item.metricas.detalleEnvio.flete.toFixed(2)}</p>
                                <p className="text-[10px] font-bold text-slate-600 uppercase">Peso Bodega Col: ${item.metricas.detalleEnvio.peso.toFixed(2)}</p>
                              </div>
                            ) : (
                              <p className="text-[10px] font-bold text-slate-500 uppercase">Tarifa Estándar Jersey</p>
                            )}
                          </div>
                          <button 
                            onClick={() => setHistorial(historial.filter(h => h.id !== item.id))}
                            className="absolute top-4 right-4 text-red-300 hover:text-red-500 transition-colors font-black text-[10px] uppercase"
                          >
                            Eliminar Registro
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {historial.length === 0 && <div className="p-20 text-center font-black text-slate-300 uppercase italic text-xs tracking-[0.3em]">No hay actividad registrada</div>}
              </div>
            </div>

            {/* SECCIÓN STOCK (SI MODO ES STOCK) */}
            {modo === 'stock' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-in zoom-in-95 duration-300">
                {stock.map(s => (
                  <div key={s.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{s.cat}</p>
                    <h5 className="font-black text-[11px] uppercase text-slate-800 leading-tight mb-4">{s.nombre}</h5>
                    <div className="flex justify-between items-center">
                      <span className="bg-slate-100 px-3 py-1 rounded-lg font-black text-[10px] text-slate-500">T{s.talla}</span>
                      <button onClick={() => setStock(stock.filter(i => i.id !== s.id))} className="text-red-400 hover:text-red-600 font-bold text-lg">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENTES DE UI REUTILIZABLES
// ==========================================
const Input = ({ label, onChange, ...props }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-widest">{label}</label>
    <input 
      {...props} 
      onChange={e => onChange(e.target.value)} 
      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none font-bold text-slate-700 text-sm focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-200" 
    />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-widest">{label}</label>
    <select 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none font-bold text-slate-700 text-sm focus:border-indigo-500 focus:bg-white transition-all uppercase cursor-pointer"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

export default App;