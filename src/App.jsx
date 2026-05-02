import React, { useState, useEffect } from 'react';

const App = () => {
  // Estados Globales
  const [tasaCOP, setTasaCOP] = useState(() => JSON.parse(localStorage.getItem('g93_tasa')) || 3600);
  const [modo, setModo] = useState('camisetas'); 
  const [items, setItems] = useState([]);
  const [historial, setHistorial] = useState(() => JSON.parse(localStorage.getItem('g93_historial')) || []);
  const [deudas, setDeudas] = useState(() => JSON.parse(localStorage.getItem('g93_deudas')) || []);
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);

  // Persistencia básica
  useEffect(() => {
    localStorage.setItem('g93_tasa', JSON.stringify(tasaCOP));
    localStorage.setItem('g93_historial', JSON.stringify(historial));
    localStorage.setItem('g93_deudas', JSON.stringify(deudas));
  }, [tasaCOP, historial, deudas]);

  // Constantes de Logística para Zapatos
  const COSTO_LIBRA = 3.10; 
  const ENVIO_CHINA_USA = 10;
  const CARGOS_FIJOS = 7;
  const PESO_PAR_LB = 1.32; 

  // Precios y Costos de Camisetas
  const COSTOS_BASE_JERSEY = { fan: 13, player: 16, retro: 17, children: 15, nba: 23 };
  const PRECIOS_VENTA_JERSEY = { fan: 125000, player: 140000, retro: 150000, children: 110000, nba: 180000 };

  // Estados de Formulario
  const [cajaZapatos, setCajaZapatos] = useState({ cantidadTotalCaja: 1 });
  const [newZapato, setNewZapato] = useState({ nombre: '', costoUSD: '', margen: 20, cantidad: 1 });
  const [newJersey, setNewJersey] = useState({ nombre: '', tipo: 'player', parches: 0, dorsal: false, cantidad: 1 });
  const [newDeuda, setNewDeuda] = useState({ cliente: '', monto: '', concepto: '' });

  // Lógica de Agregado
  const agregarZapato = () => {
    if (!newZapato.nombre || !newZapato.costoUSD) return;
    const nTotal = parseInt(cajaZapatos.cantidadTotalCaja) || 1;
    const logisticaUSD = (ENVIO_CHINA_USA + CARGOS_FIJOS + (nTotal * PESO_PAR_LB * COSTO_LIBRA)) / nTotal;

    const nuevo = {
      ...newZapato,
      id: Date.now(),
      logisticaUSD,
      tipoItem: 'zapato'
    };
    setItems([...items, nuevo]);
    setNewZapato({ ...newZapato, nombre: '', costoUSD: '' });
  };

  const agregarJersey = () => {
    if (!newJersey.nombre) return;
    const nuevo = {
      ...newJersey,
      id: Date.now(),
      tipoItem: 'camiseta'
    };
    setItems([...items, nuevo]);
    setNewJersey({ ...newJersey, nombre: '', parches: 0, dorsal: false });
  };

  // Función de Cálculo Unificada
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
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Cabecera y Selector */}
        <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-wrap justify-between items-center gap-4">
          <h1 className="font-black italic text-xl">GOL93STORE</h1>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['camisetas', 'zapatos', 'deudas'].map(m => (
              <button key={m} onClick={() => {setModo(m); setItems([])}} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase ${modo === m ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>{m}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-lg">
            <span className="text-[9px] font-bold text-emerald-600">TRM</span>
            <input type="number" value={tasaCOP} onChange={e => setTasaCOP(e.target.value)} className="bg-transparent font-bold w-16 text-right outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Formularios */}
          <div className="space-y-4">
            {modo === 'zapatos' && (
              <div className="bg-white p-6 rounded-3xl border-b-4 border-emerald-500 shadow-sm space-y-4">
                <input type="number" placeholder="Pares en la caja" className="w-full p-3 bg-slate-50 rounded-xl outline-none" onChange={e => setCajaZapatos({cantidadTotalCaja: e.target.value})} />
                <input type="text" placeholder="Referencia" className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={newZapato.nombre} onChange={e => setNewZapato({...newZapato, nombre: e.target.value.toUpperCase()})} />
                <div className="flex gap-2">
                  <input type="number" placeholder="USD" className="w-1/2 p-3 bg-slate-50 rounded-xl outline-none" value={newZapato.costoUSD} onChange={e => setNewZapato({...newZapato, costoUSD: e.target.value})} />
                  <input type="number" placeholder="Margen %" className="w-1/2 p-3 bg-slate-50 rounded-xl outline-none" value={newZapato.margen} onChange={e => setNewZapato({...newZapato, margen: e.target.value})} />
                </div>
                <button onClick={agregarZapato} className="w-full bg-emerald-500 text-white p-4 rounded-xl font-bold">Añadir Guayo</button>
              </div>
            )}

            {modo === 'camisetas' && (
              <div className="bg-white p-6 rounded-3xl border-b-4 border-indigo-500 shadow-sm space-y-4">
                <input type="text" placeholder="Equipo/Jersey" className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={newJersey.nombre} onChange={e => setNewJersey({...newJersey, nombre: e.target.value.toUpperCase()})} />
                <select className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={newJersey.tipo} onChange={e => setNewJersey({...newJersey, tipo: e.target.value})}>
                  {Object.keys(COSTOS_BASE_JERSEY).map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="number" placeholder="Parches" className="w-1/2 p-3 bg-slate-50 rounded-xl outline-none" value={newJersey.parches} onChange={e => setNewJersey({...newJersey, parches: e.target.value})} />
                  <button onClick={() => setNewJersey({...newJersey, dorsal: !newJersey.dorsal})} className={`w-1/2 rounded-xl font-bold text-[10px] ${newJersey.dorsal ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>DORSAL</button>
                </div>
                <button onClick={agregarJersey} className="w-full bg-indigo-500 text-white p-4 rounded-xl font-bold">Añadir Jersey</button>
              </div>
            )}
          </div>

          {/* Lista de Items Actuales */}
          <div className="space-y-4">
            {items.map(item => {
              const res = calcular(item);
              return (
                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center border border-slate-100">
                  <div>
                    <p className="font-bold text-sm">{item.nombre}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{item.tipoItem}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-500">{fmt(res.ganancia)}</p>
                    <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-[10px] text-red-300">Quitar</button>
                  </div>
                </div>
              );
            })}

            {items.length > 0 && (
              <button 
                onClick={() => {
                  const totalG = items.reduce((acc, i) => acc + calcular(i).ganancia, 0);
                  setHistorial([{ id: Date.now(), fecha: new Date().toLocaleString(), ganancia: totalG, productos: items }, ...historial]);
                  setItems([]);
                }}
                className="w-full bg-slate-900 text-white p-5 rounded-2xl font-bold shadow-xl"
              >
                Guardar Lote ({fmt(items.reduce((acc, i) => acc + calcular(i).ganancia, 0))})
              </button>
            )}
          </div>
        </div>

        {/* Historial */}
        <div className="pt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {historial.map(h => (
            <div key={h.id} onClick={() => setLoteSeleccionado(h)} className="bg-white p-4 rounded-2xl border border-slate-200 cursor-pointer hover:border-indigo-400 transition-all">
              <p className="text-[9px] font-bold text-slate-400 uppercase">{h.fecha}</p>
              <p className="font-black text-slate-700">{fmt(h.ganancia)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;