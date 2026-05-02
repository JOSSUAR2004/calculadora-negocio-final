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

  // --- CONSTANTES LOGÍSTICAS (CHINA -> USA -> COLOMBIA) ---
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
  const [newStock, setNewStock] = useState({ referencia: '', talla: '', tipo: 'player' });

  // --- LÓGICA DE CÁLCULO ---
  const calcularValores = (item, trm) => {
    if (item.tipoItem === 'zapato') {
      const costoTotalUSD = parseFloat(item.costoUSD) + item.costoLogisticaUSD;
      const costoCOP = costoTotalUSD * trm;
      const venta = costoCOP / (1 - (item.margen / 100));
      return { 
        costoCOP, 
        venta, 
        ganancia: venta - costoCOP,
        costoUSD: costoTotalUSD
      };
    } else {
      const costoExtrasUSD = (item.dorsal ? 1 : 0) + (parseInt(item.parches) || 0);
      const costoTotalUSD = item.costoBaseUSD + costoExtrasUSD;
      const costoCOP = costoTotalUSD * trm;
      const venta = PRECIOS_VENTA_JERSEY[item.tipo];
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
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* NAV SUPERIOR DETALLADA */}
        <header className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6 bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <span className="text-white font-black text-xl">G</span>
            </div>
            <div>
              <h1 className="text-2xl font-black italic uppercase tracking-tighter">Gol93<span className="text-emerald-500">Store</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Panel de Importación v2.0</p>
            </div>
          </div>

          <nav className="flex bg-slate-100 p-1.5 rounded-2xl w-full lg:w-auto overflow-x-auto border border-slate-200">
            {[
              { id: 'camisetas', label: 'Jerseys', icon: '👕' },
              { id: 'zapatos', label: 'Guayos', icon: '👟' },
              { id: 'stock', label: 'Inventario', icon: '📦' },
              { id: 'deudas', label: 'Cuentas', icon: '💸' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setModo(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[11px] uppercase transition-all duration-300 whitespace-nowrap ${modo === tab.id ? 'bg-white shadow-md text-slate-900 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 bg-emerald-50 p-1.5 rounded-2xl border border-emerald-100">
            <div className="px-3">
              <p className="text-[8px] font-black text-emerald-600 uppercase">TRM Mercado</p>
              <input 
                type="number" 
                value={tasaCOP} 
                onChange={(e) => setTasaCOP(parseFloat(e.target.value) || 0)} 
                className="bg-transparent border-none outline-none font-black text-emerald-800 text-lg w-24"
              />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* PANEL LATERAL DE ENTRADA */}
          <aside className="lg:col-span-4 space-y-6">
            {modo === 'zapatos' && (
              <section className="animate-in fade-in slide-in-from-left duration-500">
                <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-2xl mb-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                  <InputDark label="Capacidad Caja (Pares)" type="number" value={cajaZapatos.cantidadTotalCaja} onChange={v => setCajaZapatos({cantidadTotalCaja: v})} />
                  <p className="mt-4 text-[9px] text-slate-400 font-medium">Logística calculada: <span className="text-emerald-400 font-bold">${((ENVIO_CHINA_USA + CARGOS_FIJOS + ((cajaZapatos.cantidadTotalCaja * PESO_PAR_LB) * COSTO_LIBRA)) / cajaZapatos.cantidadTotalCaja).toFixed(2)} USD/par</span></p>
                </div>
                
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-5">
                  <Input label="Referencia del Guayo" placeholder="Ej: Predator Edge" value={newZapato.nombre} onChange={v => setNewZapato({...newZapato, nombre: v})} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Costo China (USD)" type="number" value={newZapato.costoUSD} onChange={v => setNewZapato({...newZapato, costoUSD: v})} />
                    <Input label="Margen Deseado %" type="number" value={newZapato.margen} onChange={v => setNewZapato({...newZapato, margen: v})} />
                  </div>
                  <Input label="Pares a Importar" type="number" value={newZapato.cantidad} onChange={v => setNewZapato({...newZapato, cantidad: v})} />
                  <button onClick={agregarZapato} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white p-5 rounded-2xl font-black text-xs uppercase shadow-lg shadow-emerald-100 transition-all active:scale-95">Registrar en Lote</button>
                </div>
              </section>
            )}

            {modo === 'camisetas' && (
              <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-5 border-b-[6px] border-indigo-500 animate-in fade-in slide-in-from-left duration-500">
                <Input label="Equipo / Selección" placeholder="Ej: Real Madrid Local" value={newJersey.nombre} onChange={v => setNewJersey({...newJersey, nombre: v})} />
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Calidad / Versión</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-2 ring-indigo-500/20"
                    value={newJersey.tipo} 
                    onChange={e => setNewJersey({...newJersey, tipo: e.target.value})}
                  >
                    {Object.keys(COSTOS_BASE_JERSEY).map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4 items-end">
                  <Input label="Cant. Parches" type="number" value={newJersey.parches} onChange={v => setNewJersey({...newJersey, parches: v})} />
                  <button 
                    onClick={() => setNewJersey({...newJersey, dorsal: !newJersey.dorsal})}
                    className={`p-4 rounded-2xl border-2 font-black text-[10px] h-[58px] transition-all ${newJersey.dorsal ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-400'}`}
                  >
                    {newJersey.dorsal ? 'CON DORSAL (+1$)' : 'SIN DORSAL'}
                  </button>
                </div>
                <Input label="Unidades" type="number" value={newJersey.cantidad} onChange={v => setNewJersey({...newJersey, cantidad: v})} />
                <button onClick={agregarJersey} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-5 rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-100 transition-all active:scale-95">Agregar al Carrito</button>
              </section>
            )}

            {modo === 'stock' && (
              <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-5 animate-in fade-in duration-500">
                <h3 className="text-xs font-black uppercase text-orange-500 italic">Nuevo Ingreso a Bodega</h3>
                <Input label="Referencia" value={newStock.referencia} onChange={v => setNewStock({...newStock, referencia: v})} />
                <Input label="Talla" placeholder="Ej: 40 o L" value={newStock.talla} onChange={v => setNewStock({...newStock, talla: v})} />
                <button 
                  onClick={() => {
                    if(!newStock.referencia) return;
                    setStock([{id: Date.now(), ...newStock}, ...stock]);
                    setNewStock({referencia: '', talla: '', tipo: 'player'});
                  }} 
                  className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black text-xs uppercase shadow-lg shadow-orange-100"
                >
                  Confirmar Entrada
                </button>
              </section>
            )}

            {modo === 'deudas' && (
              <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-5 animate-in fade-in duration-500">
                <h3 className="text-xs font-black uppercase text-red-500 italic">Registrar Saldo Pendiente</h3>
                <Input label="Nombre del Cliente" id="d-nom" />
                <Input label="Valor Total COP" type="number" id="d-val" />
                <button 
                  onClick={() => {
                    const n = document.getElementById('d-nom').value;
                    const v = document.getElementById('d-val').value;
                    if(n && v) {
                      setDeudas([{id: Date.now(), cliente: n, monto: v, fecha: new Date().toLocaleDateString()}, ...deudas]);
                      document.getElementById('d-nom').value = '';
                      document.getElementById('d-val').value = '';
                    }
                  }} 
                  className="w-full bg-red-500 text-white p-5 rounded-2xl font-black text-xs uppercase shadow-lg shadow-red-100"
                >
                  Crear Cuenta Cobro
                </button>
              </section>
            )}
          </aside>

          {/* ÁREA DE VISUALIZACIÓN DE DATOS */}
          <main className="lg:col-span-8 space-y-8">
            
            {(modo === 'camisetas' || modo === 'zapatos') && (
              <div className="space-y-8">
                {/* LISTA ACTUAL */}
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Items en Proceso de Cálculo</span>
                    <span className="bg-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm">{items.length} productos</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase">
                          <th className="p-6">Descripción</th>
                          <th className="p-6 text-center">Inversión (COP)</th>
                          <th className="p-6 text-right">Utilidad</th>
                          <th className="p-6"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {items.length === 0 && (
                          <tr>
                            <td colSpan="4" className="p-20 text-center">
                              <p className="text-slate-300 font-bold italic">No hay productos en este lote temporal</p>
                            </td>
                          </tr>
                        )}
                        {items.map(item => {
                          const { costoCOP, ganancia } = calcularValores(item, tasaCOP);
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="p-6">
                                <div className="font-bold text-slate-800 text-sm uppercase">{item.nombre}</div>
                                <div className="text-[9px] font-black text-slate-400 uppercase italic flex items-center gap-2">
                                  {item.tipoItem === 'zapato' ? 'Guayo Pro' : `Jersey ${item.tipo}`}
                                  <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                  {item.tipoItem === 'zapato' ? `Logística: $${item.costoLogisticaUSD.toFixed(2)}` : `Extras: ${item.parches}P + ${item.dorsal ? 'D' : '0'}`}
                                </div>
                              </td>
                              <td className="p-6 text-center font-bold text-slate-500 text-xs">{fmt(costoCOP)}</td>
                              <td className="p-6 text-right">
                                <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg font-black text-xs">+{fmt(ganancia)}</span>
                              </td>
                              <td className="p-6 text-right">
                                <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-slate-200 hover:text-red-500 transition-colors">✕</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RESUMEN Y ACCIÓN DE GUARDADO */}
                {items.length > 0 && (
                  <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl relative overflow-hidden border-b-[8px] border-emerald-500">
                    <div className="relative z-10">
                      <p className="text-emerald-400 text-[11px] font-black uppercase tracking-widest mb-2">Proyección de Ganancia Neta</p>
                      <h2 className="text-5xl font-black tracking-tighter">
                        {fmt(items.reduce((acc, i) => acc + calcularValores(i, tasaCOP).ganancia, 0))}
                      </h2>
                    </div>
                    <button 
                      onClick={guardarLotePrincipal} 
                      disabled={cargando}
                      className={`relative z-10 w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 px-10 py-5 rounded-2xl font-black text-xs uppercase transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-3 ${cargando ? 'opacity-50' : ''}`}
                    >
                      {cargando ? 'Procesando...' : 'Finalizar y Guardar Lote'}
                    </button>
                  </div>
                )}

                {/* HISTORIAL DE LOTES (TARJETAS) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registros de Actividad Reciente</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {historial.length === 0 && (
                      <div className="col-span-full bg-white/50 border-2 border-dashed border-slate-200 p-10 rounded-[2rem] text-center text-slate-400 font-bold italic">
                        El historial aparecerá aquí al guardar tu primer lote
                      </div>
                    )}
                    {historial.map(lote => (
                      <div 
                        key={lote.id} 
                        className="bg-white p-5 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                      >
                        <div className="cursor-pointer" onClick={() => setLoteSeleccionado(lote)}>
                          <p className="text-[9px] font-black text-slate-800 mb-1">{lote.fecha}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase ${lote.tipo === 'zapatos' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                              {lote.tipo}
                            </span>
                            <span className="text-[8px] font-bold text-slate-400">{lote.und} UNIDADES</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs font-black text-emerald-600 leading-none">{fmt(lote.ganancia)}</p>
                            <p className="text-[8px] font-bold text-slate-300 mt-1 uppercase">Ganancia</p>
                          </div>
                          <button onClick={() => setHistorial(historial.filter(h => h.id !== lote.id))} className="w-8 h-8 rounded-full bg-slate-50 text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center font-black">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {modo === 'stock' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in zoom-in-95 duration-300">
                {stock.map(item => (
                  <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => setStock(stock.filter(i => i.id !== item.id))} className="text-red-400 font-black">✕</button>
                    </div>
                    <p className="font-black text-slate-800 text-sm uppercase mb-1">{item.referencia}</p>
                    <div className="flex justify-between items-end mt-4">
                      <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-3 py-1 rounded-full uppercase">Talla {item.talla}</span>
                      <button 
                        onClick={() => setStock(stock.filter(i => i.id !== item.id))}
                        className="text-[9px] font-black bg-slate-900 text-white px-4 py-2 rounded-xl uppercase hover:bg-emerald-500 transition-colors shadow-lg shadow-slate-100"
                      >
                        Vendido
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {modo === 'deudas' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-right duration-300">
                {deudas.map(deuda => (
                  <div key={deuda.id} className="bg-white p-6 rounded-[2rem] border-l-[6px] border-red-500 shadow-md flex justify-between items-center group">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{deuda.fecha || 'Sin fecha'}</p>
                      <p className="font-black text-slate-800 text-lg uppercase leading-none mb-2">{deuda.cliente}</p>
                      <p className="text-2xl font-black text-red-600 tracking-tighter">{fmt(deuda.monto)}</p>
                    </div>
                    <button 
                      onClick={() => setDeudas(deudas.filter(d => d.id !== deuda.id))}
                      className="bg-red-50 text-red-400 px-4 py-2 rounded-xl font-black text-[10px] uppercase group-hover:bg-red-500 group-hover:text-white transition-all"
                    >
                      Pagado
                    </button>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MODAL DE DETALLE DE LOTE (MÁS DE 60 LÍNEAS DE LÓGICA DE UI) */}
      {loteSeleccionado && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col scale-in-center">
            
            <div className="p-8 md:p-10 bg-[#f8fafc] border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                   <span className="bg-slate-900 text-white text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest italic">{loteSeleccionado.tipo}</span>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{loteSeleccionado.fecha}</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black uppercase italic text-slate-800 leading-none">Desglose de Operación</h3>
              </div>
              <button 
                onClick={() => setLoteSeleccionado(null)} 
                className="bg-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center font-black text-slate-400 hover:text-red-500 transition-colors border border-slate-100"
              >✕</button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-6 md:p-10 bg-white">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-300 uppercase bg-slate-50/50 sticky top-0">
                  <tr>
                    <th className="p-4">Producto</th>
                    <th className="p-4 text-center">Costo Unit.</th>
                    <th className="p-4 text-center">Venta Sugerida</th>
                    <th className="p-4 text-right">Ganancia Neta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loteSeleccionado.productos.map((prod, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50/30 transition-colors">
                      <td className="p-5">
                        <span className="font-bold text-slate-800 block uppercase text-sm">{prod.nombre}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase italic">
                           Inversión: ${(prod.costoUSD).toFixed(2)} USD
                        </span>
                      </td>
                      <td className="p-5 text-center font-bold text-slate-400 text-xs">{fmt(prod.costoCOP)}</td>
                      <td className="p-5 text-center font-black text-indigo-500 text-xs md:text-sm">{fmt(prod.venta)}</td>
                      <td className="p-5 text-right font-black text-emerald-500 text-xs md:text-sm">+{fmt(prod.ganancia)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 md:p-12 bg-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-6">
                 <div className="text-center md:text-left border-r border-slate-700 pr-6">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">TRM Registro</p>
                    <p className="text-white font-black text-xl">{loteSeleccionado.trm}</p>
                 </div>
                 <div className="text-center md:text-left">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Unidades Totales</p>
                    <p className="text-white font-black text-xl">{loteSeleccionado.und}</p>
                 </div>
               </div>
               <div className="text-center md:text-right">
                  <p className="text-[10px] font-black text-emerald-400 uppercase mb-2 tracking-[0.2em]">Utilidad Final del Lote</p>
                  <p className="text-4xl md:text-5xl font-black text-white leading-none tracking-tighter">{fmt(loteSeleccionado.ganancia)}</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTES ATÓMICOS DE ALTA CALIDAD ---
const Input = ({ label, onChange, ...p }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-wider">{label}</label>
    <input 
      {...p} 
      onChange={e => onChange(e.target.value)} 
      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none font-bold text-slate-700 text-sm focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300" 
    />
  </div>
);

const InputDark = ({ label, onChange, ...p }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[10px] font-black text-slate-500 uppercase mb-1 px-1 tracking-wider">{label}</label>
    <input 
      {...p} 
      onChange={e => onChange(e.target.value)} 
      className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none font-bold text-white text-sm focus:ring-2 ring-emerald-500/20 focus:border-emerald-400 transition-all" 
    />
  </div>
);

export default App;