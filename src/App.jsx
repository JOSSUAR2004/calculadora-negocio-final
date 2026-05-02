import React, { useState, useEffect } from 'react';

const App = () => {
  // --- ESTADOS DE PERSISTENCIA ---
  const [tasaCOP, setTasaCOP] = useState(() => JSON.parse(localStorage.getItem('g93_tasa')) || 3600);
  const [modo, setModo] = useState('camisetas'); 
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('g93_items')) || []);
  const [historial, setHistorial] = useState(() => JSON.parse(localStorage.getItem('g93_historial')) || []);
  const [stock, setStock] = useState(() => JSON.parse(localStorage.getItem('g93_stock')) || []);
  const [deudas, setDeudas] = useState(() => JSON.parse(localStorage.getItem('g93_deudas')) || []);
  
  // --- ESTADOS DE INTERFAZ ---
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);

  // --- SINCRONIZACIÓN LOCALSTORAGE ---
  useEffect(() => {
    localStorage.setItem('g93_tasa', JSON.stringify(tasaCOP));
    localStorage.setItem('g93_items', JSON.stringify(items));
    localStorage.setItem('g93_historial', JSON.stringify(historial));
    localStorage.setItem('g93_stock', JSON.stringify(stock));
    localStorage.setItem('g93_deudas', JSON.stringify(deudas));
  }, [tasaCOP, items, historial, stock, deudas]);

  // --- CONSTANTES LOGÍSTICAS ---
  const COSTO_LIBRA = 3.10; 
  const ENVIO_CHINA_USA = 10;
  const CARGOS_FIJOS = 7;
  const PESO_PAR_LB = 1.32; 

  const COSTOS_BASE_JERSEY = {
    fan: 13, player: 16, retro: 17, longSleeve: 17, children: 15, nba: 23, f1_nfl: 25
  };

  const PRECIOS_VENTA_JERSEY = {
    fan: 125000, player: 140000, retro: 150000, longSleeve: 155000, children: 110000, nba: 180000, f1_nfl: 195000
  };

  // --- FORMULARIOS ---
  const [cajaZapatos, setCajaZapatos] = useState({ cantidadTotalCaja: 1 });
  const [newZapato, setNewZapato] = useState({ nombre: '', costoUSD: '', margen: 20, cantidad: 1 });
  const [newJersey, setNewJersey] = useState({ nombre: '', tipo: 'player', parches: 0, dorsal: false, cantidad: 1 });
  const [newStock, setNewStock] = useState({ referencia: '', talla: 'L', tipo: 'player' });

  // --- LÓGICA DE CÁLCULO ---
  const calcularValores = (item, trm) => {
    if (item.tipoItem === 'zapato') {
      const costoTotalUSD = parseFloat(item.costoUSD) + item.costoLogisticaUSD;
      const costoCOP = costoTotalUSD * trm;
      const venta = costoCOP / (1 - (item.margen / 100));
      return { costoCOP, venta, ganancia: venta - costoCOP, costoUSD: costoTotalUSD };
    } else {
      const costoExtrasUSD = (item.dorsal ? 1 : 0) + (parseInt(item.parches) || 0);
      const costoTotalUSD = item.costoBaseUSD + costoExtrasUSD;
      const costoCOP = costoTotalUSD * trm;
      const venta = PRECIOS_VENTA_JERSEY[item.tipo];
      return { costoCOP, venta, ganancia: venta - costoCOP, costoUSD: costoTotalUSD };
    }
  };

  const agregarZapato = () => {
    if (!newZapato.nombre || !newZapato.costoUSD) return;
    const nTotalCaja = parseInt(cajaZapatos.cantidadTotalCaja) || 1;
    const logisticaPorParUSD = (ENVIO_CHINA_USA + CARGOS_FIJOS + ((nTotalCaja * PESO_PAR_LB) * COSTO_LIBRA)) / nTotalCaja;
    const nuevos = Array.from({ length: parseInt(newZapato.cantidad) || 1 }, () => ({
      ...newZapato,
      id: Math.random().toString(36).substr(2, 9),
      costoLogisticaUSD: logisticaPorParUSD,
      tipoItem: 'zapato',
      trmRegistro: tasaCOP,
      fechaAgregado: new Date().toISOString()
    }));
    setItems([...items, ...nuevos]);
    setNewZapato({ ...newZapato, nombre: '', costoUSD: '', cantidad: 1 });
  };

  const agregarJersey = () => {
    if (!newJersey.nombre) return;
    const nuevos = Array.from({ length: parseInt(newJersey.cantidad) || 1 }, () => ({
      ...newJersey,
      id: Math.random().toString(36).substr(2, 9),
      costoBaseUSD: COSTOS_BASE_JERSEY[newJersey.tipo],
      tipoItem: 'camiseta',
      trmRegistro: tasaCOP,
      fechaAgregado: new Date().toISOString()
    }));
    setItems([...items, ...nuevos]);
    setNewJersey({ ...newJersey, nombre: '', parches: 0, dorsal: false, cantidad: 1 });
  };

  const guardarLotePrincipal = () => {
    if (items.length === 0) return;
    setCargando(true);
    setTimeout(() => {
      const totalG = items.reduce((acc, i) => acc + calcularValores(i, tasaCOP).ganancia, 0);
      const nuevoLote = {
        id: Date.now(),
        fecha: new Date().toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        ganancia: totalG,
        und: items.length,
        tipo: modo,
        trm: tasaCOP,
        productos: items.map(i => ({ ...i, ...calcularValores(i, tasaCOP) }))
      };
      setHistorial([nuevoLote, ...historial]);
      setItems([]);
      setCargando(false);
    }, 600);
  };

  const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6 bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <span className="text-white font-black text-xl">G</span>
            </div>
            <div>
              <h1 className="text-2xl font-black italic uppercase tracking-tighter text-slate-800">Gol93<span className="text-indigo-600">Store</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestión de Negocio</p>
            </div>
          </div>

          <nav className="flex bg-slate-100 p-1.5 rounded-2xl w-full lg:w-auto border border-slate-200">
            {[
              { id: 'camisetas', label: 'Jerseys', icon: '👕' },
              { id: 'zapatos', label: 'Guayos', icon: '👟' },
              { id: 'stock', label: 'Inventario', icon: '📦' },
              { id: 'deudas', label: 'Cuentas', icon: '💸' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setModo(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[11px] uppercase transition-all duration-300 ${modo === tab.id ? 'bg-white shadow-md text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </nav>

          <div className="bg-slate-50 px-6 py-2 rounded-2xl border border-slate-100">
            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">TRM del día</p>
            <input 
              type="number" 
              value={tasaCOP} 
              onChange={(e) => setTasaCOP(parseFloat(e.target.value) || 0)} 
              className="bg-transparent border-none outline-none font-black text-slate-800 text-lg w-20"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* PANEL LATERAL */}
          <aside className="lg:col-span-4 space-y-6">
            {modo === 'zapatos' && (
              <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-5">
                <Input label="Referencia del Guayo" value={newZapato.nombre} onChange={v => setNewZapato({...newZapato, nombre: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="USD China" type="number" value={newZapato.costoUSD} onChange={v => setNewZapato({...newZapato, costoUSD: v})} />
                  <Input label="Margen %" type="number" value={newZapato.margen} onChange={v => setNewZapato({...newZapato, margen: v})} />
                </div>
                <Input label="Unidades" type="number" value={newJersey.cantidad} onChange={v => setNewJersey({...newJersey, cantidad: v})} />
                <button onClick={agregarZapato} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-xs uppercase shadow-lg transition-transform active:scale-95">Agregar al Lote</button>
              </section>
            )}

            {modo === 'camisetas' && (
              <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-5">
                <Input label="Equipo / Selección" value={newJersey.nombre} onChange={v => setNewJersey({...newJersey, nombre: v})} />
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-1">Calidad</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:border-indigo-500" value={newJersey.tipo} onChange={e => setNewJersey({...newJersey, tipo: e.target.value})}>
                    {Object.keys(COSTOS_BASE_JERSEY).map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4 items-end">
                  <Input label="Parches" type="number" value={newJersey.parches} onChange={v => setNewJersey({...newJersey, parches: v})} />
                  <button onClick={() => setNewJersey({...newJersey, dorsal: !newJersey.dorsal})} className={`p-4 rounded-2xl border-2 font-black text-[10px] h-[58px] transition-all ${newJersey.dorsal ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
                    {newJersey.dorsal ? 'CON DORSAL' : 'SIN DORSAL'}
                  </button>
                </div>
                <Input label="Cantidad" type="number" value={newJersey.cantidad} onChange={v => setNewJersey({...newJersey, cantidad: v})} />
                <button onClick={agregarJersey} className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-100 transition-transform active:scale-95">Agregar al Lote</button>
              </section>
            )}

            {modo === 'stock' && (
              <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-5">
                <h3 className="text-xs font-black uppercase text-slate-800 italic">Entrada a Bodega</h3>
                <Input label="Referencia" value={newStock.referencia} onChange={v => setNewStock({...newStock, referencia: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-1">Tipo</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-700 outline-none" value={newStock.tipo} onChange={e => setNewStock({...newStock, tipo: e.target.value})}>
                      <option value="player">Player</option><option value="fan">Fan</option><option value="retro">Retro</option><option value="children">Niño</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-1">Talla</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-700 outline-none" value={newStock.talla} onChange={e => setNewStock({...newStock, talla: e.target.value})}>
                      {['S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', '41', '42', '43'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={() => { if(!newStock.referencia) return; setStock([{id: Date.now(), ...newStock}, ...stock]); setNewStock({referencia: '', talla: 'L', tipo: 'player'}); }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black text-xs uppercase shadow-lg shadow-orange-100 transition-transform active:scale-95">Guardar en Bodega</button>
              </section>
            )}

            {modo === 'deudas' && (
              <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-5">
                <h3 className="text-xs font-black uppercase text-slate-800 italic">Nueva Cuenta</h3>
                <Input label="Cliente" id="d-nom" />
                <Input label="Monto COP" type="number" id="d-val" />
                <button onClick={() => {
                  const n = document.getElementById('d-nom').value; const v = document.getElementById('d-val').value;
                  if(n && v) { setDeudas([{id: Date.now(), cliente: n, monto: v, fecha: new Date().toLocaleDateString()}, ...deudas]); document.getElementById('d-nom').value = ''; document.getElementById('d-val').value = ''; }
                }} className="w-full bg-red-500 text-white p-5 rounded-2xl font-black text-xs uppercase shadow-lg shadow-red-100 transition-transform active:scale-95">Registrar Deuda</button>
              </section>
            )}
          </aside>

          {/* ÁREA PRINCIPAL: LISTAS Y TABLAS */}
          <main className="lg:col-span-8 space-y-8">
            
            {/* VISTA PARA CAMISETAS Y ZAPATOS (LOTES) */}
            {(modo === 'camisetas' || modo === 'zapatos') && (
              <div className="space-y-6">
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-slate-400">Preparación de Lote</span>
                    <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{items.length} Items</span>
                  </div>
                  <div className="overflow-x-auto px-4">
                    <table className="w-full">
                      <thead className="text-[9px] font-black text-slate-400 uppercase">
                        <tr><th className="p-4 text-left">Producto</th><th className="p-4 text-center">Inversión</th><th className="p-4 text-right">Utilidad</th><th className="p-4"></th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {items.map(item => {
                          const { costoCOP, ganancia } = calcularValores(item, tasaCOP);
                          return (
                            <tr key={item.id} className="group hover:bg-slate-50/80 transition-colors">
                              <td className="p-4">
                                <div className="font-bold text-slate-800 text-sm uppercase leading-tight">{item.nombre}</div>
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.tipoItem === 'zapato' ? 'Calzado' : item.tipo}</div>
                              </td>
                              <td className="p-4 text-center font-bold text-slate-400 text-xs">{fmt(costoCOP)}</td>
                              <td className="p-4 text-right"><span className="text-emerald-600 font-black text-xs">+{fmt(ganancia)}</span></td>
                              <td className="p-4 text-right"><button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-slate-200 hover:text-red-500 font-bold transition-colors">✕</button></td>
                            </tr>
                          );
                        })}
                        {items.length === 0 && <tr><td colSpan="4" className="p-10 text-center text-slate-300 font-bold text-xs uppercase tracking-widest italic">No hay productos en el lote</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-2xl flex justify-between items-center text-white border-b-8 border-indigo-800 transition-all">
                    <div>
                      <p className="text-indigo-200 text-[10px] font-black uppercase mb-1">Utilidad Total Estimada</p>
                      <h2 className="text-4xl font-black tracking-tighter">{fmt(items.reduce((acc, i) => acc + calcularValores(i, tasaCOP).ganancia, 0))}</h2>
                    </div>
                    <button onClick={guardarLotePrincipal} className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-[11px] uppercase shadow-xl hover:scale-105 active:scale-95 transition-all">
                      {cargando ? 'Procesando...' : 'Finalizar Registro'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* VISTA PARA INVENTARIO (TABLA LIMPIA) */}
            {modo === 'stock' && (
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in duration-500">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Stock Disponible</span>
                  <span className="text-[10px] font-black text-orange-500 uppercase italic">Bodega Central</span>
                </div>
                <div className="overflow-x-auto px-4">
                  <table className="w-full">
                    <thead className="text-[9px] font-black text-slate-300 uppercase">
                      <tr className="border-b border-slate-50">
                        <th className="p-5 text-left">Referencia</th>
                        <th className="p-5 text-center">Tipo</th>
                        <th className="p-5 text-center">Talla</th>
                        <th className="p-5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {stock.map(item => (
                        <tr key={item.id} className="hover:bg-orange-50/30 transition-colors group">
                          <td className="p-5"><div className="font-bold text-slate-700 text-sm uppercase">{item.referencia}</div></td>
                          <td className="p-5 text-center"><span className="text-[9px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-md">{item.tipo}</span></td>
                          <td className="p-5 text-center"><span className="text-xs font-black text-orange-600">Talla {item.talla}</span></td>
                          <td className="p-5 text-right">
                            <button onClick={() => setStock(stock.filter(i => i.id !== item.id))} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all">Vendido</button>
                          </td>
                        </tr>
                      ))}
                      {stock.length === 0 && <tr><td colSpan="4" className="p-16 text-center text-slate-300 font-bold text-xs uppercase italic">Bodega vacía</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VISTA PARA DEUDAS (CUADRO DE CONTROL) */}
            {modo === 'deudas' && (
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden animate-in slide-in-from-right duration-500">
                <div className="p-6 border-b border-slate-50 bg-red-50/50 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-red-400 tracking-widest">Pendientes de Cobro</span>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Total Cartera</p>
                    <p className="text-sm font-black text-red-600">{fmt(deudas.reduce((acc, d) => acc + parseFloat(d.monto), 0))}</p>
                  </div>
                </div>
                <div className="overflow-x-auto px-4">
                  <table className="w-full">
                    <thead className="text-[9px] font-black text-slate-300 uppercase">
                      <tr><th className="p-5 text-left">Fecha</th><th className="p-5 text-left">Cliente</th><th className="p-5 text-center">Saldo</th><th className="p-5 text-right">Estado</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {deudas.map(deuda => (
                        <tr key={deuda.id} className="hover:bg-red-50/30 transition-colors">
                          <td className="p-5 text-[10px] font-bold text-slate-400">{deuda.fecha}</td>
                          <td className="p-5"><div className="font-black text-slate-800 text-sm uppercase">{deuda.cliente}</div></td>
                          <td className="p-5 text-center font-black text-red-600 text-sm">{fmt(deuda.monto)}</td>
                          <td className="p-5 text-right">
                            <button onClick={() => setDeudas(deudas.filter(d => d.id !== deuda.id))} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-red-600 hover:text-white transition-all shadow-sm">Marcar Pago</button>
                          </td>
                        </tr>
                      ))}
                      {deudas.length === 0 && <tr><td colSpan="4" className="p-16 text-center text-slate-300 font-bold text-xs uppercase italic">No hay cuentas pendientes</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

// COMPONENTES ATÓMICOS
const Input = ({ label, onChange, ...p }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[10px] font-black text-slate-400 uppercase px-1">{label}</label>
    <input {...p} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none font-bold text-slate-700 text-sm focus:border-indigo-500 transition-all" />
  </div>
);

export default App;