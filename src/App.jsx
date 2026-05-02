import React, { useState, useEffect } from 'react';

const App = () => {
  const [tasaCOP, setTasaCOP] = useState(() => JSON.parse(localStorage.getItem('g93_tasa')) || 3800);
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

  const COSTO_LIBRA = 3.10; 
  const ENVIO_CHINA_USA = 10;
  const CARGOS_FIJOS = 7;
  const PESO_PAR_LB = 1.32; 

  const COSTOS_BASE_JERSEY = { fan: 13, player: 16, retro: 17, children: 15, nba: 23 };
  const PRECIOS_VENTA_JERSEY = { fan: 125000, player: 140000, retro: 150000, children: 110000, nba: 180000 };

  const [cajaZapatos, setCajaZapatos] = useState({ cantidadTotalCaja: 1 });
  const [newZapato, setNewZapato] = useState({ nombre: '', costoUSD: '', margen: 30, cantidad: 1 });
  const [newJersey, setNewJersey] = useState({ nombre: '', tipo: 'player', parches: 0, dorsal: false, cantidad: 1 });

  const agregarZapato = () => {
    if (!newZapato.nombre || !newZapato.costoUSD) return;
    const nTotal = parseInt(cajaZapatos.cantidadTotalCaja) || 1;
    const logisticaUSD = (ENVIO_CHINA_USA + CARGOS_FIJOS + (nTotal * PESO_PAR_LB * COSTO_LIBRA)) / nTotal;

    const nuevos = Array.from({ length: parseInt(newZapato.cantidad) || 1 }, () => ({
      ...newZapato,
      id: Date.now() + Math.random(),
      logisticaUSD,
      tipoItem: 'zapato'
    }));
    setItems([...items, ...nuevos]);
    setNewZapato({ ...newZapato, nombre: '', costoUSD: '' });
  };

  const agregarJersey = () => {
    if (!newJersey.nombre) return;
    const nuevos = Array.from({ length: parseInt(newJersey.cantidad) || 1 }, () => ({
      ...newJersey,
      id: Date.now() + Math.random(),
      tipoItem: 'camiseta'
    }));
    setItems([...items, ...nuevos]);
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
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Nav Principal */}
        <div className="bg-white p-4 rounded-3xl shadow-sm flex flex-wrap justify-between items-center gap-4 border border-slate-100">
          <h1 className="font-black italic text-xl tracking-tighter">GOL93<span className="text-emerald-500">STORE</span></h1>
          <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto">
            {['camisetas', 'zapatos', 'stock', 'deudas'].map(m => (
              <button key={m} onClick={() => {setModo(m); if(m!=='stock' && m!=='deudas') setItems([])}} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${modo === m ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>{m}</button>
            ))}
          </div>
          <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-3">
            <span className="text-[9px] font-black text-emerald-600 uppercase">TRM</span>
            <input type="number" value={tasaCOP} onChange={e => setTasaCOP(e.target.value)} className="bg-transparent font-black w-20 text-right outline-none text-emerald-900" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Formulario */}
          <div className="lg:col-span-4 space-y-4">
            {(modo === 'zapatos' || modo === 'camisetas') && (
              <div className={`bg-white p-6 rounded-[2.5rem] shadow-xl border-b-8 ${modo === 'zapatos' ? 'border-emerald-500' : 'border-indigo-500'} space-y-4`}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Registro de Nuevo Pedido</p>
                
                {modo === 'zapatos' ? (
                  <>
                    <Input label="Pares en esta caja" type="number" onChange={v => setCajaZapatos({cantidadTotalCaja: v})} />
                    <Input label="Referencia Guayo" value={newZapato.nombre} onChange={v => setNewZapato({...newZapato, nombre: v.toUpperCase()})} />
                    <div className="flex gap-2">
                      <Input label="USD Costo" type="number" value={newZapato.costoUSD} onChange={v => setNewZapato({...newZapato, costoUSD: v})} />
                      <Input label="Margen %" type="number" value={newZapato.margen} onChange={v => setNewZapato({...newZapato, margen: v})} />
                    </div>
                    <Input label="Cantidad" type="number" value={newZapato.cantidad} onChange={v => setNewZapato({...newZapato, cantidad: v})} />
                    <button onClick={agregarZapato} className="w-full bg-emerald-500 text-white p-4 rounded-2xl font-black shadow-lg shadow-emerald-200">AÑADIR AL LOTE</button>
                  </>
                ) : (
                  <>
                    <Input label="Equipo / Referencia" value={newJersey.nombre} onChange={v => setNewJersey({...newJersey, nombre: v.toUpperCase()})} />
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Versión</label>
                      <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm border border-slate-100" value={newJersey.tipo} onChange={e => setNewJersey({...newJersey, tipo: e.target.value})}>
                        {Object.keys(COSTOS_BASE_JERSEY).map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Input label="Parches" type="number" value={newJersey.parches} onChange={v => setNewJersey({...newJersey, parches: v})} />
                      <button onClick={() => setNewJersey({...newJersey, dorsal: !newJersey.dorsal})} className={`mt-5 flex-1 rounded-2xl font-black text-[10px] border-2 transition-all ${newJersey.dorsal ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-300'}`}>DORSAL</button>
                    </div>
                    <Input label="Cantidad" type="number" value={newJersey.cantidad} onChange={v => setNewJersey({...newJersey, cantidad: v})} />
                    <button onClick={agregarJersey} className="w-full bg-indigo-500 text-white p-4 rounded-2xl font-black shadow-lg shadow-indigo-200">AÑADIR AL LOTE</button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Columna Derecha: Lote Actual / Stock */}
          <div className="lg:col-span-8 space-y-4">
            {modo === 'stock' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stock.map(s => (
                  <div key={s.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center group">
                    <div>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${s.tipoItem === 'zapato' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'} uppercase`}>{s.tipoItem}</span>
                      <p className="font-black text-slate-800 mt-1">{s.nombre}</p>
                      <p className="text-[10px] font-bold text-slate-400">P. Venta: <span className="text-slate-600">{fmt(calcular(s).venta)}</span></p>
                    </div>
                    <button onClick={() => setStock(stock.filter(i => i.id !== s.id))} className="bg-slate-50 text-slate-300 w-10 h-10 rounded-full font-black hover:bg-red-50 hover:text-red-500 transition-all">✕</button>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50/50">
                      <tr className="text-[9px] font-black text-slate-400 uppercase italic">
                        <th className="p-5 text-left">Producto</th>
                        <th className="p-5 text-center">Precio Sugerido</th>
                        <th className="p-5 text-right">Ganancia</th>
                        <th className="p-5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {items.map(item => {
                        const res = calcular(item);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-5">
                              <p className="font-black text-slate-800 text-sm leading-none">{item.nombre}</p>
                              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{item.tipoItem === 'zapato' ? 'Guayo' : item.tipo}</p>
                            </td>
                            <td className="p-5 text-center">
                                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black text-[10px]">{fmt(res.venta)}</span>
                            </td>
                            <td className="p-5 text-right font-black text-emerald-500">{fmt(res.ganancia)}</td>
                            <td className="p-5 text-right">
                              <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-slate-200 hover:text-red-400">✕</button>
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
                      <p className="text-slate-500 text-[10px] font-black uppercase">Ganancia Estimada Lote</p>
                      <h2 className="text-4xl font-black text-emerald-400">{fmt(items.reduce((acc, i) => acc + calcular(i).ganancia, 0))}</h2>
                    </div>
                    <button 
                      onClick={() => {
                        const totalG = items.reduce((acc, i) => acc + calcular(i).ganancia, 0);
                        setHistorial([{ id: Date.now(), fecha: new Date().toLocaleString(), ganancia: totalG, und: items.length }, ...historial]);
                        setStock([...stock, ...items]);
                        setItems([]);
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                    >
                      FINALIZAR E INGRESAR A STOCK
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, onChange, ...p }) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">{label}</label>
    <input {...p} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none font-bold text-slate-700 text-sm focus:border-indigo-500 focus:bg-white transition-all" />
  </div>
);

export default App;