import React, { useState, useEffect } from 'react';

const App = () => {
  const [tasaCOP, setTasaCOP] = useState(() => JSON.parse(localStorage.getItem('g93_tasa')) || 3600);
  const [modo, setModo] = useState('camisetas'); 
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('g93_items')) || []);
  const [historial, setHistorial] = useState(() => JSON.parse(localStorage.getItem('g93_historial')) || []);
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);
  const [stock, setStock] = useState(() => JSON.parse(localStorage.getItem('g93_stock')) || []);
  const [deudas, setDeudas] = useState(() => JSON.parse(localStorage.getItem('g93_deudas')) || []);

  useEffect(() => {
    localStorage.setItem('g93_tasa', JSON.stringify(tasaCOP));
    localStorage.setItem('g93_items', JSON.stringify(items));
    localStorage.setItem('g93_historial', JSON.stringify(historial));
    localStorage.setItem('g93_stock', JSON.stringify(stock));
    localStorage.setItem('g93_deudas', JSON.stringify(deudas));
  }, [tasaCOP, items, historial, stock, deudas]);

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

  const [cajaZapatos, setCajaZapatos] = useState({ cantidadTotalCaja: 1 });
  const [newZapato, setNewZapato] = useState({ nombre: '', costoUSD: '', margen: 20, cantidad: 1 });
  const [newJersey, setNewJersey] = useState({ nombre: '', tipo: 'player', parches: 0, dorsal: false, cantidad: 1 });

  const calcularValores = (item, trm) => {
    if (item.tipoItem === 'zapato') {
      const costoTotalUSD = parseFloat(item.costoUSD) + item.costoLogisticaUSD;
      const costoCOP = costoTotalUSD * trm;
      const venta = costoCOP / (1 - (item.margen / 100));
      return { costoCOP, venta, ganancia: venta - costoCOP };
    } else {
      const costoExtrasUSD = (item.dorsal ? 1 : 0) + (parseInt(item.parches) || 0);
      const costoTotalUSD = item.costoBaseUSD + costoExtrasUSD;
      const costoCOP = costoTotalUSD * trm;
      const venta = PRECIOS_VENTA_JERSEY[item.tipo];
      return { costoCOP, venta, ganancia: venta - costoCOP };
    }
  };

  const agregarZapato = () => {
    if (!newZapato.nombre || !newZapato.costoUSD) return alert("Completa los datos");
    const nTotalCaja = parseInt(cajaZapatos.cantidadTotalCaja) || 1;
    const pesoCajaTotal = nTotalCaja * PESO_PAR_LB;
    const logisticaPorParUSD = (ENVIO_CHINA_USA + CARGOS_FIJOS + (pesoCajaTotal * COSTO_LIBRA)) / nTotalCaja;
    const nuevos = Array.from({ length: parseInt(newZapato.cantidad) || 1 }, () => ({
      ...newZapato, id: Date.now() + Math.random(), costoLogisticaUSD: logisticaPorParUSD, tipoItem: 'zapato', trmRegistro: tasaCOP
    }));
    setItems([...items, ...nuevos]);
    setNewZapato({ ...newZapato, nombre: '', costoUSD: '', margen: 30, cantidad: 1 });
  };

  const agregarJersey = () => {
    if (!newJersey.nombre) return alert("Escribe el nombre del equipo");
    const nuevos = Array.from({ length: parseInt(newJersey.cantidad) || 1 }, () => ({
      ...newJersey, id: Date.now() + Math.random(), costoBaseUSD: COSTOS_BASE_JERSEY[newJersey.tipo], tipoItem: 'camiseta', trmRegistro: tasaCOP
    }));
    setItems([...items, ...nuevos]);
    setNewJersey({ ...newJersey, nombre: '', parches: 0, dorsal: false, cantidad: 1 });
  };

  const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <h1 className="text-xl font-black italic uppercase text-slate-800">Gol93<span className="text-emerald-500">Store</span></h1>
          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
            <button onClick={() => setModo('camisetas')} className={`px-4 py-2 rounded-lg font-black text-[10px] transition-all ${modo === 'camisetas' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>👕 JERSEY</button>
            <button onClick={() => setModo('zapatos')} className={`px-4 py-2 rounded-lg font-black text-[10px] transition-all ${modo === 'zapatos' ? 'bg-white shadow text-emerald-600' : 'text-slate-400'}`}>👟 GUAYOS</button>
            <button onClick={() => setModo('stock')} className={`px-4 py-2 rounded-lg font-black text-[10px] transition-all ${modo === 'stock' ? 'bg-white shadow text-orange-600' : 'text-slate-400'}`}>📦 STOCK</button>
            <button onClick={() => setModo('deudas')} className={`px-4 py-2 rounded-lg font-black text-[10px] transition-all ${modo === 'deudas' ? 'bg-white shadow text-red-600' : 'text-slate-400'}`}>💸 DEUDAS</button>
          </div>
          <div className="bg-emerald-50 px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="text-[9px] font-black text-emerald-600 uppercase">TRM</span>
            <input type="number" value={tasaCOP} onChange={(e) => setTasaCOP(parseFloat(e.target.value) || 0)} className="bg-transparent border-none outline-none font-black text-emerald-800 w-16 text-right" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-4">
            {/* ... Formularios (Igual que el anterior) ... */}
            {modo === 'zapatos' && (
              <div className="space-y-4">
                <div className="bg-slate-900 p-5 rounded-2xl text-white border-b-4 border-emerald-500 shadow-xl">
                  <InputDark label="Pares totales caja" type="number" value={cajaZapatos.cantidadTotalCaja} onChange={v => setCajaZapatos({cantidadTotalCaja: v})} />
                </div>
                <div className="bg-white p-5 rounded-[1.5rem] shadow-xl border border-slate-100 space-y-4">
                  <Input label="Referencia Guayo" value={newZapato.nombre} onChange={v => setNewZapato({...newZapato, nombre: v})} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Costo (USD)" type="number" value={newZapato.costoUSD} onChange={v => setNewZapato({...newZapato, costoUSD: v})} />
                    <Input label="Margen %" type="number" value={newZapato.margen} onChange={v => setNewZapato({...newZapato, margen: v})} />
                  </div>
                  <Input label="Cantidad pares" type="number" value={newZapato.cantidad} onChange={v => setNewZapato({...newZapato, cantidad: v})} />
                  <button onClick={agregarZapato} className="w-full bg-emerald-500 text-white p-4 rounded-xl font-black text-xs uppercase shadow-lg">Añadir Guayos</button>
                </div>
              </div>
            )}
            {modo === 'camisetas' && (
              <div className="bg-white p-5 rounded-[1.5rem] shadow-xl border border-slate-100 space-y-4 border-b-4 border-indigo-500">
                <Input label="Referencia" value={newJersey.nombre} onChange={v => setNewJersey({...newJersey, nombre: v})} />
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Versión</label>
                  <select className="bg-slate-50 rounded-xl p-3 text-sm font-bold border border-slate-200 outline-none" value={newJersey.tipo} onChange={e => setNewJersey({...newJersey, tipo: e.target.value})}>
                    {Object.keys(COSTOS_BASE_JERSEY).map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3 items-end">
                  <Input label="Parches" type="number" value={newJersey.parches} onChange={v => setNewJersey({...newJersey, parches: v})} />
                  <button onClick={() => setNewJersey({...newJersey, dorsal: !newJersey.dorsal})} className={`p-3 rounded-xl border text-[9px] font-black h-[46px] transition-all ${newJersey.dorsal ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}>
                    {newJersey.dorsal ? 'DORSAL' : 'NO DORSAL'}
                  </button>
                </div>
                <Input label="Unidades" type="number" value={newJersey.cantidad} onChange={v => setNewJersey({...newJersey, cantidad: v})} />
                <button onClick={agregarJersey} className="w-full bg-indigo-500 text-white p-4 rounded-xl font-black text-xs uppercase shadow-lg">Añadir Jersey</button>
              </div>
            )}
            {/* ... Resto de formularios (Stock/Deudas) ... */}
          </aside>

          <main className="lg:col-span-8 space-y-6">
            {(modo === 'camisetas' || modo === 'zapatos') && (
              <>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase">
                      <tr><th className="p-4">Producto</th><th className="p-4 text-center">Ganancia</th><th className="p-4"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {items.map(item => {
                        const { ganancia } = calcularValores(item, tasaCOP);
                        return (
                          <tr key={item.id}>
                            <td className="p-4 font-bold text-xs uppercase">{item.nombre}</td>
                            <td className="p-4 text-center font-black text-emerald-500 text-xs">+{fmt(ganancia)}</td>
                            <td className="p-4 text-right"><button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500">✕</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {items.length > 0 && (
                  <div className="bg-slate-900 p-6 rounded-3xl text-white flex justify-between items-center shadow-xl border-b-4 border-emerald-500">
                    <div>
                      <p className="text-slate-400 text-[10px] font-black uppercase">Ganancia Lote</p>
                      <h2 className="text-2xl font-black text-emerald-400">{fmt(items.reduce((acc, i) => acc + calcularValores(i, tasaCOP).ganancia, 0))}</h2>
                    </div>
                    <button onClick={() => {
                      const totalG = items.reduce((acc, i) => acc + calcularValores(i, tasaCOP).ganancia, 0);
                      const nuevoLote = {
                        id: Date.now(),
                        fecha: new Date().toLocaleString(),
                        ganancia: totalG,
                        und: items.length,
                        tipo: modo,
                        productos: items.map(i => ({...i, ...calcularValores(i, tasaCOP)}))
                      };
                      setHistorial([nuevoLote, ...historial]);
                      setItems([]);
                    }} className="bg-emerald-500 px-6 py-3 rounded-xl font-black text-[10px] uppercase">Guardar Lote</button>
                  </div>
                )}

                {/* --- SECCIÓN DE HISTORIAL (RESTABLECIDA) --- */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Historial de Lotes</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {historial.map(h => (
                      <div key={h.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                        <div className="cursor-pointer" onClick={() => setLoteSeleccionado(h)}>
                          <p className="text-[9px] font-black text-slate-700">{h.fecha}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">{h.tipo} • {h.und} Und</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-xs font-black text-emerald-500">{fmt(h.ganancia)}</p>
                          <button onClick={() => setHistorial(historial.filter(item => item.id !== h.id))} className="text-slate-200 hover:text-red-500">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ... Render de Stock y Deudas ... */}
            {modo === 'stock' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {stock.map(s => (
                  <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-black text-slate-800 text-sm uppercase">{s.referencia}</p>
                      <span className="text-[10px] font-bold text-orange-500 uppercase">Talla {s.talla}</span>
                    </div>
                    <button onClick={() => setStock(stock.filter(i => i.id !== s.id))} className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg">VENDIDO</button>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MODAL DETALLE (Mismo del anterior) */}
      {loteSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-lg font-black uppercase italic">Detalle del Lote</h3>
              <button onClick={() => setLoteSeleccionado(null)} className="font-black text-slate-400">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <table className="w-full">
                <tbody className="divide-y">
                  {loteSeleccionado.productos.map((p, idx) => (
                    <tr key={idx} className="text-xs">
                      <td className="p-3 font-bold uppercase">{p.nombre}</td>
                      <td className="p-3 text-right font-black text-emerald-500">{fmt(p.ganancia)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Input = ({ label, onChange, ...p }) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-[10px] font-black text-slate-400 uppercase px-1">{label}</label>
    <input {...p} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-slate-700 text-sm focus:border-indigo-500" />
  </div>
);

const InputDark = ({ label, onChange, ...p }) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-[10px] font-black text-slate-500 uppercase mb-1">{label}</label>
    <input {...p} onChange={e => onChange(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none font-bold text-white text-sm focus:border-emerald-400" />
  </div>
);

export default App;