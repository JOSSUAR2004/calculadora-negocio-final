import React, { useState, useEffect } from 'react';

const App = () => {
  // --- ESTADOS Y PERSISTENCIA ---
  const [tasaCOP, setTasaCOP] = useState(() => JSON.parse(localStorage.getItem('g93_tasa')) || 4000);
  const [modo, setModo] = useState('camisetas'); 
  const [items, setItems] = useState([]); 
  const [historial, setHistorial] = useState(() => JSON.parse(localStorage.getItem('g93_historial')) || []);
  const [stock, setStock] = useState(() => JSON.parse(localStorage.getItem('g93_stock')) || []);
  const [deudas, setDeudas] = useState(() => JSON.parse(localStorage.getItem('g93_deudas')) || []);

  useEffect(() => {
    localStorage.setItem('g93_tasa', JSON.stringify(tasaCOP));
    localStorage.setItem('g93_historial', JSON.stringify(historial));
    localStorage.setItem('g93_stock', JSON.stringify(stock));
    localStorage.setItem('g93_deudas', JSON.stringify(deudas));
  }, [tasaCOP, historial, stock, deudas]);

  // --- CONSTANTES LÓGICA ---
  const COSTO_LIBRA = 3.10; 
  const ENVIO_CHINA_USA = 10;
  const CARGOS_FIJOS = 7;
  const PESO_PAR_LB = 1.32; 

  const COSTOS_BASE_JERSEY = { fan: 13, player: 16, retro: 17, children: 15, nba: 23 };
  const PRECIOS_VENTA_JERSEY = { fan: 125000, player: 140000, retro: 150000, children: 110000, nba: 180000 };

  const [cajaZapatos, setCajaZapatos] = useState({ cantidadTotalCaja: 1 });
  const [newZapato, setNewZapato] = useState({ nombre: '', costoUSD: '', margen: 30 });
  const [newJersey, setNewJersey] = useState({ nombre: '', tipo: 'player', parches: 0, dorsal: false });

  const agregarZapato = () => {
    if (!newZapato.nombre || !newZapato.costoUSD) return;
    const nTotal = parseInt(cajaZapatos.cantidadTotalCaja) || 1;
    const logisticaUSD = (ENVIO_CHINA_USA + CARGOS_FIJOS + (nTotal * PESO_PAR_LB * COSTO_LIBRA)) / nTotal;
    setItems([...items, { ...newZapato, id: Date.now(), logisticaUSD, tipoItem: 'zapato' }]);
    setNewZapato({ ...newZapato, nombre: '', costoUSD: '' });
  };

  const agregarJersey = () => {
    if (!newJersey.nombre) return;
    setItems([...items, { ...newJersey, id: Date.now(), tipoItem: 'camiseta' }]);
    setNewJersey({ ...newJersey, nombre: '', parches: 0, dorsal: false });
  };

  const calcular = (item) => {
    if (item.tipoItem === 'zapato') {
      const costoUSD = parseFloat(item.costoUSD) + item.logisticaUSD;
      const costoCOP = costoUSD * tasaCOP;
      const venta = costoCOP / (1 - (item.margen / 100));
      return { costoCOP, venta, ganancia: venta - costoCOP };
    } else {
      const extras = (item.dorsal ? 1 : 0) + (parseInt(item.parches) || 0);
      const costoCOP = (COSTOS_BASE_JERSEY[item.tipo] + extras) * tasaCOP;
      const venta = PRECIOS_VENTA_JERSEY[item.tipo];
      return { costoCOP, venta, ganancia: venta - costoCOP };
    }
  };

  const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* NAV PRINCIPAL */}
        <div className="bg-white p-4 rounded-[2rem] shadow-sm flex flex-wrap justify-between items-center gap-4">
          <h1 className="font-black italic text-2xl tracking-tighter">GOL93<span className="text-emerald-500">STORE</span></h1>
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            {['camisetas', 'zapatos', 'stock', 'deudas'].map(m => (
              <button key={m} onClick={() => setModo(m)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${modo === m ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>{m}</button>
            ))}
          </div>
          <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2">
            <span className="text-[9px] font-black text-emerald-600">TRM</span>
            <input type="number" value={tasaCOP} onChange={e => setTasaCOP(e.target.value)} className="bg-transparent font-bold w-16 text-right outline-none text-emerald-900" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* FORMULARIOS IZQUIERDA */}
          <div className="lg:col-span-4 space-y-4">
            {modo === 'camisetas' && (
              <div className="bg-white p-6 rounded-[2.5rem] border-b-8 border-indigo-500 shadow-xl space-y-4">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] text-center">Cotizador Jersey</p>
                <input type="text" placeholder="EQUIPO" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm border border-slate-100" value={newJersey.nombre} onChange={e => setNewJersey({...newJersey, nombre: e.target.value.toUpperCase()})} />
                <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm border border-slate-100" value={newJersey.tipo} onChange={e => setNewJersey({...newJersey, tipo: e.target.value})}>
                  {Object.keys(COSTOS_BASE_JERSEY).map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="number" placeholder="Parches" className="w-1/2 p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm border border-slate-100" value={newJersey.parches} onChange={e => setNewJersey({...newJersey, parches: e.target.value})} />
                  <button onClick={() => setNewJersey({...newJersey, dorsal: !newJersey.dorsal})} className={`w-1/2 rounded-2xl font-black text-[10px] transition-all ${newJersey.dorsal ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-300'}`}>{newJersey.dorsal ? 'DORSAL ON' : 'SIN DORSAL'}</button>
                </div>
                <button onClick={agregarJersey} className="w-full bg-indigo-500 text-white p-4 rounded-2xl font-black text-xs shadow-lg shadow-indigo-100 active:scale-95 transition-transform">AÑADIR A LISTA</button>
              </div>
            )}

            {modo === 'zapatos' && (
              <div className="bg-white p-6 rounded-[2.5rem] border-b-8 border-emerald-500 shadow-xl space-y-4">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] text-center">Cotizador Guayos</p>
                <input type="number" placeholder="TOTAL PARES CAJA" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm border border-slate-100" onChange={e => setCajaZapatos({cantidadTotalCaja: e.target.value})} />
                <input type="text" placeholder="MODELO / COLOR" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm border border-slate-100" value={newZapato.nombre} onChange={e => setNewZapato({...newZapato, nombre: e.target.value.toUpperCase()})} />
                <div className="flex gap-2">
                  <input type="number" placeholder="USD COSTO" className="w-1/2 p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm border border-slate-100" value={newZapato.costoUSD} onChange={e => setNewZapato({...newZapato, costoUSD: e.target.value})} />
                  <input type="number" placeholder="MARGEN %" className="w-1/2 p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm border border-slate-100" value={newZapato.margen} onChange={e => setNewZapato({...newZapato, margen: e.target.value})} />
                </div>
                <button onClick={agregarZapato} className="w-full bg-emerald-500 text-white p-4 rounded-2xl font-black text-xs shadow-lg shadow-emerald-100 active:scale-95 transition-transform">AÑADIR A LISTA</button>
              </div>
            )}
          </div>

          {/* COLUMNA PRINCIPAL */}
          <div className="lg:col-span-8">
            
            {/* VISTA: STOCK (COLORES SLATE/CARBON) */}
            {modo === 'stock' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5 bg-white p-6 rounded-[2.5rem] shadow-sm border-b-8 border-slate-800 space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Registro de Inventario</p>
                  <input type="text" id="sk-nom" placeholder="Producto (Ej: Jersey L)" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm" />
                  <select id="sk-tipo" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm">
                    <option value="jersey">Jersey</option>
                    <option value="guayo">Guayo</option>
                  </select>
                  <button onClick={() => {
                    const n = document.getElementById('sk-nom').value;
                    const t = document.getElementById('sk-tipo').value;
                    if(n) { setStock([{id: Date.now(), nombre: n.toUpperCase(), tipo: t}, ...stock]); document.getElementById('sk-nom').value = ''; }
                  }} className="w-full bg-slate-800 text-white p-4 rounded-2xl font-black text-xs shadow-lg shadow-slate-200 uppercase">Guardar en Bodega</button>
                </div>
                <div className="md:col-span-7 grid grid-cols-1 gap-3">
                  {stock.map(s => (
                    <div key={s.id} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex justify-between items-center group">
                      <div>
                        <span className="text-[7px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase italic tracking-widest">{s.tipo}</span>
                        <p className="font-black text-slate-700 uppercase text-sm mt-1">{s.nombre}</p>
                      </div>
                      <button onClick={() => setStock(stock.filter(i => i.id !== s.id))} className="bg-slate-50 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-emerald-500 hover:text-white transition-all uppercase">Vendido</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VISTA: DEUDAS (COLORES RED/ROSE) */}
            {modo === 'deudas' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5 bg-white p-6 rounded-[2.5rem] shadow-sm border-b-8 border-red-500 space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nuevo Pendiente</p>
                  <input type="text" id="d-cli" placeholder="Nombre Cliente" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm" />
                  <input type="number" id="d-mon" placeholder="Monto total COP" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm" />
                  <input type="text" id="d-con" placeholder="¿Qué se llevó?" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-[10px] italic" />
                  <button onClick={() => {
                    const c = document.getElementById('d-cli').value;
                    const m = document.getElementById('d-mon').value;
                    const o = document.getElementById('d-con').value;
                    if(c && m) { setDeudas([{id: Date.now(), cliente: c, monto: m, concepto: o}, ...deudas]); document.getElementById('d-cli').value = ''; document.getElementById('d-mon').value = ''; document.getElementById('d-con').value = ''; }
                  }} className="w-full bg-red-500 text-white p-4 rounded-2xl font-black text-xs shadow-lg shadow-red-100 uppercase">Registrar Saldo</button>
                </div>
                <div className="md:col-span-7 grid grid-cols-1 gap-3">
                  {deudas.map(d => (
                    <div key={d.id} className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-red-50 flex justify-between items-center relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400"></div>
                      <div>
                        <p className="text-[9px] font-black text-red-500 uppercase tracking-tighter">{d.cliente}</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">{fmt(d.monto)}</p>
                        <p className="text-[10px] font-bold text-slate-300 italic">{d.concepto}</p>
                      </div>
                      <button onClick={() => setDeudas(deudas.filter(i => i.id !== d.id))} className="text-red-100 hover:text-red-500 transition-colors text-2xl font-bold">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TABLA COTIZACIÓN */}
            {(modo === 'camisetas' || modo === 'zapatos') && (
              <div className="space-y-4">
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50/50">
                      <tr className="text-[10px] font-black text-slate-400 uppercase italic">
                        <th className="p-6 text-left">Producto</th>
                        <th className="p-6 text-center">Venta Sugerida</th>
                        <th className="p-6 text-right">Ganancia</th>
                        <th className="p-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {items.map(item => {
                        const res = calcular(item);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-6">
                              <p className="font-black text-slate-800 text-sm">{item.nombre}</p>
                              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{item.tipoItem}</p>
                            </td>
                            <td className="p-6 text-center">
                              <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full font-black text-[11px] border border-blue-100">{fmt(res.venta)}</span>
                            </td>
                            <td className="p-6 text-right font-black text-emerald-500 text-sm">{fmt(res.ganancia)}</td>
                            <td className="p-6 text-right">
                              <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-slate-200 hover:text-red-400 transition-colors">✕</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {items.length > 0 && (
                  <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex justify-between items-center shadow-2xl">
                    <div>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Ganancia Estimada</p>
                      <h2 className="text-4xl font-black text-emerald-400 tracking-tighter">{fmt(items.reduce((acc, i) => acc + calcular(i).ganancia, 0))}</h2>
                    </div>
                    <button onClick={() => {
                      const totalG = items.reduce((acc, i) => acc + calcular(i).ganancia, 0);
                      setHistorial([{id: Date.now(), fecha: new Date().toLocaleString(), ganancia: totalG}, ...historial]);
                      setItems([]);
                    }} className="bg-emerald-500 hover:bg-emerald-400 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Limpiar y Guardar</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;