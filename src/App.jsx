import React, { useState, useEffect } from 'react';

const App = () => {
  // --- ESTADOS GLOBALES Y PERSISTENCIA ---
  const [seccion, setSeccion] = useState('calculadora');
  const [tasaCOP, setTasaCOP] = useState(() => JSON.parse(localStorage.getItem('o90_tasa')) || 4000);
  const [itemsCalculadora, setItemsCalculadora] = useState([]);
  const [stock, setStock] = useState(() => JSON.parse(localStorage.getItem('o90_stock')) || []);
  const [deudas, setDeudas] = useState(() => JSON.parse(localStorage.getItem('o90_deudas')) || []);

  useEffect(() => {
    localStorage.setItem('o90_tasa', JSON.stringify(tasaCOP));
    localStorage.setItem('o90_stock', JSON.stringify(stock));
    localStorage.setItem('o90_deudas', JSON.stringify(deudas));
  }, [tasaCOP, stock, deudas]);

  // --- LÓGICA CALCULADORA ---
  const COSTO_LIBRA = 3.10;
  const ENVIO_CHINA_USA = 10;
  const CARGOS_FIJOS = 7;
  const PESO_PAR_LB = 1.32;

  const [newZapato, setNewZapato] = useState({ nombre: '', costoUSD: '', margen: 30 });

  const agregarZapatoCalculadora = () => {
    if (!newZapato.nombre || !newZapato.costoUSD) return;
    const logistica = (ENVIO_CHINA_USA + CARGOS_FIJOS + (1 * PESO_PAR_LB * COSTO_LIBRA));
    const costoTotalUSD = parseFloat(newZapato.costoUSD) + logistica;
    const costoCOP = costoTotalUSD * tasaCOP;
    const venta = costoCOP / (1 - (newZapato.margen / 100));

    setItemsCalculadora([...itemsCalculadora, { ...newZapato, id: Date.now(), costoCOP, venta, ganancia: venta - costoCOP }]);
    setNewZapato({ nombre: '', costoUSD: '', margen: 30 });
  };

  // --- LÓGICA STOCK (CON EDICIÓN) ---
  const [newStock, setNewStock] = useState({ referencia: '', talla: 'M', tipo: 'FAN', cantidad: 1 });
  const [editandoStockId, setEditandoStockId] = useState(null);

  const guardarStock = () => {
    if (!newStock.referencia) return alert("Escribe la referencia");
    if (editandoStockId) {
      setStock(stock.map(item => item.id === editandoStockId ? { ...newStock, id: editandoStockId } : item));
      setEditandoStockId(null);
    } else {
      setStock([...stock, { ...newStock, id: Date.now() }]);
    }
    setNewStock({ referencia: '', talla: 'M', tipo: 'FAN', cantidad: 1 });
  };

  const prepararEdicionStock = (item) => {
    setNewStock({ ...item });
    setEditandoStockId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- LÓGICA DEUDAS ---
  const [newDeuda, setNewDeuda] = useState({ cliente: '', monto: '', concepto: '' });
  const agregarDeuda = () => {
    if (!newDeuda.cliente || !newDeuda.monto) return;
    setDeudas([...deudas, { ...newDeuda, id: Date.now(), pagado: false, fecha: new Date().toLocaleDateString() }]);
    setNewDeuda({ cliente: '', monto: '', concepto: '' });
  };

  const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-10">
      {/* HEADER NAVBAR */}
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-black italic">ORBITA<span className="text-orange-500">90</span></h1>
          <nav className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
            {['calculadora', 'stock', 'deudas'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setSeccion(tab)} 
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-[10px] font-black transition-all uppercase ${seccion === tab ? 'bg-white shadow text-orange-600' : 'text-slate-400'}`}
              >
                {tab}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-lg border border-orange-100">
            <span className="text-[9px] font-black text-orange-600 uppercase">TRM</span>
            <input type="number" value={tasaCOP} onChange={(e) => setTasaCOP(e.target.value)} className="bg-transparent font-bold text-sm w-16 outline-none text-orange-700" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        
        {/* SECCIÓN CALCULADORA */}
        {seccion === 'calculadora' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-sm font-black mb-4 uppercase text-slate-700 underline decoration-orange-400">Simulador de Importación</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input placeholder="Referencia Guayo" className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold" value={newZapato.nombre} onChange={e => setNewZapato({...newZapato, nombre: e.target.value.toUpperCase()})} />
                <input type="number" placeholder="Costo USD" className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold" value={newZapato.costoUSD} onChange={e => setNewZapato({...newZapato, costoUSD: e.target.value})} />
                <button onClick={agregarZapatoCalculadora} className="bg-slate-900 text-white font-black rounded-xl text-xs uppercase hover:bg-orange-500 transition-all">Calcular</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {itemsCalculadora.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-3xl border-l-4 border-l-orange-500 shadow-sm">
                  <p className="font-black text-xs uppercase text-slate-500">{item.nombre}</p>
                  <div className="flex justify-between items-end mt-2">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">VENTA SUGERIDA</p>
                      <p className="text-xl font-black text-slate-800">{fmt(item.venta)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-emerald-500">GANANCIA</p>
                      <p className="text-sm font-black text-emerald-500">{fmt(item.ganancia)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN STOCK */}
        {seccion === 'stock' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className={`p-6 rounded-3xl shadow-lg border-2 transition-all ${editandoStockId ? 'border-orange-500 bg-orange-50' : 'border-transparent bg-white'}`}>
              <h2 className="text-sm font-black mb-4 uppercase text-slate-700">{editandoStockId ? '📝 Editando Producto' : '🚀 Ingreso de Mercancía'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <input placeholder="Referencia" className="p-3 bg-white rounded-xl border border-slate-200 text-sm font-bold lg:col-span-2" value={newStock.referencia} onChange={e => setNewStock({...newStock, referencia: e.target.value.toUpperCase()})} />
                <select className="p-3 bg-white rounded-xl border border-slate-200 text-sm font-bold" value={newStock.tipo} onChange={e => setNewStock({...newStock, tipo: e.target.value})}>
                  <option>FAN</option><option>PLAYER</option><option>RETRO</option><option>KIDS</option>
                </select>
                <select className="p-3 bg-white rounded-xl border border-slate-200 text-sm font-bold" value={newStock.talla} onChange={e => setNewStock({...newStock, talla: e.target.value})}>
                  <option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option><option>24</option><option>26</option><option>28</option>
                </select>
                <div className="flex gap-2">
                  <input type="number" className="p-3 bg-white rounded-xl border border-slate-200 text-sm font-bold w-full" value={newStock.cantidad} onChange={e => setNewStock({...newStock, cantidad: parseInt(e.target.value) || 0})} />
                  <button onClick={guardarStock} className={`px-6 rounded-xl font-black text-[10px] uppercase ${editandoStockId ? 'bg-orange-600 text-white' : 'bg-slate-900 text-white'}`}>{editandoStockId ? 'OK' : 'Añadir'}</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stock.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[8px] font-black px-2 py-1 rounded-md ${item.tipo === 'PLAYER' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>{item.tipo}</span>
                    <div className="flex gap-2">
                      <button onClick={() => prepararEdicionStock(item)} className="text-xs">✏️</button>
                      <button onClick={() => setStock(stock.filter(i => i.id !== item.id))} className="text-xs">🗑️</button>
                    </div>
                  </div>
                  <h3 className="font-black text-slate-800 text-xs uppercase">{item.referencia}</h3>
                  <p className="text-[10px] font-bold text-slate-400 mb-4">TALLA {item.talla}</p>
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl">
                    <button onClick={() => setStock(stock.map(s => s.id === item.id ? {...s, cantidad: Math.max(0, s.cantidad - 1)} : s))} className="w-8 h-8 rounded-xl bg-white border font-bold">-</button>
                    <span className="font-black text-sm">{item.cantidad} UND</span>
                    <button onClick={() => setStock(stock.map(s => s.id === item.id ? {...s, cantidad: s.cantidad + 1} : s))} className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold">+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN DEUDAS */}
        {seccion === 'deudas' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white">
              <h2 className="text-sm font-black mb-4 uppercase text-orange-400">Nueva Cuenta por Cobrar</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input placeholder="Cliente" className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-sm font-bold text-white outline-none" value={newDeuda.cliente} onChange={e => setNewDeuda({...newDeuda, cliente: e.target.value.toUpperCase()})} />
                <input type="number" placeholder="Valor COP" className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-sm font-bold text-white outline-none" value={newDeuda.monto} onChange={e => setNewDeuda({...newDeuda, monto: e.target.value})} />
                <button onClick={agregarDeuda} className="bg-orange-500 text-white font-black rounded-xl text-[10px] uppercase">Registrar</button>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                  <tr>
                    <th className="p-4">Cliente</th>
                    <th className="p-4 text-right">Monto</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {deudas.map(d => (
                    <tr key={d.id} className={`text-xs ${d.pagado ? 'bg-emerald-50/30' : ''}`}>
                      <td className="p-4">
                        <p className="font-black text-slate-700 uppercase">{d.cliente}</p>
                        <p className="text-[9px] text-slate-400">{d.fecha}</p>
                      </td>
                      <td className="p-4 text-right font-black">{fmt(d.monto)}</td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => setDeudas(deudas.map(item => item.id === d.id ? {...item, pagado: !item.pagado} : item))}
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${d.pagado ? 'bg-emerald-500 text-white' : 'bg-red-100 text-red-500 border border-red-200'}`}
                        >
                          {d.pagado ? 'PAGADO' : 'PENDIENTE'}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => setDeudas(deudas.filter(i => i.id !== d.id))} className="text-slate-300 hover:text-red-500">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                <span className="text-[10px] font-black uppercase text-slate-400">Total por Cobrar</span>
                <span className="text-xl font-black text-orange-400">{fmt(deudas.filter(d => !d.pagado).reduce((acc, curr) => acc + parseFloat(curr.monto || 0), 0))}</span>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;