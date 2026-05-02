import React, { useState, useEffect } from 'react';

const App = () => {
  // --- ESTADOS Y PERSISTENCIA ---
  const [tasaCOP, setTasaCOP] = useState(() => JSON.parse(localStorage.getItem('g93_tasa')) || 4000);
  const [modo, setModo] = useState('camisetas'); 
  const [items, setItems] = useState([]); // Cotización temporal
  const [historial, setHistorial] = useState(() => JSON.parse(localStorage.getItem('g93_historial')) || []);
  
  // Nuevas secciones independientes con persistencia
  const [stock, setStock] = useState(() => JSON.parse(localStorage.getItem('g93_stock')) || []);
  const [deudas, setDeudas] = useState(() => JSON.parse(localStorage.getItem('g93_deudas')) || []);

  useEffect(() => {
    localStorage.setItem('g93_tasa', JSON.stringify(tasaCOP));
    localStorage.setItem('g93_historial', JSON.stringify(historial));
    localStorage.setItem('g93_stock', JSON.stringify(stock));
    localStorage.setItem('g93_deudas', JSON.stringify(deudas));
  }, [tasaCOP, historial, stock, deudas]);

  // --- CONSTANTES LÓGICA COTIZACIÓN ---
  const COSTO_LIBRA = 3.10; 
  const ENVIO_CHINA_USA = 10;
  const CARGOS_FIJOS = 7;
  const PESO_PAR_LB = 1.32; 

  const COSTOS_BASE_JERSEY = { fan: 13, player: 16, retro: 17, children: 15, nba: 23 };
  const PRECIOS_VENTA_JERSEY = { fan: 125000, player: 140000, retro: 150000, children: 110000, nba: 180000 };

  // --- FORMULARIOS ESTADOS ---
  const [cajaZapatos, setCajaZapatos] = useState({ cantidadTotalCaja: 1 });
  const [newZapato, setNewZapato] = useState({ nombre: '', costoUSD: '', margen: 30 });
  const [newJersey, setNewJersey] = useState({ nombre: '', tipo: 'player', parches: 0, dorsal: false });

  // --- FUNCIONES LÓGICA ---
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
    <div className="min-h-screen bg-slate-50 p-4 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="bg-white p-5 rounded-3xl shadow-sm flex flex-wrap justify-between items-center gap-4">
          <h1 className="font-black italic text-2xl tracking-tighter text-slate-800">GOL93<span className="text-emerald-500">STORE</span></h1>
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            {['camisetas', 'zapatos', 'stock', 'deudas'].map(m => (
              <button key={m} onClick={() => setModo(m)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${modo === m ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>{m}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
            <span className="text-[9px] font-black text-emerald-600">TRM</span>
            <input type="number" value={tasaCOP} onChange={e => setTasaCOP(e.target.value)} className="bg-transparent font-bold w-20 text-right outline-none" />
          </div>
        </div>

        {/* CONTENIDO DINÁMICO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLUMNA FORMULARIOS (SOLO COTIZACIÓN) */}
          <div className="lg:col-span-4 space-y-4">
            {modo === 'camisetas' && (
              <div className="bg-white p-6 rounded-3xl border-b-4 border-indigo-500 shadow-sm space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase">Cotizador Jersey</p>
                <input type="text" placeholder="EQUIPO" className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold" value={newJersey.nombre} onChange={e => setNewJersey({...newJersey, nombre: e.target.value.toUpperCase()})} />
                <select className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold" value={newJersey.tipo} onChange={e => setNewJersey({...newJersey, tipo: e.target.value})}>
                  {Object.keys(COSTOS_BASE_JERSEY).map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="number" placeholder="Parches" className="w-1/2 p-3 bg-slate-50 rounded-xl outline-none" value={newJersey.parches} onChange={e => setNewJersey({...newJersey, parches: e.target.value})} />
                  <button onClick={() => setNewJersey({...newJersey, dorsal: !newJersey.dorsal})} className={`w-1/2 rounded-xl font-bold text-[10px] ${newJersey.dorsal ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>DORSAL (+1)</button>
                </div>
                <button onClick={agregarJersey} className="w-full bg-indigo-500 text-white p-4 rounded-xl font-black text-xs">AÑADIR A COTIZACIÓN</button>
              </div>
            )}

            {modo === 'zapatos' && (
              <div className="bg-white p-6 rounded-3xl border-b-4 border-emerald-500 shadow-sm space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase">Cotizador Guayos</p>
                <input type="number" placeholder="PARES EN CAJA" className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold" onChange={e => setCajaZapatos({cantidadTotalCaja: e.target.value})} />
                <input type="text" placeholder="REFERENCIA" className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold" value={newZapato.nombre} onChange={e => setNewZapato({...newZapato, nombre: e.target.value.toUpperCase()})} />
                <div className="flex gap-2">
                  <input type="number" placeholder="USD COSTO" className="w-1/2 p-3 bg-slate-50 rounded-xl outline-none" value={newZapato.costoUSD} onChange={e => setNewZapato({...newZapato, costoUSD: e.target.value})} />
                  <input type="number" placeholder="MARGEN %" className="w-1/2 p-3 bg-slate-50 rounded-xl outline-none" value={newZapato.margen} onChange={e => setNewZapato({...newZapato, margen: e.target.value})} />
                </div>
                <button onClick={agregarZapato} className="w-full bg-emerald-500 text-white p-4 rounded-xl font-black text-xs">AÑADIR A COTIZACIÓN</button>
              </div>
            )}
          </div>

          {/* COLUMNA PRINCIPAL / LISTADOS */}
          <div className="lg:col-span-8">
            
            {/* SECCIÓN STOCK FÍSICO (MANUAL) */}
            {modo === 'stock' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5 bg-white p-6 rounded-3xl shadow-sm border-b-4 border-slate-800 space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase italic">Registro Stock Real</p>
                  <input type="text" id="sk-nom" placeholder="Producto y Talla" className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" />
                  <select id="sk-tipo" className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm">
                    <option value="camiseta">Camiseta</option>
                    <option value="guayo">Guayo</option>
                  </select>
                  <button onClick={() => {
                    const n = document.getElementById('sk-nom').value;
                    const t = document.getElementById('sk-tipo').value;
                    if(n) { setStock([{id: Date.now(), nombre: n.toUpperCase(), tipo: t}, ...stock]); document.getElementById('sk-nom').value = ''; }
                  }} className="w-full bg-slate-900 text-white p-4 rounded-xl font-black text-xs uppercase">Ingresar a Bodega</button>
                </div>
                <div className="md:col-span-7 grid grid-cols-1 gap-3">
                  {stock.map(s => (
                    <div key={s.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                      <div>
                        <span className="text-[8px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-400 uppercase">{s.tipo}</span>
                        <p className="font-bold text-slate-800 uppercase text-sm mt-1">{s.nombre}</p>
                      </div>
                      <button onClick={() => setStock(stock.filter(i => i.id !== s.id))} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black">VENDIDO</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN DEUDAS */}
            {modo === 'deudas' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5 bg-white p-6 rounded-3xl shadow-sm border-b-4 border-red-500 space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase italic">Nuevo Pendiente</p>
                  <input type="text" id="d-cli" placeholder="Cliente" className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" />
                  <input type="number" id="d-mon" placeholder="Monto COP" className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" />
                  <input type="text" id="d-con" placeholder="Concepto" className="w-full p-3 bg-slate-50 rounded-xl outline-none text-xs" />
                  <button onClick={() => {
                    const c = document.getElementById('d-cli').value;
                    const m = document.getElementById('d-mon').value;
                    const o = document.getElementById('d-con').value;
                    if(c && m) { setDeudas([{id: Date.now(), cliente: c, monto: m, concepto: o}, ...deudas]); document.getElementById('d-cli').value = ''; document.getElementById('d-mon').value = ''; }
                  }} className="w-full bg-red-500 text-white p-4 rounded-xl font-black text-xs">REGISTRAR DEUDA</button>
                </div>
                <div className="md:col-span-7 grid grid-cols-1 gap-3">
                  {deudas.map(d => (
                    <div key={d.id} className="bg-white p-5 rounded-2xl shadow-sm border border-red-50 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black text-red-400 uppercase italic">{d.cliente}</p>
                        <p className="text-xl font-black text-slate-800 leading-none">{fmt(d.monto)}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1">{d.concepto}</p>
                      </div>
                      <button onClick={() => setDeudas(deudas.filter(i => i.id !== d.id))} className="text-red-200 text-xl font-bold">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TABLA DE COTIZACIÓN (SOLO PARA CAMISETAS/GUAYOS) */}
            {(modo === 'camisetas' || modo === 'zapatos') && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-100">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                      <tr>
                        <th className="p-4">Producto</th>
                        <th className="p-4 text-center">Venta Sugerida</th>
                        <th className="p-4 text-right">Ganancia</th>
                        <th className="p-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {items.map(item => {
                        const res = calcular(item);
                        return (
                          <tr key={item.id} className="text-sm">
                            <td className="p-4">
                              <p className="font-bold text-slate-700">{item.nombre}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase italic">{item.tipoItem}</p>
                            </td>
                            <td className="p-4 text-center">
                              <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg font-black text-[11px]">{fmt(res.venta)}</span>
                            </td>
                            <td className="p-4 text-right font-black text-emerald-500">{fmt(res.ganancia)}</td>
                            <td className="p-4 text-right"><button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-slate-300">✕</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {items.length > 0 && (
                  <button onClick={() => {
                    const totalG = items.reduce((acc, i) => acc + calcular(i).ganancia, 0);
                    setHistorial([{id: Date.now(), fecha: new Date().toLocaleString(), ganancia: totalG}, ...historial]);
                    setItems([]);
                  }} className="w-full bg-slate-900 text-white p-5 rounded-3xl font-black text-sm shadow-xl shadow-slate-200 uppercase tracking-widest">Guardar en Historial</button>
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