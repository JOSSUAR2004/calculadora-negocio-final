import React, { useState, useEffect } from 'react';

const App = () => {
  // ==========================================
  // 1. ESTADO Y PERSISTENCIA (SISTEMA GOL93)
  // ==========================================
  const [tasaCOP, setTasaCOP] = useState(() => {
    const saved = localStorage.getItem('g93_tasa');
    return saved ? JSON.parse(saved) : 4000;
  });
  
  const [modo, setModo] = useState('camisetas'); 
  const [historial, setHistorial] = useState(() => {
    const saved = localStorage.getItem('g93_historial');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [stock, setStock] = useState(() => {
    const saved = localStorage.getItem('g93_stock');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [deudas, setDeudas] = useState(() => {
    const saved = localStorage.getItem('g93_deudas');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Estados de Interfaz
  const [loteAbierto, setLoteAbierto] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [notificacion, setNotificacion] = useState(null);

  // Sincronización automática con LocalStorage
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
    COSTO_LIBRA: 3.10,      // USD por libra
    ENVIO_CHINA_USA: 10.00, // Flete base por envío
    CARGOS_FIJOS_USA: 7.00, // Manejo de casillero/locker
    PESO_PAR_GUAYOS: 1.32,  // Libras promedio por par
    COMISION_VENTA: 0.05    // Margen operativo adicional
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
  // 4. MOTOR DE CÁLCULO LOGÍSTICO (Lógica Intacta)
  // ==========================================
  const calcularMetricas = (datos, categoria) => {
    let res = {
      costoUSD: 0, costoCOP: 0, venta: 0, ganancia: 0, 
      detalleEnvio: { flete: 0, peso: 0 }
    };

    if (categoria === 'zapato') {
      // Prorrateo de costos fijos sobre la cantidad de pares en caja
      const fleteUnitario = (LOGISTICA.ENVIO_CHINA_USA + LOGISTICA.CARGOS_FIJOS_USA) / (datos.cantidadCaja || 1);
      const pesoUnitario = LOGISTICA.PESO_PAR_GUAYOS * LOGISTICA.COSTO_LIBRA;
      
      res.costoUSD = parseFloat(datos.costoUSD || 0) + fleteUnitario + pesoUnitario;
      res.costoCOP = res.costoUSD * tasaCOP;
      res.venta = res.costoCOP / (1 - (parseFloat(datos.margen || 0) / 100));
      res.ganancia = res.venta - res.costoCOP;
      res.detalleEnvio = { flete: fleteUnitario, peso: pesoUnitario };
    } else {
      const base = PRECIOS_BASE[datos.tipo];
      const extra = (datos.dorsal ? 1 : 0) + (parseInt(datos.parches || 0));
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
    if (!data.nombre) return mostrarMsg("Referencia obligatoria");

    const metricas = calcularMetricas(data, cat);
    const item = {
      id: Date.now(),
      fecha: new Date().toLocaleString(),
      cat,
      nombre: data.nombre,
      talla: data.talla,
      cliente: data.cliente || 'STOCK BODEGA',
      metricas
    };

    setHistorial([item, ...historial]);
    if (!data.cliente) setStock([{ id: Date.now(), ...item }, ...stock]);
    
    // Limpieza de formularios
    if (cat === 'zapato') setFormZapato({...formZapato, nombre: '', costoUSD: ''});
    else setFormJersey({...formJersey, nombre: '', parches: 0, dorsal: false});
    
    mostrarMsg("Registro guardado en LocalStorage");
  };

  const handleDeuda = () => {
    if (!formDeuda.cliente || !formDeuda.monto) return mostrarMsg("Datos incompletos");
    setDeudas([{ id: Date.now(), ...formDeuda }, ...deudas]);
    setFormDeuda({ cliente: '', monto: '', concepto: '' });
    mostrarMsg("Cartera actualizada");
  };

  const mostrarMsg = (m) => {
    setNotificacion(m);
    setTimeout(() => setNotificacion(null), 2500);
  };

  const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  // ==========================================
  // 6. RENDERIZADO DE INTERFAZ (Tailwind CSS)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans p-4 md:p-8">
      
      {/* NOTIFICACIÓN FLOTANTE */}
      {notificacion && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-full shadow-2xl z-50 font-black text-xs uppercase tracking-widest animate-in fade-in zoom-in duration-300">
          {notificacion}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        
        {/* HEADER GOL93 */}
        <header className="bg-white rounded-[2.5rem] p-8 mb-8 shadow-sm border border-slate-200 flex flex-col lg:row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white font-black italic shadow-xl shadow-indigo-100 text-2xl rotate-3">G93</div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter">Gol93<span className="text-indigo-600">Store</span></h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Engineering & Logistics Admin</p>
            </div>
          </div>

          <nav className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
            {['camisetas', 'zapatos', 'stock', 'deudas'].map(t => (
              <button key={t} onClick={() => setModo(t)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${modo === t ? 'bg-white text-indigo-600 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
            ))}
          </nav>

          <div className="bg-indigo-50 border border-indigo-100 px-8 py-4 rounded-3xl flex flex-col items-end">
            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter">TRM Actual (COP/USD)</span>
            <input type="number" value={tasaCOP} onChange={e => setTasaCOP(e.target.value)} className="bg-transparent font-black text-indigo-700 text-2xl outline-none w-32 text-right" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLUMNA IZQUIERDA: CONTROL */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] mb-10">Entrada de Datos</h2>
              
              {modo === 'camisetas' && (
                <div className="space-y-6">
                  <Input label="Nombre de Referencia" value={formJersey.nombre} onChange={v => setFormJersey({...formJersey, nombre: v})} placeholder="Ej: Argentina 3 Estrellas" />
                  <div className="grid grid-cols-2 gap-4">
                    <Select label="Calidad" value={formJersey.tipo} onChange={v => setFormJersey({...formJersey, tipo: v})} options={Object.keys(PRECIOS_BASE)} />
                    <Select label="Talla" value={formJersey.talla} onChange={v => setFormJersey({...formJersey, talla: v})} options={['S', 'M', 'L', 'XL', 'XXL']} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <Input label="Parches" type="number" value={formJersey.parches} onChange={v => setFormJersey({...formJersey, parches: v})} />
                    <button onClick={() => setFormJersey({...formJersey, dorsal: !formJersey.dorsal})} className={`h-[58px] rounded-2xl font-black text-[10px] border-2 transition-all ${formJersey.dorsal ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-300'}`}>CON DORSAL</button>
                  </div>
                  <Input label="Cliente (Opcional)" value={formJersey.cliente} onChange={v => setFormJersey({...formJersey, cliente: v})} />
                  <button onClick={() => handleGuardar('camiseta')} className="w-full bg-indigo-600 text-white p-6 rounded-2xl font-black uppercase text-xs shadow-xl shadow-indigo-50 hover:bg-indigo-700 transition-all mt-6">Procesar Pedido</button>
                </div>
              )}

              {modo === 'zapatos' && (
                <div className="space-y-6">
                  <Input label="Modelo de Guayo" value={formZapato.nombre} onChange={v => setFormZapato({...formZapato, nombre: v})} placeholder="Ej: Mercurial Vapor 15" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Costo China (USD)" type="number" value={formZapato.costoUSD} onChange={v => setFormZapato({...formZapato, costoUSD: v})} />
                    <Input label="Margen (%)" type="number" value={formZapato.margen} onChange={v => setFormZapato({...formZapato, margen: v})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Cantidad en Caja" type="number" value={formZapato.cantidadCaja} onChange={v => setFormZapato({...formZapato, cantidadCaja: v})} />
                    <Select label="Talla" value={formZapato.talla} onChange={v => setFormZapato({...formZapato, talla: v})} options={['38', '39', '40', '41', '42', '43']} />
                  </div>
                  <Input label="Nombre del Cliente" value={formZapato.cliente} onChange={v => setFormZapato({...formZapato, cliente: v})} />
                  <button onClick={() => handleGuardar('zapato')} className="w-full bg-slate-900 text-white p-6 rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-slate-800 transition-all mt-6">Registrar Guayo</button>
                </div>
              )}

              {modo === 'deudas' && (
                <div className="space-y-6">
                  <Input label="Cliente" value={formDeuda.cliente} onChange={v => setFormDeuda({...formDeuda, cliente: v})} />
                  <Input label="Monto Pendiente" type="number" value={formDeuda.monto} onChange={v => setFormDeuda({...formDeuda, monto: v})} />
                  <Input label="Concepto / Item" value={formDeuda.concepto} onChange={v => setFormDeuda({...formDeuda, concepto: v})} />
                  <button onClick={handleDeuda} className="w-full bg-red-500 text-white p-6 rounded-2xl font-black uppercase text-xs shadow-xl mt-6">Agregar a Cartera</button>
                </div>
              )}
            </div>

            <div className="bg-indigo-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Utilidad Proyectada Histórica</p>
                <h3 className="text-4xl font-black tracking-tighter">
                  {fmt(historial.reduce((acc, curr) => acc + (curr.metricas?.ganancia || 0), 0))}
                </h3>
              </div>
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-800 rounded-full blur-3xl opacity-50"></div>
            </div>
          </aside>

          {/* COLUMNA DERECHA: REGISTROS */}
          <main className="lg:col-span-8 space-y-6">
            
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6">
              <div className="bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center text-xl">🔍</div>
              <input 
                type="text" 
                placeholder="Buscar por referencia, cliente o talla..." 
                className="bg-transparent flex-1 outline-none font-bold text-slate-600 text-sm"
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>

            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight">Actividad Reciente</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase italic">Basado en LocalStorage</span>
              </div>

              <div className="divide-y divide-slate-50">
                {historial
                  .filter(h => h.nombre.toLowerCase().includes(busqueda.toLowerCase()) || h.cliente.toLowerCase().includes(busqueda.toLowerCase()))
                  .map(item => (
                  <div key={item.id} className="group transition-colors hover:bg-slate-50/50">
                    <div 
                      onClick={() => setLoteAbierto(loteAbierto === item.id ? null : item.id)}
                      className="p-8 flex flex-wrap items-center justify-between gap-6 cursor-pointer"
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-[1.25rem] flex flex-col items-center justify-center font-black shadow-sm ${item.cat === 'zapato' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          <span className="text-[8px] uppercase opacity-40 leading-none">Talla</span>
                          <span className="text-lg leading-none">{item.talla}</span>
                        </div>
                        <div>
                          <h4 className="font-black text-[15px] uppercase text-slate-800 leading-tight mb-1">{item.nombre}</h4>
                          <div className="flex items-center gap-4">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.fecha}</span>
                            <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-indigo-500 uppercase">{item.cliente}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-600 font-black text-2xl tracking-tighter">+{fmt(item.metricas?.ganancia)}</p>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Utilidad Estimada</p>
                      </div>
                    </div>

                    {/* ACORDEÓN DE AUDITORÍA DETALLADA */}
                    {loteAbierto === item.id && (
                      <div className="px-8 pb-8 animate-in slide-in-from-top duration-300">
                        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-inner grid grid-cols-1 md:grid-cols-3 gap-8 relative overflow-hidden">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inversión Logística</p>
                            <p className="font-black text-slate-700 text-xl">{fmt(item.metricas?.costoCOP)}</p>
                            <p className="text-[10px] font-bold text-slate-400">Desglose: ${item.metricas?.costoUSD.toFixed(2)} USD</p>
                          </div>
                          <div className="space-y-1 border-x border-slate-100 px-8">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Precio Final Venta</p>
                            <p className="font-black text-indigo-600 text-xl">{fmt(item.metricas?.venta)}</p>
                            <p className="text-[10px] font-black text-emerald-500 uppercase">Eficiencia: {Math.round((item.metricas?.ganancia / item.metricas?.venta) * 100)}%</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Detalle Importación</p>
                            {item.cat === 'zapato' ? (
                              <div className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">
                                <p>Flete prorrateado: ${item.metricas?.detalleEnvio?.flete.toFixed(2)} USD</p>
                                <p>Peso volumétrico: ${item.metricas?.detalleEnvio?.peso.toFixed(2)} USD</p>
                              </div>
                            ) : (
                              <p className="text-[10px] font-bold text-slate-500 uppercase">Tarifa Plana de Importación</p>
                            )}
                          </div>
                          <div className="col-span-full pt-6 border-t border-slate-50 flex justify-between items-center mt-4">
                            <span className="text-[9px] font-black text-slate-300 uppercase">Audit ID: G93-{item.id}</span>
                            <button onClick={() => setHistorial(historial.filter(h => h.id !== item.id))} className="text-red-400 hover:text-red-600 font-black text-[10px] uppercase transition-colors">Eliminar de Base de Datos</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {historial.length === 0 && <div className="p-20 text-center font-black text-slate-300 uppercase italic text-xs tracking-[0.5em]">Esperando Datos...</div>}
              </div>
            </div>

            {/* VISTA DE STOCK (MODO TABLA) */}
            {modo === 'stock' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-in zoom-in-95 duration-300">
                {stock.map(s => (
                  <div key={s.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-tighter">{s.cat}</p>
                    <h5 className="font-black text-[12px] uppercase text-slate-800 leading-tight mb-4">{s.nombre}</h5>
                    <div className="flex justify-between items-center">
                      <span className="bg-slate-100 px-3 py-1 rounded-lg font-black text-[10px] text-slate-500 uppercase">Talla {s.talla}</span>
                      <button onClick={() => setStock(stock.filter(i => i.id !== s.id))} className="text-red-400 hover:text-red-600 font-bold text-xl opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
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
// COMPONENTES DE UI REUTILIZABLES (ATÓMICOS)
// ==========================================
const Input = ({ label, onChange, ...props }) => (
  <div className="flex flex-col gap-2.5 w-full">
    <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-widest">{label}</label>
    <input 
      {...props} 
      onChange={e => onChange(e.target.value)} 
      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none font-bold text-slate-700 text-sm focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-200" 
    />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div className="flex flex-col gap-2.5 w-full">
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