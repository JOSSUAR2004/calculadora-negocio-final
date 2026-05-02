import React, { useState, useEffect } from 'react';

const App = () => {
  const [tasaCOP, setTasaCOP] = useState(() => JSON.parse(localStorage.getItem('g93_tasa')) || 3600);
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
  const [newDeuda, setNewDeuda] = useState({ cliente: '', monto: '', concepto: '' });

  const agregarZapato = () => {
    if (!newZapato.nombre || !newZapato.costoUSD) return alert("Completa los datos");
    const nTotalCaja = parseInt(cajaZapatos.cantidadTotalCaja) || 1;
    const pesoCajaTotal = nTotalCaja * PESO_PAR_LB;
    const logisticaPorParUSD = (ENVIO_CHINA_USA + CARGOS_FIJOS + (pesoCajaTotal * COSTO_LIBRA)) / nTotalCaja;

    const nuevos = Array.from({ length: parseInt(newZapato.cantidad) || 1 }, () => ({
      ...newZapato,
      id: Date.now() + Math.random(),
      costoLogisticaUSD: logisticaPorParUSD,
      tipoItem: 'zapato',
      trmRegistro: tasaCOP
    }));
    setItems([...items, ...nuevos]);
    setNewZapato({ ...newZapato, nombre: '', costoUSD: '', margen: 30, cantidad: 1 });
  };

  const agregarJersey = () => {
    if (!newJersey.nombre) return alert("Escribe el nombre del equipo");
    const nuevos = Array.from({ length: parseInt(newJersey.cantidad) || 1 }, () => ({
      ...newJersey,
      id: Date.now() + Math.random(),
      costoBaseUSD: COSTOS_BASE_JERSEY[newJersey.tipo],
      tipoItem: 'camiseta',
      trmRegistro: tasaCOP
    }));
    setItems([...items, ...nuevos]);
    setNewJersey({ ...newJersey, nombre: '', parches: 0, dorsal: false, cantidad: 1 });
  };

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

  const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100">
          <h1 className="text-xl md:text-2xl font-black italic uppercase text-slate-800">Gol93<span className="text-emerald-500">Store</span></h1>
          
          <div className="flex bg-slate-100 p-1 rounded-xl w-full lg:w-auto overflow-x-auto">
            <button onClick={() => {setModo('camisetas'); setItems([])}} className={`flex-1 px-4 py-2 rounded-lg font-black text-[10px] transition-all ${modo === 'camisetas' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>👕 JERSEY</button>
            <button onClick={() => {setModo('zapatos'); setItems([])}} className={`flex-1 px-4 py-2 rounded-lg font-black text-[10px] transition-all ${modo === 'zapatos' ? 'bg-white shadow text-emerald-600' : 'text-slate-400'}`}>👟 GUAYOS</button>
            <button onClick={() => setModo('stock')} className={`flex-1 px-4 py-2 rounded-lg font-black text-[10px] transition-all ${modo === 'stock' ? 'bg-white shadow text-orange-600' : 'text-slate-400'}`}>📦 STOCK</button>
            <button onClick={() => setModo('deudas')} className={`flex-1 px-4 py-2 rounded-lg font-black text-[10px] transition-all ${modo === 'deudas' ? 'bg-white shadow text-red-600' : 'text-slate-400'}`}>💰 DEUDAS</button>
          </div>

          <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center">
            <span className="text-[9px] font-black text-emerald-600 uppercase mr-3">TRM Actual</span>
            <input type="number" value={tasaCOP} onChange={(e) => setTasaCOP(parseFloat(e.target.value) || 0)} className="bg-transparent border-none outline-none text-lg font-black text-emerald-800 w-20 text-right" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          
          <aside className="lg:col-span-4 space-y-4">
            {modo === 'zapatos' && (
              <div className="space-y-4">
                <div className="bg-slate-900 p-5 rounded-2xl text-white border-b-4 border-emerald-500 shadow-xl">
                  <InputDark label="Pares totales caja" type="number" value={cajaZapatos.cantidadTotalCaja} onChange={v => setCajaZapatos({cantidadTotalCaja: v})} />
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-xl border border-slate-100 space-y-4">
                  <Input label="Referencia Guayo" value={newZapato.nombre} onChange={v => setNewZapato({...newZapato, nombre: v.toUpperCase()})} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Costo (USD)" type="number" value={newZapato.costoUSD} onChange={v => setNewZapato({...newZapato, costoUSD: v})} />
                    <Input label="Margen %" type="number" value={newZapato.margen} onChange={v => setNewZapato({...newZapato, margen: v})} />
                  </div>
                  <Input label="Cantidad pares" type="number" value={newZapato.cantidad} onChange={v => setNewZapato({...newZapato, cantidad: v})} />
                  <button onClick={agregarZapato} className="w-full bg-emerald-500 text-white p-4 rounded-xl font-black text-xs uppercase shadow-lg hover:bg-emerald-600 transition-colors">Añadir Guayos</button>
                </div>
              </div>
            )}

            {modo === 'camisetas' && (
              <div className="bg-white p-5 rounded-3xl shadow-xl border border-slate-100 space-y-4 border-b-4 border-indigo-500">
                <Input label="Referencia" value={newJersey.nombre} onChange={v => setNewJersey({...newJersey, nombre: v.toUpperCase()})} />
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Versión</label>
                  <select className="bg-slate-50 rounded-xl p-3 text-sm font-bold border border-slate-200 outline-none" value={newJersey.tipo} onChange={e => setNewJersey({...newJersey, tipo: e.target.value})}>
                    {Object.keys(COSTOS_BASE_JERSEY).map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3 items-end">
                  <Input label="Parches" type="number" value={newJersey.parches} onChange={v => setNewJersey({...newJersey, parches: v})} />
                  <button onClick={() => setNewJersey({...newJersey, dorsal: !newJersey.dorsal})} className={`p-3 rounded-xl border text-[9px] font-black h-[46px] transition-all ${newJersey.dorsal ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}>
                    {newJersey.dorsal ? 'CON DORSAL' : 'SIN DORSAL'}
                  </button>
                </div>
                <Input label="Unidades" type="number" value={newJersey.cantidad} onChange={v => setNewJersey({...newJersey, cantidad: v})} />
                <button onClick={agregarJersey} className="w-full bg-indigo-500 text-white p-4 rounded-xl font-black text-xs uppercase shadow-lg">Añadir Jersey</button>
              </div>
            )}

            {modo === 'deudas' && (
              <div className="bg-white p-5 rounded-3xl shadow-xl border border-slate-100 space-y-4 border-b-4 border-red-500">
                <Input label="Nombre Cliente" value={newDeuda.cliente} onChange={v => setNewDeuda({...newDeuda, cliente: v})} />
                <Input label="Monto COP" type="number" value={newDeuda.monto} onChange={v => setNewDeuda({...newDeuda, monto: v})} />
                <Input label="Concepto" value={newDeuda.concepto} onChange={v => setNewDeuda({...newDeuda, concepto: v})} />
                <button onClick={() => {
                  setDeudas([...deudas, {...newDeuda, id: Date.now()}]);
                  setNewDeuda({cliente:'', monto:'', concepto:''});
                }} className="w-full bg-red-500 text-white p-4 rounded-xl font-black text-xs uppercase">Registrar Deuda</button>
              </div>
            )}
          </aside>

          <main className="lg:col-span-8 space-y-6">
            {(modo === 'camisetas' || modo === 'zapatos') && (
              <>
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                      <tr>
                        <th className="p-4">Producto</th>
                        <th className="p-4 text-center text-emerald-500">Ganancia</th>
                        <th className="p-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {items.map(item => {
                        const { ganancia } = calcularValores(item, tasaCOP);
                        return (
                          <tr key={item.id}>
                            <td className="p-4">
                              <p className="font-bold text-slate-800 text-sm">{item.nombre}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase italic">
                                {item.tipoItem === 'zapato' ? `Guayo (+ $${item.costoLogisticaUSD.toFixed(2)})` : item.tipo}
                              </p>
                            </td>
                            <td className="p-4 text-center font-black text-emerald-500">{fmt(ganancia)}</td>
                            <td className="p-4 text-right"><button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500">✕</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {items.length > 0 && (
                  <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex justify-between items-center shadow-2xl border-b-4 border-emerald-500">
                    <div>
                      <p className="text-slate-400 text-[10px] font-black uppercase mb-1">Ganancia Total Lote</p>
                      <h2 className="text-4xl font-black text-emerald-400">{fmt(items.reduce((acc, i) => acc + calcularValores(i, tasaCOP).ganancia, 0))}</h2>
                    </div>
                    <button onClick={() => {
                        const finalItems = items.map(i => ({...i, ...calcularValores(i, tasaCOP)}));
                        setHistorial([{id: Date.now(), fecha: new Date().toLocaleString(), ganancia: finalItems.reduce((a,b)=>a+b.ganancia,0), und: items.length, tipo: modo, productos: finalItems, trm: tasaCOP}, ...historial]);
                        setItems([]);
                    }} className="bg-emerald-500 hover:bg-emerald-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase">Guardar Registro</button>
                  </div>
                )}
              </>
            )}

            {modo === 'deudas' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deudas.map(d => (
                  <div key={d.id} className="bg-white p-5 rounded-3xl border border-red-100 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-[10px] font-black text-red-400 uppercase">{d.cliente}</p>
                      <p className="text-lg font-black text-slate-800">{fmt(d.monto)}</p>
                      <p className="text-[9px] font-bold text-slate-400">{d.concepto}</p>
                    </div>
                    <button onClick={() => setDeudas(deudas.filter(i => i.id !== d.id))} className="bg-red-50 text-red-500 w-10 h-10 rounded-full flex items-center justify-center">✕</button>
                  </div>
                ))}
              </div>
            )}
            
            {/* HISTORIAL GENERAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
              {historial.map(h => (
                <div key={h.id} className="bg-white p-5 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                  <div className="cursor-pointer flex-1" onClick={() => setLoteSeleccionado(h)}>
                    <p className="text-[10px] font-black text-slate-700">{h.fecha}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase leading-tight">{h.tipo} • {h.und} Und • <span className="text-indigo-500 font-black italic">VER DETALLE</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-black text-emerald-500">{fmt(h.ganancia)}</p>
                    <button onClick={() => setHistorial(historial.filter(item => item.id !== h.id))} className="text-slate-200 hover:text-red-500">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>

      {/* MODAL DE DETALLE */}
      {loteSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase italic text-slate-800">Detalle del Lote</h3>
                <p className="text-[10px] font-bold text-slate-400">{loteSeleccionado.fecha}</p>
              </div>
              <button onClick={() => setLoteSeleccionado(null)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center font-black">✕</button>
            </div>
            <div className="overflow-y-auto p-4">
              <table className="w-full">
                <thead className="text-[9px] font-black text-slate-400 uppercase bg-slate-50">
                  <tr>
                    <th className="p-4 text-left">Producto</th>
                    <th className="p-4 text-center">Costo</th>
                    <th className="p-4 text-right">Ganancia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loteSeleccionado.productos.map((p, idx) => (
                    <tr key={idx} className="text-xs">
                      <td className="p-4">
                        <span className="font-bold text-slate-700 block">{p.nombre}</span>
                        <span className="text-[8px] text-slate-400 uppercase">{p.tipoItem === 'zapato' ? 'Guayo' : p.tipo}</span>
                      </td>
                      <td className="p-4 text-center text-slate-500">{fmt(p.costoCOP)}</td>
                      <td className="p-4 text-right font-black text-emerald-500">{fmt(p.ganancia)}</td>
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
    <label className="text-[10px] font-black text-slate-400 uppercase mb-1">{label}</label>
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