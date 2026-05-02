import React, { useState, useEffect } from 'react';

const App = () => {
  // --- PERSISTENCIA DE DATOS ---
  const [tasaCOP, setTasaCOP] = useState(() => JSON.parse(localStorage.getItem('g93_tasa')) || 3950);
  const [modo, setModo] = useState('camisetas'); 
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('g93_items')) || []);
  const [historial, setHistorial] = useState(() => JSON.parse(localStorage.getItem('g93_historial')) || []);
  const [stock, setStock] = useState(() => JSON.parse(localStorage.getItem('g93_stock')) || []);
  const [deudas, setDeudas] = useState(() => JSON.parse(localStorage.getItem('g93_deudas')) || []);
  
  // --- ESTADOS DE INTERFAZ ---
  const [cargando, setCargando] = useState(false);
  const [loteVer, setLoteVer] = useState(null);

  // --- SINCRONIZACIÓN AUTOMÁTICA ---
  useEffect(() => {
    localStorage.setItem('g93_tasa', JSON.stringify(tasaCOP));
    localStorage.setItem('g93_items', JSON.stringify(items));
    localStorage.setItem('g93_historial', JSON.stringify(historial));
    localStorage.setItem('g93_stock', JSON.stringify(stock));
    localStorage.setItem('g93_deudas', JSON.stringify(deudas));
  }, [tasaCOP, items, historial, stock, deudas]);

  // --- CONSTANTES LOGÍSTICAS DE IMPORTACIÓN (Lógica Intacta) ---
  const COSTO_LIBRA = 3.10; 
  const ENVIO_CHINA_USA = 10; // Envío base consolidado
  const CARGOS_FIJOS = 7;     // Seguros y manejo
  const PESO_PAR_LB = 1.32;   // Peso promedio guayos

  const COSTOS_BASE_JERSEY = {
    fan: 13, player: 16, retro: 17, longSleeve: 17, children: 15, nba: 23, f1_nfl: 25
  };

  const PRECIOS_VENTA_JERSEY = {
    fan: 125000, player: 140000, retro: 150000, longSleeve: 155000, children: 110000, nba: 180000, f1_nfl: 195000
  };

  // --- FORMULARIOS DE REGISTRO ---
  const [cajaZapatos, setCajaZapatos] = useState({ cantidadTotalCaja: 1 });
  const [newZapato, setNewZapato] = useState({ nombre: '', costoUSD: '', margen: 20, cantidad: 1 });
  const [newJersey, setNewJersey] = useState({ nombre: '', tipo: 'player', parches: 0, dorsal: false, cantidad: 1 });
  const [newStock, setNewStock] = useState({ referencia: '', talla: 'L', tipo: 'player' });
  const [newDeuda, setNewDeuda] = useState({ cliente: '', monto: '' });

  // --- MOTOR DE CÁLCULO LOGÍSTICO ---
  const calcularValores = (item, trm) => {
    if (item.tipoItem === 'zapato') {
      // Cálculo basado en el flujo de importación China -> USA -> Colombia
      const nTotalCaja = parseInt(cajaZapatos.cantidadTotalCaja) || 1;
      const costoLogisticaUSD = (ENVIO_CHINA_USA + CARGOS_FIJOS + ((nTotalCaja * PESO_PAR_LB) * COSTO_LIBRA)) / nTotalCaja;
      const costoTotalUSD = parseFloat(item.costoUSD) + costoLogisticaUSD;
      const costoCOP = costoTotalUSD * trm;
      const venta = costoCOP / (1 - (item.margen / 100));
      return { 
        costoCOP, 
        venta, 
        ganancia: venta - costoCOP, 
        costoUSD: costoTotalUSD,
        logisticaUSD: costoLogisticaUSD 
      };
    } else {
      // Cálculo para Jerseys con parches y dorsal
      const costoExtrasUSD = (item.dorsal ? 1 : 0) + (parseInt(item.parches) || 0);
      const costoTotalUSD = (COSTOS_BASE_JERSEY[item.tipo] || 16) + costoExtrasUSD;
      const costoCOP = costoTotalUSD * trm;
      const venta = PRECIOS_VENTA_JERSEY[item.tipo] || 140000;
      return { 
        costoCOP, 
        venta, 
        ganancia: venta - costoCOP, 
        costoUSD: costoTotalUSD 
      };
    }
  };

  // --- ACCIONES ---
  const agregarZapato = () => {
    if (!newZapato.nombre || !newZapato.costoUSD) return;
    const nuevos = Array.from({ length: parseInt(newZapato.cantidad) || 1 }, () => ({
      ...newZapato,
      id: Math.random().toString(36).substr(2, 9),
      tipoItem: 'zapato',
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
      tipoItem: 'camiseta',
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
        fecha: new Date().toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        ganancia: totalG,
        und: items.length,
        tipo: modo,
        trm: tasaCOP,
        productos: items.map(i => ({ ...i, ...calcularValores(i, tasaCOP) }))
      };
      setHistorial([nuevoLote, ...historial]);
      setItems([]);
      setCargando(false);
    }, 800);
  };

  const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* --- CABECERA PRINCIPAL --- */}
        <header className="bg-white rounded-[2rem] p-6 mb-8 shadow-xl shadow-slate-200/60 border border-white flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <span className="text-white font-black text-2xl tracking-tighter italic">G93</span>
            </div>
            <div>
              <h1 className="text-2xl font-black italic uppercase tracking-tighter text-slate-800">Gol93<span className="text-indigo-600">Store</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Management System v2.0</p>
            </div>
          </div>

          <nav className="flex bg-slate-100 p-1.5 rounded-2xl w-full lg:w-auto">
            {[
              { id: 'camisetas', label: 'Jerseys', icon: '👕' },
              { id: 'zapatos', label: 'Guayos', icon: '👟' },
              { id: 'stock', label: 'Inventario', icon: '📦' },
              { id: 'deudas', label: 'Cuentas', icon: '💸' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setModo(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[11px] uppercase transition-all duration-300 ${modo === tab.id ? 'bg-white shadow-md text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase">Tasa de Cambio</p>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-bold">$</span>
                <input 
                  type="number" 
                  value={tasaCOP} 
                  onChange={(e) => setTasaCOP(parseFloat(e.target.value) || 0)} 
                  className="bg-transparent border-none outline-none font-black text-slate-800 text-lg w-20"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- PANEL LATERAL DE ENTRADA (FORMULARIOS) --- */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Lógica de Lote de Guayos */}
            {modo === 'zapatos' && (
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6 animate-in slide-in-from-left">
                <h3 className="text-xs font-black uppercase text-indigo-600 italic tracking-widest border-b pb-4">Configuración de Importación</h3>
                <Input label="Capacidad de la Caja (Pares)" type="number" value={cajaZapatos.cantidadTotalCaja} onChange={v => setCajaZapatos({...cajaZapatos, cantidadTotalCaja: v})} />
                <hr className="border-slate-50" />
                <Input label="Referencia del Guayo" placeholder="Ej: Predator Elite FG" value={newZapato.nombre} onChange={v => setNewZapato({...newZapato, nombre: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Costo China (USD)" type="number" value={newZapato.costoUSD} onChange={v => setNewZapato({...newZapato, costoUSD: v})} />
                  <Input label="Margen (%)" type="number" value={newZapato.margen} onChange={v => setNewZapato({...newZapato, margen: v})} />
                </div>
                <Input label="Cantidad de Pares" type="number" value={newZapato.cantidad} onChange={v => setNewZapato({...newZapato, cantidad: v})} />
                <button onClick={agregarZapato} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-[11px] uppercase shadow-xl hover:bg-slate-800 active:scale-95 transition-all">Agregar al Lote</button>
              </div>
            )}

            {/* Lógica de Lote de Jerseys */}
            {modo === 'camisetas' && (
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6 animate-in slide-in-from-left">
                <h3 className="text-xs font-black uppercase text-indigo-600 italic tracking-widest border-b pb-4">Detalle de Prendas</h3>
                <Input label="Equipo / Selección" placeholder="Ej: Real Madrid 24/25" value={newJersey.nombre} onChange={v => setNewJersey({...newJersey, nombre: v})} />
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-wider">Calidad / Tipo</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all" value={newJersey.tipo} onChange={e => setNewJersey({...newJersey, tipo: e.target.value})}>
                    {Object.keys(COSTOS_BASE_JERSEY).map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4 items-end">
                  <Input label="Número de Parches" type="number" value={newJersey.parches} onChange={v => setNewJersey({...newJersey, parches: v})} />
                  <button 
                    onClick={() => setNewJersey({...newJersey, dorsal: !newJersey.dorsal})} 
                    className={`p-4 rounded-2xl border-2 font-black text-[10px] h-[58px] transition-all ${newJersey.dorsal ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-400'}`}
                  >
                    {newJersey.dorsal ? 'CON DORSAL (+1 USD)' : 'SIN DORSAL'}
                  </button>
                </div>
                <Input label="Cantidad de Unidades" type="number" value={newJersey.cantidad} onChange={v => setNewJersey({...newJersey, cantidad: v})} />
                <button onClick={agregarJersey} className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black text-[11px] uppercase shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Agregar al Lote</button>
              </div>
            )}

            {/* Lógica de Stock Directo */}
            {modo === 'stock' && (
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6 animate-in slide-in-from-left">
                <h3 className="text-xs font-black uppercase text-orange-600 italic tracking-widest border-b pb-4">Entrada Manual a Bodega</h3>
                <Input label="Referencia del Producto" value={newStock.referencia} onChange={v => setNewStock({...newStock, referencia: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-1">Calidad</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-700 outline-none" value={newStock.tipo} onChange={e => setNewStock({...newStock, tipo: e.target.value})}>
                      <option value="player">Player</option><option value="fan">Fan</option><option value="retro">Retro</option><option value="children">Niño</option><option value="guayo">Guayo</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-1">Talla</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-700 outline-none" value={newStock.talla} onChange={e => setNewStock({...newStock, talla: e.target.value})}>
                      {['S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', '41', '42', '43'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if(!newStock.referencia) return;
                    setStock([{id: Date.now(), ...newStock}, ...stock]);
                    setNewStock({referencia: '', talla: 'L', tipo: 'player'});
                  }} 
                  className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black text-[11px] uppercase shadow-lg shadow-orange-100 active:scale-95 transition-all"
                >
                  Registrar en Stock
                </button>
              </div>
            )}

            {/* Lógica de Deudas */}
            {modo === 'deudas' && (
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6 animate-in slide-in-from-left">
                <h3 className="text-xs font-black uppercase text-red-600 italic tracking-widest border-b pb-4">Nueva Cuenta por Cobrar</h3>
                <Input label="Nombre del Cliente" value={newDeuda.cliente} onChange={v => setNewDeuda({...newDeuda, cliente: v})} />
                <Input label="Monto Total (COP)" type="number" value={newDeuda.monto} onChange={v => setNewDeuda({...newDeuda, monto: v})} />
                <button 
                  onClick={() => {
                    if(newDeuda.cliente && newDeuda.monto) {
                      setDeudas([{id: Date.now(), ...newDeuda, fecha: new Date().toLocaleDateString()}, ...deudas]);
                      setNewDeuda({cliente: '', monto: ''});
                    }
                  }} 
                  className="w-full bg-red-500 text-white p-5 rounded-2xl font-black text-[11px] uppercase shadow-lg shadow-red-100 active:scale-95 transition-all"
                >
                  Registrar Deuda
                </button>
              </div>
            )}
          </aside>

          {/* --- ÁREA PRINCIPAL (VISUALIZACIÓN DE CUADROS Y LISTAS) --- */}
          <main className="lg:col-span-8 space-y-8">
            
            {/* 1. SECCIÓN DE LOTE EN PREPARACIÓN */}
            {(modo === 'camisetas' || modo === 'zapatos') && (
              <div className="space-y-6">
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <div>
                      <h2 className="text-sm font-black uppercase text-slate-800">Lote en Curso</h2>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Productos pendientes por consolidar</p>
                    </div>
                    <span className="bg-indigo-100 text-indigo-600 px-4 py-2 rounded-full text-[10px] font-black uppercase">{items.length} Items</span>
                  </div>
                  <div className="overflow-x-auto px-4">
                    <table className="w-full">
                      <thead>
                        <tr className="text-[9px] font-black text-slate-400 uppercase border-b border-slate-50">
                          <th className="p-5 text-left">Referencia</th>
                          <th className="p-5 text-center">Inversión Unit.</th>
                          <th className="p-5 text-right">Utilidad Est.</th>
                          <th className="p-5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {items.map(item => {
                          const { costoCOP, ganancia } = calcularValores(item, tasaCOP);
                          return (
                            <tr key={item.id} className="group hover:bg-slate-50/80 transition-colors">
                              <td className="p-5">
                                <div className="font-bold text-slate-800 text-sm uppercase leading-tight">{item.nombre}</div>
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.tipoItem === 'zapato' ? 'Calzado' : item.tipo}</div>
                              </td>
                              <td className="p-5 text-center font-bold text-slate-500 text-xs">{fmt(costoCOP)}</td>
                              <td className="p-5 text-right"><span className="text-emerald-600 font-black text-xs">+{fmt(ganancia)}</span></td>
                              <td className="p-5 text-right"><button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-slate-200 hover:text-red-500 font-bold transition-colors">✕</button></td>
                            </tr>
                          );
                        })}
                        {items.length === 0 && <tr><td colSpan="4" className="p-16 text-center text-slate-300 font-bold text-xs uppercase tracking-widest italic">No hay productos en el lote</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="bg-indigo-600 p-10 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row justify-between items-center text-white border-b-[12px] border-indigo-800/50 transition-all hover:translate-y-[-4px]">
                    <div>
                      <p className="text-indigo-200 text-[10px] font-black uppercase mb-1 tracking-[0.3em]">Utilidad Total Estimada del Lote</p>
                      <h2 className="text-5xl font-black tracking-tighter">{fmt(items.reduce((acc, i) => acc + calcularValores(i, tasaCOP).ganancia, 0))}</h2>
                      <div className="mt-3 flex gap-4 text-[9px] font-black text-indigo-200 uppercase">
                        <span>Lote: {modo}</span>
                        <span>TRM: {tasaCOP}</span>
                      </div>
                    </div>
                    <button 
                      onClick={guardarLotePrincipal} 
                      className="mt-6 md:mt-0 bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black text-[12px] uppercase shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      {cargando ? 'Procesando...' : 'Finalizar y Guardar Registro'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 2. CUADRO DE HISTORIAL (LOGS) */}
            {(modo === 'camisetas' || modo === 'zapatos') && (
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                  <h2 className="text-sm font-black uppercase text-slate-800 tracking-wider">Historial de Importaciones</h2>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[9px] font-black text-slate-300 uppercase border-b border-slate-50">
                        <th className="p-5 text-left">Fecha de Consolidación</th>
                        <th className="p-5 text-center">Unidades</th>
                        <th className="p-5 text-center">Tipo</th>
                        <th className="p-5 text-right">Ganancia Total</th>
                        <th className="p-5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {historial.map(lote => (
                        <tr key={lote.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-5 text-xs font-bold text-slate-600">{lote.fecha}</td>
                          <td className="p-5 text-center text-xs font-black text-slate-400">{lote.und} UND</td>
                          <td className="p-5 text-center"><span className="text-[8px] font-black bg-indigo-50 text-indigo-500 px-2 py-1 rounded uppercase">{lote.tipo}</span></td>
                          <td className="p-5 text-right font-black text-emerald-600 text-sm">{fmt(lote.ganancia)}</td>
                          <td className="p-5 text-right">
                            <button onClick={() => setHistorial(historial.filter(h => h.id !== lote.id))} className="text-slate-200 hover:text-red-300 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. CUADRO DE BODEGA (STOCK) */}
            {modo === 'stock' && (
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-500">
                <div className="p-6 border-b border-slate-50 bg-orange-50/30 flex justify-between items-center">
                  <h2 className="text-sm font-black uppercase text-orange-800">Bodega Gol93</h2>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Capacidad Actual</p>
                    <p className="text-sm font-black text-orange-600 tracking-tighter">{stock.length} Artículos</p>
                  </div>
                </div>
                <div className="overflow-x-auto px-4">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[9px] font-black text-slate-300 uppercase border-b border-slate-50">
                        <th className="p-5 text-left">Referencia</th>
                        <th className="p-5 text-center">Calidad</th>
                        <th className="p-5 text-center">Talla</th>
                        <th className="p-5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {stock.map(item => (
                        <tr key={item.id} className="hover:bg-orange-50/20 transition-colors">
                          <td className="p-5 font-bold text-slate-700 text-sm uppercase">{item.referencia}</td>
                          <td className="p-5 text-center"><span className="text-[9px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-md">{item.tipo}</span></td>
                          <td className="p-5 text-center"><span className="text-xs font-black text-orange-600">Talla {item.talla}</span></td>
                          <td className="p-5 text-right">
                            <button onClick={() => setStock(stock.filter(i => i.id !== item.id))} className="bg-emerald-50 text-emerald-600 px-5 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-sm">Vendido</button>
                          </td>
                        </tr>
                      ))}
                      {stock.length === 0 && <tr><td colSpan="4" className="p-24 text-center text-slate-300 font-bold text-xs uppercase italic">Bodega vacía - Registra nuevos artículos</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. CUADRO DE CARTERA (DEUDAS) */}
            {modo === 'deudas' && (
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom duration-500">
                <div className="p-6 border-b border-slate-50 bg-red-50/40 flex justify-between items-center">
                  <h2 className="text-sm font-black uppercase text-red-800">Cuentas por Cobrar</h2>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Total en Cartera</p>
                    <p className="text-xl font-black text-red-600 tracking-tighter">{fmt(deudas.reduce((acc, d) => acc + parseFloat(d.monto), 0))}</p>
                  </div>
                </div>
                <div className="overflow-x-auto px-4">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[9px] font-black text-slate-300 uppercase">
                        <th className="p-5 text-left">Fecha</th>
                        <th className="p-5 text-left">Cliente</th>
                        <th className="p-5 text-center">Saldo</th>
                        <th className="p-5 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {deudas.map(deuda => (
                        <tr key={deuda.id} className="hover:bg-red-50/20 transition-colors">
                          <td className="p-5 text-[10px] font-bold text-slate-400 italic">{deuda.fecha}</td>
                          <td className="p-5"><div className="font-black text-slate-800 text-sm uppercase tracking-tight">{deuda.cliente}</div></td>
                          <td className="p-5 text-center font-black text-red-600 text-sm">{fmt(deuda.monto)}</td>
                          <td className="p-5 text-right">
                            <button onClick={() => setDeudas(deudas.filter(d => d.id !== deuda.id))} className="bg-white border border-red-100 text-red-500 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase hover:bg-red-600 hover:text-white transition-all shadow-sm">Marcar como Pago</button>
                          </td>
                        </tr>
                      ))}
                      {deudas.length === 0 && <tr><td colSpan="4" className="p-24 text-center text-slate-300 font-bold text-xs uppercase italic">No hay cuentas pendientes por cobrar</td></tr>}
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

// --- COMPONENTE DE ENTRADA ESTILIZADO ---
const Input = ({ label, onChange, placeholder, ...props }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-wider">{label}</label>
    <input 
      {...props} 
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)} 
      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none font-bold text-slate-700 text-sm focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-300" 
    />
  </div>
);

export default App;