import React, { useState, useEffect } from 'react';

const App = () => {
  // --- PERSISTENCIA Y ESTADOS ---
  const [tasaCOP, setTasaCOP] = useState(() => JSON.parse(localStorage.getItem('g93_tasa')) || 4100);
  const [modo, setModo] = useState('camisetas'); 
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('g93_items')) || []);
  const [historial, setHistorial] = useState(() => JSON.parse(localStorage.getItem('g93_historial')) || []);
  const [stock, setStock] = useState(() => JSON.parse(localStorage.getItem('g93_stock')) || []);
  const [deudas, setDeudas] = useState(() => JSON.parse(localStorage.getItem('g93_deudas')) || []);
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);

  useEffect(() => {
    localStorage.setItem('g93_tasa', JSON.stringify(tasaCOP));
    localStorage.setItem('g93_items', JSON.stringify(items));
    localStorage.setItem('g93_historial', JSON.stringify(historial));
    localStorage.setItem('g93_stock', JSON.stringify(stock));
    localStorage.setItem('g93_deudas', JSON.stringify(deudas));
  }, [tasaCOP, items, historial, stock, deudas]);

  // --- CONSTANTES DE OPERACIÓN LOGÍSTICA ---
  const LOGISTICA = {
    LIBRA_LOCKER: 3.10,      // Costo por libra Miami -> Colombia
    ENVIO_CHINA_USA: 10,    // Envío promedio China -> Miami
    CARGOS_FIJOS_USA: 7,    // Trámites y fletes fijos
    PESO_PAR_LB: 1.32       // Peso promedio de un par con caja
  };

  const COSTOS_BASE_JERSEY = {
    fan: 13, player: 16, retro: 17, longSleeve: 17, children: 15, nba: 23, f1_nfl: 25
  };

  const PRECIOS_VENTA_JERSEY = {
    fan: 125000, player: 140000, retro: 150000, longSleeve: 155000, children: 110000, nba: 180000, f1_nfl: 195000
  };

  // --- FORMULARIOS ---
  const [cajaZapatos, setCajaZapatos] = useState({ cantidadTotalCaja: 10 });
  const [newZapato, setNewZapato] = useState({ nombre: '', costoUSD: '', margen: 30, cantidad: 1, paraStock: false });
  const [newJersey, setNewJersey] = useState({ nombre: '', tipo: 'player', parches: 0, dorsal: false, cantidad: 1, paraStock: false });
  const [newDeuda, setNewDeuda] = useState({ cliente: '', monto: '', concepto: '', fecha: new Date().toISOString().split('T')[0] });

  // --- CÁLCULOS ---
  const calcularValores = (item, trm) => {
    const currentTrm = parseFloat(trm) || 0;
    if (item.tipoItem === 'zapato') {
      const costoTotalUSD = parseFloat(item.costoUSD || 0) + (item.costoLogisticaUSD || 0);
      const costoCOP = costoTotalUSD * currentTrm;
      const venta = costoCOP / (1 - ((item.margen || 0) / 100));
      return { costoCOP, venta, ganancia: venta - costoCOP };
    } else {
      const costoExtrasUSD = (item.dorsal ? 1 : 0) + (parseInt(item.parches) || 0);
      const costoTotalUSD = (item.costoBaseUSD || 0) + costoExtrasUSD;
      const costoCOP = costoTotalUSD * currentTrm;
      const venta = PRECIOS_VENTA_JERSEY[item.tipo] || 0;
      return { costoCOP, venta, ganancia: venta - costoCOP };
    }
  };

  const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0);

  // --- ACCIONES ---
  const agregarZapato = () => {
    if (!newZapato.nombre || !newZapato.costoUSD) return alert("Datos incompletos");
    const nTotalCaja = parseInt(cajaZapatos.cantidadTotalCaja) || 1;
    const logisticaPorParUSD = (LOGISTICA.ENVIO_CHINA_USA + LOGISTICA.CARGOS_FIJOS_USA + (nTotalCaja * LOGISTICA.PESO_PAR_LB * LOGISTICA.LIBRA_LOCKER)) / nTotalCaja;

    const nuevos = Array.from({ length: parseInt(newZapato.cantidad) || 1 }, () => ({
      ...newZapato,
      id: Date.now() + Math.random(),
      costoLogisticaUSD: logisticaPorParUSD,
      tipoItem: 'zapato',
      fechaRegistro: new Date().toLocaleString()
    }));

    if (newZapato.paraStock) setStock([...stock, ...nuevos]);
    else setItems([...items, ...nuevos]);
    setNewZapato({ ...newZapato, nombre: '', costoUSD: '', cantidad: 1 });
  };

  const agregarJersey = () => {
    if (!newJersey.nombre) return alert("Escribe el nombre del equipo");
    const nuevos = Array.from({ length: parseInt(newJersey.cantidad) || 1 }, () => ({
      ...newJersey,
      id: Date.now() + Math.random(),
      costoBaseUSD: COSTOS_BASE_JERSEY[newJersey.tipo],
      tipoItem: 'camiseta',
      fechaRegistro: new Date().toLocaleString()
    }));

    if (newJersey.paraStock) setStock([...stock, ...nuevos]);
    else setItems([...items, ...nuevos]);
    setNewJersey({ ...newJersey, nombre: '', parches: 0, dorsal: false, cantidad: 1 });
  };

  const registrarDeuda = () => {
    if (!newDeuda.cliente || !newDeuda.monto) return alert("Datos de deuda incompletos");
    setDeudas([...deudas, { ...newDeuda, id: Date.now() }]);
    setNewDeuda({ cliente: '', monto: '', concepto: '', fecha: new Date().toISOString().split('T')[0] });
  };

  // --- COMPONENTES DE UI ---
  const Input = ({ label, value, onChange, type = "text", placeholder = "" }) => (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{label}</label>
      <input 
        type={type} 
        value={value} 
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)} 
        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-slate-700 text-sm focus:border-indigo-500 transition-all" 
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-3 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER GLOBAL */}
        <header className="bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg rotate-3">
              <span className="text-emerald-400 font-black text-xl">G</span>
            </div>
            <div>
              <h1 className="text-2xl font-black italic uppercase leading-none text-slate-800">Gol93<span className="text-emerald-500">Store</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sistemas & Logística</p>
            </div>
          </div>

          <nav className="flex bg-slate-100 p-1.5 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar">
            {['camisetas', 'zapatos', 'stock', 'deudas', 'historial'].map(m => (
              <button 
                key={m} 
                onClick={() => setModo(m)} 
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all whitespace-nowrap ${modo === m ? 'bg-white shadow-md text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {m === 'camisetas' ? '👕 Jerseys' : m === 'zapatos' ? '👟 Guayos' : m === 'stock' ? '📦 Stock' : m === 'deudas' ? '💸 Deudas' : '📜 Log'}
              </button>
            ))}
          </nav>

          <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 flex flex-row items-center gap-4 w-full lg:w-auto">
            <div className="text-left">
              <span className="text-[9px] font-black text-emerald-600 uppercase block">TRM del día</span>
              <div className="flex items-center">
                <span className="font-black text-emerald-700 mr-1">$</span>
                <input 
                  type="number" 
                  value={tasaCOP} 
                  onChange={(e) => setTasaCOP(parseFloat(e.target.value) || 0)} 
                  className="bg-transparent border-none outline-none text-xl font-black text-emerald-800 w-24" 
                />
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* PANEL IZQUIERDO: INPUTS SEGÚN MODO */}
          <aside className="lg:col-span-4 space-y-6">
            
            {modo === 'zapatos' && (
              <div className="space-y-6 animate-in slide-in-from-left duration-500">
                <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-2xl border-b-8 border-emerald-500">
                  <h3 className="text-xs font-black uppercase text-emerald-400 mb-4 tracking-tighter">Configuración de Importación</h3>
                  <Input 
                    label="Pares totales en la caja" 
                    type="number" 
                    value={cajaZapatos.cantidadTotalCaja} 
                    onChange={v => setCajaZapatos({cantidadTotalCaja: v})} 
                  />
                  <p className="mt-4 text-[10px] text-slate-400 leading-relaxed font-medium italic">
                    * El costo de envío se prorratea entre el total de pares para calcular el costo real por unidad.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 space-y-4">
                  <Input label="Referencia / Modelo" value={newZapato.nombre} onChange={v => setNewZapato({...newZapato, nombre: v})} placeholder="Ej: Predator Elite FG" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Costo (USD)" type="number" value={newZapato.costoUSD} onChange={v => setNewZapato({...newZapato, costoUSD: v})} />
                    <Input label="Margen %" type="number" value={newZapato.margen} onChange={v => setNewZapato({...newZapato, margen: v})} />
                  </div>
                  <Input label="Cantidad de pares" type="number" value={newZapato.cantidad} onChange={v => setNewZapato({...newZapato, cantidad: v})} />
                  
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input type="checkbox" className="w-4 h-4 accent-emerald-500" checked={newZapato.paraStock} onChange={e => setNewZapato({...newZapato, paraStock: e.target.checked})} />
                    <span className="text-[10px] font-black uppercase text-slate-600">Enviar directo a Stock físico</span>
                  </label>

                  <button onClick={agregarZapato} className="w-full bg-emerald-500 text-white p-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all">
                    Registrar Guayos
                  </button>
                </div>
              </div>
            )}

            {modo === 'camisetas' && (
              <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-5 animate-in slide-in-from-left duration-500 border-b-8 border-indigo-500">
                <h3 className="text-xs font-black uppercase text-indigo-500 mb-2">Nueva Orden de Jersey</h3>
                <Input label="Equipo / Selección" value={newJersey.nombre} onChange={v => setNewJersey({...newJersey, nombre: v})} placeholder="Ej: Real Madrid 24/25" />
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Versión</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm outline-none focus:border-indigo-500 appearance-none"
                    value={newJersey.tipo} 
                    onChange={e => setNewJersey({...newJersey, tipo: e.target.value})}
                  >
                    {Object.keys(COSTOS_BASE_JERSEY).map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <Input label="Parches" type="number" value={newJersey.parches} onChange={v => setNewJersey({...newJersey, parches: v})} />
                  <button 
                    onClick={() => setNewJersey({...newJersey, dorsal: !newJersey.dorsal})} 
                    className={`p-3 rounded-xl border-2 text-[9px] font-black h-[48px] transition-all ${newJersey.dorsal ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
                  >
                    {newJersey.dorsal ? '✓ CON DORSAL' : 'SIN DORSAL'}
                  </button>
                </div>

                <Input label="Unidades" type="number" value={newJersey.cantidad} onChange={v => setNewJersey({...newJersey, cantidad: v})} />
                
                <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-indigo-500" checked={newJersey.paraStock} onChange={e => setNewJersey({...newJersey, paraStock: e.target.checked})} />
                  <span className="text-[10px] font-black uppercase text-slate-600">Enviar a Stock físico</span>
                </label>

                <button onClick={agregarJersey} className="w-full bg-indigo-500 text-white p-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-600 active:scale-95 transition-all">
                  Añadir al Lote
                </button>
              </div>
            )}

            {modo === 'deudas' && (
              <div className="bg-slate-900 p-7 rounded-[2.5rem] shadow-2xl space-y-5 animate-in slide-in-from-left border-b-8 border-red-500">
                <h3 className="text-xs font-black uppercase text-red-400 mb-2">Control de Cuentas x Cobrar</h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Cliente</label>
                    <input className="bg-slate-800 text-white p-3 rounded-xl outline-none font-bold border border-slate-700 focus:border-red-500" value={newDeuda.cliente} onChange={e => setNewDeuda({...newDeuda, cliente: e.target.value})} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Monto COP</label>
                    <input type="number" className="bg-slate-800 text-white p-3 rounded-xl outline-none font-black text-lg border border-slate-700 focus:border-red-500" value={newDeuda.monto} onChange={e => setNewDeuda({...newDeuda, monto: e.target.value})} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Concepto / Producto</label>
                    <input className="bg-slate-800 text-white p-3 rounded-xl outline-none font-bold border border-slate-700 focus:border-red-500" value={newDeuda.concepto} onChange={e => setNewDeuda({...newDeuda, concepto: e.target.value})} />
                  </div>
                  <button onClick={registrarDeuda} className="w-full bg-red-500 hover:bg-red-600 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-xl transition-all">
                    Registrar Deuda
                  </button>
                </div>
              </div>
            )}
          </aside>

          {/* PANEL DERECHO: VISUALIZACIÓN */}
          <main className="lg:col-span-8 space-y-6">
            
            {/* VISTA DE LOTE ACTUAL (Solo para Camisetas/Zapatos) */}
            {(modo === 'camisetas' || modo === 'zapatos') && (
              <div className="space-y-6 animate-in fade-in duration-700">
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-widest">Items en el lote actual</h4>
                    <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-indigo-500 border border-slate-100">{items.length} UNIDADES</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                          <th className="p-5">Producto</th>
                          <th className="p-5 text-center">Costo Unit</th>
                          <th className="p-5 text-center">P. Venta Sug</th>
                          <th className="p-5 text-center text-emerald-500">Ganancia</th>
                          <th className="p-5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {items.length === 0 ? (
                          <tr><td colSpan="5" className="p-10 text-center text-slate-300 font-bold uppercase text-[10px] italic tracking-widest">No hay items en el lote</td></tr>
                        ) : (
                          items.map(item => {
                            const metricas = calcularValores(item, tasaCOP);
                            return (
                              <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                                <td className="p-5">
                                  <p className="font-bold text-slate-800 text-xs">{item.nombre}</p>
                                  <p className="text-[9px] font-black text-slate-400 uppercase italic">
                                    {item.tipoItem === 'zapato' ? 'Guayo' : `Jersey ${item.tipo}`}
                                  </p>
                                </td>
                                <td className="p-5 text-center font-bold text-slate-600 text-[11px]">{fmt(metricas.costoCOP)}</td>
                                <td className="p-5 text-center font-bold text-indigo-600 text-[11px]">{fmt(metricas.venta)}</td>
                                <td className="p-5 text-center font-black text-emerald-500 text-xs">+{fmt(metricas.ganancia)}</td>
                                <td className="p-5 text-right">
                                  <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all">✕</button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10 text-center md:text-left">
                      <p className="text-slate-400 text-[10px] font-black uppercase mb-1 tracking-widest">Rentabilidad Total Lote</p>
                      <h2 className="text-4xl font-black text-emerald-400 tracking-tighter">
                        {fmt(items.reduce((acc, i) => acc + calcularValores(i, tasaCOP).ganancia, 0))}
                      </h2>
                    </div>
                    <button 
                      onClick={() => {
                        const procesados = items.map(i => ({ ...i, ...calcularValores(i, tasaCOP) }));
                        setHistorial([{ id: Date.now(), fecha: new Date().toLocaleString(), total: procesados.reduce((a, b) => a + b.ganancia, 0), trm: tasaCOP, items: procesados, tipo: modo }, ...historial]);
                        setItems([]);
                      }} 
                      className="relative z-10 bg-emerald-500 hover:bg-emerald-600 px-10 py-5 rounded-2xl font-black text-[11px] uppercase shadow-xl hover:shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      Finalizar y Guardar Lote
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* VISTA DE STOCK */}
            {modo === 'stock' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-500">
                {stock.length === 0 && <div className="col-span-full p-20 text-center text-slate-300 font-black uppercase text-xs italic">El inventario físico está vacío</div>}
                {stock.map(s => (
                  <div key={s.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${s.tipoItem === 'zapato' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {s.tipoItem === 'zapato' ? '👟' : '👕'}
                      </div>
                      <div>
                        <p className="font-black text-xs uppercase text-slate-800">{s.nombre}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{s.tipoItem} • {s.fechaRegistro.split(',')[0]}</p>
                      </div>
                    </div>
                    <button onClick={() => setStock(stock.filter(i => i.id !== s.id))} className="text-slate-200 group-hover:text-red-400 font-black transition-colors">VENDIDO</button>
                  </div>
                ))}
              </div>
            )}

            {/* VISTA DE DEUDAS */}
            {modo === 'deudas' && (
              <div className="space-y-4 animate-in fade-in duration-500">
                {deudas.length === 0 && <div className="p-20 text-center text-slate-300 font-black uppercase text-xs italic">No hay cuentas pendientes por cobrar</div>}
                {deudas.map(d => (
                  <div key={d.id} className="bg-white p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-4 border-l-8 border-red-500 shadow-sm">
                    <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                      <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 font-black">!</div>
                      <div>
                        <p className="font-black text-sm uppercase text-slate-800">{d.cliente}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{d.concepto || 'Sin descripción'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className="text-lg font-black text-red-500">{fmt(d.monto)}</p>
                      <button 
                        onClick={() => setDeudas(deudas.filter(i => i.id !== d.id))} 
                        className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all"
                      >
                        Saldar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VISTA DE HISTORIAL (LOG) */}
            {modo === 'historial' && (
              <div className="space-y-4 animate-in fade-in">
                {historial.map(h => (
                  <div 
                    key={h.id} 
                    className="bg-white p-5 rounded-[1.5rem] border border-slate-100 flex justify-between items-center shadow-sm cursor-pointer hover:border-indigo-300 transition-colors"
                    onClick={() => setLoteSeleccionado(h)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-[10px] font-black text-slate-400">{h.items.length}u</div>
                      <div>
                        <p className="text-[11px] font-black text-slate-700">{h.fecha}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">TRM: {h.trm} • {h.tipo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5">
                      <p className="text-sm font-black text-emerald-500">+{fmt(h.total)}</p>
                      <button onClick={(e) => { e.stopPropagation(); setHistorial(historial.filter(it => it.id !== h.id))}} className="text-slate-200 hover:text-red-500">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MODAL DE DETALLE DE LOTE (HISTORIAL) */}
      {loteSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
              <div>
                <h3 className="font-black uppercase italic text-slate-800">Detalle del Lote</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{loteSeleccionado.fecha}</p>
              </div>
              <button onClick={() => setLoteSeleccionado(null)} className="w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 hover:text-red-500 transition-colors">✕</button>
            </div>
            <div className="p-8 overflow-y-auto max-h-[60vh]">
              <table className="w-full">
                <thead>
                  <tr className="text-[9px] font-black text-slate-300 uppercase text-left">
                    <th className="pb-4">Producto</th>
                    <th className="pb-4 text-center">Inversión</th>
                    <th className="pb-4 text-right">Utilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loteSeleccionado.items.map((p, idx) => (
                    <tr key={idx} className="text-xs">
                      <td className="py-4 font-bold text-slate-700">{p.nombre}</td>
                      <td className="py-4 text-center font-medium text-slate-400">{fmt(p.costoCOP)}</td>
                      <td className="py-4 text-right font-black text-emerald-500">{fmt(p.ganancia)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <span className="font-black text-xs uppercase opacity-70">Rendimiento Total</span>
              <span className="text-2xl font-black">{fmt(loteSeleccionado.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;