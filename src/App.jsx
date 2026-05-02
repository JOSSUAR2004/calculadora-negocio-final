import React, { useState, useEffect } from 'react';

const App = () => {
  // ==========================================
  // 1. PERSISTENCIA DE DATOS (NÚCLEO GOL93)
  // ==========================================
  const getInitialData = (key, fallback) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
      return fallback;
    }
  };

  const [tasaCOP, setTasaCOP] = useState(() => getInitialData('g93_tasa', 4000));
  const [modo, setModo] = useState('camisetas'); 
  const [historial, setHistorial] = useState(() => getInitialData('g93_historial', []));
  const [stock, setStock] = useState(() => getInitialData('g93_stock', []));
  const [deudas, setDeudas] = useState(() => getInitialData('g93_deudas', []));
  
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
  // 2. LÓGICA DE NEGOCIO (IMPORT FLOW)
  // ==========================================
  const LOGISTICA = {
    COSTO_LIBRA: 3.10,      // USD
    ENVIO_CHINA_USA: 10.00, //
    CARGOS_FIJOS_USA: 7.00, //
    PESO_PAR_GUAYOS: 1.32   //
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

  const [formJersey, setFormJersey] = useState({
    nombre: '', tipo: 'player', parches: 0, dorsal: false, talla: 'L', cliente: ''
  });

  const [formZapato, setFormZapato] = useState({
    nombre: '', costoUSD: '', margen: 25, cantidadCaja: 10, talla: '40', cliente: ''
  });

  const [formDeuda, setFormDeuda] = useState({ cliente: '', monto: '', concepto: '' });

  // ==========================================
  // 3. MOTOR DE CÁLCULO
  // ==========================================
  const calcularMetricas = (datos, categoria) => {
    let res = { costoUSD: 0, costoCOP: 0, venta: 0, ganancia: 0, detalleEnvio: { flete: 0, peso: 0 } };

    if (categoria === 'zapato') {
      const fleteUnitario = (LOGISTICA.ENVIO_CHINA_USA + LOGISTICA.CARGOS_FIJOS_USA) / (parseFloat(datos.cantidadCaja) || 1);
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

  const handleGuardar = (cat) => {
    const data = cat === 'zapato' ? formZapato : formJersey;
    if (!data.nombre) return alert("Nombre requerido");

    const metricas = calcularMetricas(data, cat);
    const item = {
      id: Date.now(),
      fecha: new Date().toLocaleString(),
      cat,
      nombre: data.nombre,
      talla: data.talla,
      cliente: data.cliente || 'STOCK',
      metricas
    };

    setHistorial([item, ...historial]);
    if (!data.cliente) setStock([item, ...stock]);
    
    if (cat === 'zapato') setFormZapato({...formZapato, nombre: '', costoUSD: ''});
    else setFormJersey({...formJersey, nombre: '', parches: 0, dorsal: false});
    
    setNotificacion("Guardado con éxito");
    setTimeout(() => setNotificacion(null), 2000);
  };

  const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

  // ==========================================
  // 4. ESTRUCTURA DE LA INTERFAZ
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4">
      
      {notificacion && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full shadow-xl z-50 text-xs font-bold uppercase tracking-widest">
          {notificacion}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl italic">G93</div>
            <div>
              <h1 className="text-xl font-black uppercase">Gol93Store</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Administrador de Importación</p>
            </div>
          </div>

          <nav className="flex bg-gray-100 p-1 rounded-xl">
            {['camisetas', 'zapatos', 'stock', 'deudas'].map(t => (
              <button 
                key={t} 
                onClick={() => setModo(t)} 
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${modo === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
              >
                {t}
              </button>
            ))}
          </nav>

          <div className="bg-blue-50 px-4 py-2 rounded-xl text-right">
            <label className="block text-[8px] font-black text-blue-400 uppercase">TRM COP/USD</label>
            <input 
              type="number" 
              value={tasaCOP} 
              onChange={e => setTasaCOP(e.target.value)} 
              className="bg-transparent font-black text-blue-700 text-lg outline-none w-24 text-right" 
            />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* PANEL DE CONTROL */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6">Nuevo Registro</h2>
              
              {modo === 'camisetas' && (
                <div className="space-y-4">
                  <Input label="Referencia" value={formJersey.nombre} onChange={v => setFormJersey({...formJersey, nombre: v})} />
                  <div className="grid grid-cols-2 gap-2">
                    <Select label="Tipo" value={formJersey.tipo} onChange={v => setFormJersey({...formJersey, tipo: v})} options={Object.keys(PRECIOS_BASE)} />
                    <Select label="Talla" value={formJersey.talla} onChange={v => setFormJersey({...formJersey, talla: v})} options={['S', 'M', 'L', 'XL', 'XXL']} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 items-end">
                    <Input label="Parches" type="number" value={formJersey.parches} onChange={v => setFormJersey({...formJersey, parches: v})} />
                    <button 
                      onClick={() => setFormJersey({...formJersey, dorsal: !formJersey.dorsal})} 
                      className={`h-11 rounded-xl font-black text-[9px] border-2 transition-all ${formJersey.dorsal ? 'bg-blue-600 border-blue-600 text-white' : 'text-gray-300 border-gray-100'}`}
                    >
                      DORSAL (+1$)
                    </button>
                  </div>
                  <button onClick={() => handleGuardar('camiseta')} className="w-full bg-blue-600 text-white p-4 rounded-xl font-black uppercase text-[10px] shadow-lg mt-4">Guardar Jersey</button>
                </div>
              )}

              {modo === 'zapatos' && (
                <div className="space-y-4">
                  <Input label="Modelo Guayos" value={formZapato.nombre} onChange={v => setFormZapato({...formZapato, nombre: v})} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Costo China" type="number" value={formZapato.costoUSD} onChange={v => setFormZapato({...formZapato, costoUSD: v})} />
                    <Input label="Margen %" type="number" value={formZapato.margen} onChange={v => setFormZapato({...formZapato, margen: v})} />
                  </div>
                  <Input label="Cliente" value={formZapato.cliente} onChange={v => setFormZapato({...formZapato, cliente: v})} />
                  <button onClick={() => handleGuardar('zapato')} className="w-full bg-gray-900 text-white p-4 rounded-xl font-black uppercase text-[10px] shadow-lg mt-4">Registrar Zapato</button>
                </div>
              )}
            </div>

            <div className="bg-blue-900 rounded-3xl p-8 text-white shadow-xl">
              <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Total Ganancia</p>
              <h3 className="text-3xl font-black tracking-tighter">
                {fmt(historial.reduce((acc, curr) => acc + (curr.metricas?.ganancia || 0), 0))}
              </h3>
            </div>
          </aside>

          {/* LISTADO DE ACTIVIDAD */}
          <main className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="text-xs font-black uppercase">Actividad de Importación</h3>
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1 text-xs" 
                  onChange={e => setBusqueda(e.target.value)}
                />
              </div>

              <div className="divide-y divide-gray-50">
                {historial.filter(h => h.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(item => (
                  <div key={item.id}>
                    <div 
                      onClick={() => setLoteAbierto(loteAbierto === item.id ? null : item.id)}
                      className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-black text-xs">{item.talla}</div>
                        <div>
                          <p className="font-black text-xs uppercase">{item.nombre}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">{item.cliente} | {item.fecha}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-600 font-black text-sm">+{fmt(item.metricas?.ganancia)}</p>
                      </div>
                    </div>

                    {loteAbierto === item.id && (
                      <div className="p-6 bg-gray-50 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-[8px] font-black text-gray-400 uppercase">Costo Total</p>
                          <p className="font-bold text-xs">{fmt(item.metricas?.costoCOP)}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-gray-400 uppercase">Precio Venta</p>
                          <p className="font-bold text-xs text-blue-600">{fmt(item.metricas?.venta)}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-gray-400 uppercase">USD Unitario</p>
                          <p className="font-bold text-xs">${item.metricas?.costoUSD?.toFixed(2)}</p>
                        </div>
                        <button 
                          onClick={() => setHistorial(historial.filter(h => h.id !== item.id))}
                          className="text-red-400 text-[8px] font-black uppercase text-right"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, onChange, ...props }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] font-black text-gray-400 uppercase px-1">{label}</label>
    <input 
      {...props} 
      onChange={e => onChange(e.target.value)} 
      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none font-bold text-xs focus:border-blue-400 transition-all" 
    />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] font-black text-gray-400 uppercase px-1">{label}</label>
    <select 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none font-bold text-xs"
    >
      {options.map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
    </select>
  </div>
);

export default App;