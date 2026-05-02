import React, { useState, useEffect } from 'react';

const App = () => {
  const [tasaCOP, setTasaCOP] = useState(() => JSON.parse(localStorage.getItem('g93_tasa')) || 3600);
  const [modo, setModo] = useState('camisetas');
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('g93_items')) || []);
  const [historial, setHistorial] = useState(() => JSON.parse(localStorage.getItem('g93_historial')) || []);
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);
  const [stock, setStock] = useState(() => JSON.parse(localStorage.getItem('g93_stock')) || []);
  const [deudas, setDeudas] = useState(() => JSON.parse(localStorage.getItem('g93_deudas')) || []);

  // Estado temporal para el formulario de stock detallado
  const [newStock, setNewStock] = useState({ referencia: '', talla: '', tipo: 'player' });

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

  const agregarZapato = () => {
    if (!newZapato.nombre || !newZapato.costoUSD) return alert("Completa los datos");
    const nTotalCaja = parseInt(cajaZapatos.cantidadTotalCaja) || 1;
    const pesoCajaTotal = nTotalCaja * PESO_PAR_LB;
    const logisticaPorParUSD = (ENVIO_CHINA_USA + CARGOS_FIJOS + (pesoCajaTotal * COSTO_LIBRA)) / nTotalCaja;

    const nuevos = Array.from({ length: parseInt(newZapato.cantidad) || 1 }, (_, i) => ({
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
    const nuevos = Array.from({ length: parseInt(newJersey.cantidad) || 1 }, (_, i) => ({
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

        {/* HEADER RESPONSIVE */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl border border-slate-800">

          {/* Logo GOL93STORE - Ahora visible sobre fondo oscuro */}
          <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white">
            Gol93<span className="text-emerald-500">Store</span>
          </h1>

          {/* Navegación Estilizada */}
          <nav className="flex flex-wrap justify-center gap-2 bg-slate-800/50 p-2 rounded-2xl border border-slate-700/50 backdrop-blur-sm w-full md:w-auto">
            {[
              { id: 'camisetas', label: 'JERSEY', emoji: '👕' },
              { id: 'zapatos', label: 'GUAYOS', emoji: '👟' },
              { id: 'stock', label: 'STOCK', emoji: '📦' },
              { id: 'deudas', label: 'DEUDAS', emoji: '💸' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setModo(btn.id)}
                className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black tracking-wider transition-all duration-300
          ${modo === btn.id
                    ? 'bg-emerald-500 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-105'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                  }
        `}
              >
                <span className="text-sm md:text-base">{btn.emoji}</span>
                {btn.label}
              </button>
            ))}
          </nav>

          {/* TRM Actual */}
          <div className="bg-slate-800/80 px-5 py-3 rounded-2xl border border-slate-700 flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto min-w-[150px]">
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-0 md:mb-1">TRM Actual</span>
            <div className="flex items-center">
              <span className="text-emerald-500 font-black mr-1">$</span>
              <input
                type="number"
                value={tasaCOP}
                onChange={(e) => setTasaCOP(parseFloat(e.target.value) || 0)}
                className="bg-transparent border-none outline-none text-xl font-black text-white w-20 md:w-24 text-right focus:text-emerald-400 transition-colors"
              />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">


          {/* TABLA Y HISTORIAL */}
          <main className="lg:col-span-8 space-y-6">
            {/* 1. SECCIÓN STOCK: Ocupa todo el ancho */}
            {modo === 'stock' && (
              <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registrar Ingreso a Bodega</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      label="Referencia"
                      placeholder="Ej: Real Madrid"
                      value={newStock.referencia}
                      onChange={v => setNewStock({ ...newStock, referencia: v })}
                    />
                    <Input
                      label="Talla"
                      placeholder="Ej: M"
                      value={newStock.talla}
                      onChange={v => setNewStock({ ...newStock, talla: v })}
                    />
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 px-1">Versión</label>
                      <select
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-3 outline-none font-bold text-sm h-[52px]"
                        value={newStock.tipo}
                        onChange={e => setNewStock({ ...newStock, tipo: e.target.value })}
                      >
                        <option value="player">PLAYER</option>
                        <option value="fan">FAN</option>
                        <option value="retro">RETRO</option>
                        <option value="guayo">GUAYO</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!newStock.referencia || !newStock.talla) return alert("Completa los datos");
                      setStock([{ id: Date.now(), ...newStock, referencia: newStock.referencia.toUpperCase(), talla: newStock.talla.toUpperCase() }, ...stock]);
                      setNewStock({ referencia: '', talla: '', tipo: 'player' });
                    }}
                    className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-[1.02] transition-all"
                  >
                    Guardar en Bodega
                  </button>
                </div>

                {/* Lista de Stock */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stock.map(s => (
                    <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm group">
                      <div>
                        <div className="flex gap-2 mb-1">
                          <span className="text-[8px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase">{s.tipo}</span>
                          <span className="text-[8px] font-black bg-indigo-50 px-2 py-0.5 rounded text-indigo-600 uppercase">Talla {s.talla}</span>
                        </div>
                        <p className="font-bold text-slate-800 text-sm uppercase">{s.referencia}</p>
                      </div>
                      <button onClick={() => setStock(stock.filter(i => i.id !== s.id))} className="text-emerald-500 font-black text-[9px] bg-emerald-50 px-4 py-2 rounded-xl">VENDIDO</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. SECCIÓN DEUDAS: Ocupa todo el ancho */}
            {modo === 'deudas' && (
              <div className="w-full space-y-4 animate-in fade-in duration-500">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input label="Cliente" placeholder="Nombre del cliente" />
                  <Input label="Monto COP" type="number" placeholder="Ej: 50000" />
                  <button className="bg-red-500 text-white rounded-2xl font-black text-xs uppercase h-[52px] mt-auto">Registrar Deuda</button>
                </div>
                {/* ... mapeo de deudas ... */}
              </div>
            )}

            {/* 3. SECCIÓN COTIZACIÓN (JERSEYS/GUAYOS): EL FORMULARIO ESTÁ AQUÍ DENTRO */}
            {(modo === 'camisetas' || modo === 'zapatos') && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in duration-500">

                {/* FORMULARIO IZQUIERDA: Al estar dentro del (modo === 'camisetas' || ...), desaparece en Stock */}
                <aside className="md:col-span-4 space-y-4">
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Añadir al Lote</p>
                    <div className="space-y-3">
                      <Input label="Referencia" placeholder="Ej: Real Madrid" />
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 px-1">Versión</label>
                        <select className="bg-slate-50 border border-slate-200 rounded-2xl p-3 font-bold text-sm h-[52px]">
                          <option>PLAYER</option>
                          <option>FAN</option>
                          <option>RETRO</option>
                        </select>
                      </div>
                    </div>
                    <button className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black text-xs uppercase shadow-lg mt-6 hover:bg-emerald-500 transition-all">
                      Añadir Producto
                    </button>
                  </div>
                </aside>

                {/* TABLA E HISTORIAL DERECHA */}
                <div className="md:col-span-8 space-y-6">
                  <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                    {/* ... Tu tabla de cotización actual ... */}
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase p-5">
                        <tr><th className="p-5">Producto</th><th className="p-5 text-center">Ganancia</th></tr>
                      </thead>
                      <tbody>
                        {items.map(item => (
                          <tr key={item.id} className="border-b border-slate-50"><td className="p-5 font-bold text-sm">{item.nombre}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* HISTORIAL */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">Historial Reciente</h3>
                    {/* ... Mapeo del historial ... */}
                  </div>
                </div>

              </div>
            )}
          </main>
        </div>
      </div>

      {/* MODAL RESPONSIVE */}
      {loteSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full max-w-2xl rounded-t-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg md:text-xl font-black uppercase italic text-slate-800 leading-tight">Detalle del Lote</h3>
                <p className="text-[10px] font-bold text-slate-400">{loteSeleccionado.fecha}</p>
              </div>
              <button onClick={() => setLoteSeleccionado(null)} className="bg-white w-10 h-10 rounded-full shadow-sm flex items-center justify-center font-black text-slate-400 text-sm">✕</button>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[450px]">
                <thead className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase border-b border-slate-50 bg-slate-50/50">
                  <tr>
                    <th className="p-4 text-left">Producto</th>
                    <th className="p-4 text-center">Costo Un.</th>
                    <th className="p-4 text-center">Venta Un.</th>
                    <th className="p-4 text-right">Ganancia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loteSeleccionado.productos.map((p, idx) => (
                    <tr key={idx} className="text-[11px] md:text-xs">
                      <td className="p-4">
                        <span className="font-bold text-slate-700 block">{p.nombre}</span>
                        <span className="text-[8px] text-slate-400 uppercase italic leading-none">{p.tipoItem === 'zapato' ? 'Guayo' : p.tipo}</span>
                      </td>
                      <td className="p-4 text-center font-medium text-slate-500">{fmt(p.costoCOP)}</td>
                      <td className="p-4 text-center font-black text-indigo-500">{fmt(p.venta)}</td>
                      <td className="p-4 text-right font-black text-emerald-500">{fmt(p.ganancia)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 md:p-8 bg-emerald-500 text-white flex justify-between items-center">
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Total Ganancia</span>
              <span className="text-xl md:text-2xl font-black">{fmt(loteSeleccionado.ganancia)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Input = ({ label, onChange, ...p }) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase mb-1">{label}</label>
    <input {...p} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-slate-700 text-sm focus:border-indigo-500" />
  </div>
);

const InputDark = ({ label, onChange, ...p }) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase mb-1">{label}</label>
    <input {...p} onChange={e => onChange(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none font-bold text-white text-sm focus:border-emerald-400" />
  </div>
);

export default App;