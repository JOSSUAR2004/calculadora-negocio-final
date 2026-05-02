import React, { useState, useEffect } from 'react';

const App = () => {
  // --- LÓGICA ORIGINAL DE COTIZACIÓN ---
  const [tasaCOP, setTasaCOP] = useState(() => JSON.parse(localStorage.getItem('g93_tasa')) || 4000);
  const [modo, setModo] = useState('camisetas'); 
  const [items, setItems] = useState([]); 
  const [historial, setHistorial] = useState(() => JSON.parse(localStorage.getItem('g93_historial')) || []);

  // --- NUEVAS SECCIONES SOLICITADAS (STOCK Y DEUDAS) ---
  const [stock, setStock] = useState(() => JSON.parse(localStorage.getItem('g93_stock')) || []);
  const [deudas, setDeudas] = useState(() => JSON.parse(localStorage.getItem('g93_deudas')) || []);

  // Persistencia de todos los datos
  useEffect(() => {
    localStorage.setItem('g93_tasa', JSON.stringify(tasaCOP));
    localStorage.setItem('g93_historial', JSON.stringify(historial));
    localStorage.setItem('g93_stock', JSON.stringify(stock));
    localStorage.setItem('g93_deudas', JSON.stringify(deudas));
  }, [tasaCOP, historial, stock, deudas]);

  // Constantes de importación (Logística China -> Colombia)
  const COSTO_LIBRA = 3.10; 
  const ENVIO_CHINA_USA = 10;
  const CARGOS_FIJOS = 7;
  const PESO_PAR_LB = 1.32; 

  const COSTOS_BASE_JERSEY = { fan: 13, player: 16, retro: 17, children: 15, nba: 23 };
  const PRECIOS_VENTA_JERSEY = { fan: 125000, player: 140000, retro: 150000, children: 110000, nba: 180000 };

  const [cajaZapatos, setCajaZapatos] = useState({ cantidadTotalCaja: 1 });
  const [newZapato, setNewZapato] = useState({ nombre: '', costoUSD: '', margen: 30 });
  const [newJersey, setNewJersey] = useState({ nombre: '', tipo: 'player', parches: 0, dorsal: false });

  // Funciones de agregado originales (Se mantienen solo como cotización)
  const agregarZapato = () => {
    if (!newZapato.nombre || !newZapato.costoUSD) return;
    const nTotal = parseInt(cajaZapatos.cantidadTotalCaja) || 1;
    const logisticaUSD = (ENVIO_CHINA_USA + CARGOS_FIJOS + (nTotal * PESO_PAR_LB * COSTO_LIBRA)) / nTotal;
    setItems([...items, { ...newZapato, id: Date.now(), logisticaUSD, tipoItem: 'zapato' }]);
    setNewZapato({ ...newZapato, nombre: '', costoUSD: '', margen: 30 });
  };

  const agregarJersey = () => {
    if (!newJersey.nombre) return;
    setItems([...items, { ...newJersey, id: Date.now(), tipoItem: 'camiseta' }]);
    setNewJersey({ ...newJersey, nombre: '', tipo: 'player', parches: 0, dorsal: false });
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
        
        {/* NAVEGACIÓN */}
        <div className="bg-white p-4 rounded-3xl shadow-sm flex flex-wrap justify-between items-center gap-4 border border-slate-200">
          <h1 className="font-black italic text-xl tracking-tighter">GOL93STORE</h1>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['camisetas', 'zapatos', 'stock', 'deudas'].map(m => (
              <button 
                key={m} 
                onClick={() => setModo(m)} 
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${modo === m ? 'bg-white shadow text-black' : 'text-slate-400'}`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
            <span className="text-[9px] font-black">TRM:</span>
            <input 
              type="number" 
              value={tasaCOP} 
              onChange={e => setTasaCOP(e.target.value)} 
              className="bg-transparent font-bold w-16 text-right outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* FORMULARIOS DE COTIZACIÓN */}
          <div className="lg:col-span-4 space-y-4">
            {modo === 'camisetas' && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase">Cotizador Camisetas</p>
                <input type="text" placeholder="EQUIPO" className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold" value={newJersey.nombre} onChange={e => setNewJersey({...newJersey, nombre: e.target.value.toUpperCase()})} />
                <select className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" value={newJersey.tipo} onChange={e => setNewJersey({...newJersey, tipo: e.target.value})}>
                  {Object.keys(COSTOS_BASE_JERSEY).map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="number" placeholder="Parches" className="w-1/2 p-3 bg-slate-50 rounded-xl outline-none font-bold" value={newJersey.parches} onChange={e => setNewJersey({...newJersey, parches: e.target.value})} />
                  <button onClick={() => setNewJersey({...newJersey, dorsal: !newJersey.dorsal})} className={`w-1/2 rounded-xl font-bold text-[10px] ${newJersey.dorsal ? 'bg-black text-white' : 'bg-slate-100 text-slate-400'}`}>DORSAL</button>
                </div>
                <button onClick={agregarJersey} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-black text-xs">AGREGAR COTIZACIÓN</button>
              </div>
            )}

            {modo === 'zapatos' && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase">Cotizador Guayos</p>
                <input type="number" placeholder="CANTIDAD EN CAJA" className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold" onChange={e => setCajaZapatos({cantidadTotalCaja: e.target.value})} />
                <input type="text" placeholder="REFERENCIA" className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold" value={newZapato.nombre} onChange={e => setNewZapato({...newZapato, nombre: e.target.value.toUpperCase()})} />
                <div className="flex gap-2">
                  <input type="number" placeholder="USD COSTO" className="w-1/2 p-3 bg-slate-50 rounded-xl outline-none font-bold" value={newZapato.costoUSD} onChange={e => setNewZapato({...newZapato, costoUSD: e.target.value})} />
                  <input type="number" placeholder="MARGEN %" className="w-1/2 p-3 bg-slate-50 rounded-xl outline-none font-bold" value={newZapato.margen} onChange={e => setNewZapato({...newZapato, margen: e.target.value})} />
                </div>
                <button onClick={agregarZapato} className="w-full bg-emerald-600 text-white p-4 rounded-xl font-black text-xs">AGREGAR COTIZACIÓN</button>
              </div>
            )}
          </div>

          {/* ÁREA DE CONTENIDO PRINCIPAL */}
          <div className="lg:col-span-8">
            
            {/* SECCIÓN STOCK FÍSICO (MANUAL E INDEPENDIENTE) */}
            {modo === 'stock' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Registro Stock Físico</p>
                  <input type="text" id="s-nom" placeholder="Producto y Talla" className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold" />
                  <button onClick={() => {
                    const n = document.getElementById('s-nom').value;
                    if(n) { setStock([{id: Date.now(), nombre: n.toUpperCase()}, ...stock]); document.getElementById('s-nom').value = ''; }
                  }} className="w-full bg-black text-white p-4 rounded-xl font-black text-xs">GUARDAR EN BODEGA</button>
                </div>
                <div className="md:col-span-7 space-y-2">
                  {stock.map(s => (
                    <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
                      <p className="font-bold text-sm uppercase">{s.nombre}</p>
                      <button onClick={() => setStock(stock.filter(i => i.id !== s.id))} className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg">VENDIDO</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN DEUDAS */}
            {modo === 'deudas' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Nuevo Pendiente</p>
                  <input type="text" id="d-cli" placeholder="Nombre Cliente" className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold" />
                  <input type="number" id="d-mon" placeholder="Monto COP" className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold" />
                  <button onClick={() => {
                    const c = document.getElementById('d-cli').value;
                    const m = document.getElementById('d-mon').value;
                    if(c && m) { setDeudas([{id: Date.now(), cliente: c, monto: m}, ...deudas]); document.getElementById('d-cli').value = ''; document.getElementById('d-mon').value = ''; }
                  }} className="w-full bg-red-600 text-white p-4 rounded-xl font-black text-xs">REGISTRAR DEUDA</button>
                </div>
                <div className="md:col-span-7 space-y-2">
                  {deudas.map(d => (
                    <div key={d.id} className="bg-white p-4 rounded-2xl border border-red-100 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black text-red-500 uppercase">{d.cliente}</p>
                        <p className="font-bold text-lg">{fmt(d.monto)}</p>
                      </div>
                      <button onClick={() => setDeudas(deudas.filter(i => i.id !== d.id))} className="text-red-300 font-bold">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LISTA DE COTIZACIÓN TEMPORAL */}
            {(modo === 'camisetas' || modo === 'zapatos') && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                      <tr>
                        <th className="p-4">Producto</th>
                        <th className="p-4">Venta Sugerida</th>
                        <th className="p-4 text-right">Ganancia</th>
                        <th className="p-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map(item => {
                        const res = calcular(item);
                        return (
                          <tr key={item.id} className="text-sm">
                            <td className="p-4 font-bold">{item.nombre} <span className="text-[9px] text-slate-300 block">{item.tipoItem}</span></td>
                            <td className="p-4 font-black">{fmt(res.venta)}</td>
                            <td className="p-4 text-right font-black text-emerald-600">{fmt(res.ganancia)}</td>
                            <td className="p-4 text-right text-slate-300 hover:text-red-500 cursor-pointer" onClick={() => setItems(items.filter(i => i.id !== item.id))}>✕</td>
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
                  }} className="w-full bg-black text-white p-4 rounded-2xl font-black text-sm uppercase tracking-widest">Guardar Lote en Historial</button>
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