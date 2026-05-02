import React, { useState, useEffect } from 'react';

const App = () => {
  // --- PERSISTENCIA Y ESTADOS ---
  const [tasaCOP, setTasaCOP] = useState(() => JSON.parse(localStorage.getItem('g93_tasa')) || 4000);
  const [modo, setModo] = useState('cotizador'); 
  const [items, setItems] = useState([]); 
  const [stock, setStock] = useState(() => JSON.parse(localStorage.getItem('g93_stock')) || []);
  const [deudas, setDeudas] = useState(() => JSON.parse(localStorage.getItem('g93_deudas')) || []);

  useEffect(() => {
    localStorage.setItem('g93_tasa', JSON.stringify(tasaCOP));
    localStorage.setItem('g93_stock', JSON.stringify(stock));
    localStorage.setItem('g93_deudas', JSON.stringify(deudas));
  }, [tasaCOP, stock, deudas]);

  // --- LÓGICA DE NEGOCIO (IMPORTACIÓN) ---
  const COSTO_LIBRA = 3.10;
  const ENVIO_CHINA_USA = 10;
  const CARGOS_FIJOS = 7;
  const PESO_PAR_LB = 1.32;

  const PRECIOS_JERSEY = { fan: { costo: 13, venta: 125000 }, player: { costo: 16, venta: 140000 }, retro: { costo: 17, venta: 150000 } };

  // --- FUNCIONES ---
  const calcularJersey = (tipo) => {
    const costoCOP = PRECIOS_JERSEY[tipo].costo * tasaCOP;
    return { costo: costoCOP, venta: PRECIOS_JERSEY[tipo].venta, ganancia: PRECIOS_JERSEY[tipo].venta - costoCOP };
  };

  const calcularGuayo = (costoUSD, margen, nTotal) => {
    const logistica = (ENVIO_CHINA_USA + CARGOS_FIJOS + (nTotal * PESO_PAR_LB * COSTO_LIBRA)) / nTotal;
    const costoTotalCOP = (parseFloat(costoUSD) + logistica) * tasaCOP;
    const precioVenta = costoTotalCOP / (1 - (margen / 100));
    return { costo: costoTotalCOP, venta: precioVenta, ganancia: precioVenta - costoTotalCOP };
  };

  const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="max-w-4xl mx-auto p-4 font-sans antialiased text-slate-800">
      {/* HEADER SIMPLIFICADO */}
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-black italic">GOL93<span className="text-emerald-500">STORE</span></h1>
        <div className="flex gap-2">
          {['cotizador', 'stock', 'deudas'].map(m => (
            <button key={m} onClick={() => setModo(m)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${modo === m ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>{m}</button>
          ))}
        </div>
      </header>

      {/* TRM SIEMPRE VISIBLE */}
      <div className="mb-6 p-4 bg-emerald-50 rounded-xl flex justify-between items-center border border-emerald-100">
        <span className="text-xs font-bold text-emerald-700 uppercase">Tasa de Cambio (TRM)</span>
        <input type="number" value={tasaCOP} onChange={e => setTasaCOP(e.target.value)} className="bg-transparent text-right font-black text-emerald-900 outline-none w-24" />
      </div>

      {/* CONTENIDO SEGÚN MODO */}
      <main>
        {modo === 'cotizador' && (
          <div className="space-y-6">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-white border rounded-2xl shadow-sm">
                <h2 className="text-xs font-black mb-4 uppercase text-slate-400">Rápido: Camisetas</h2>
                <div className="grid grid-cols-1 gap-2">
                  {Object.keys(PRECIOS_JERSEY).map(t => {
                    const res = calcularJersey(t);
                    return (
                      <div key={t} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                        <span className="font-bold uppercase text-xs">{t}</span>
                        <span className="font-black text-emerald-600">{fmt(res.venta)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}

        {modo === 'stock' && (
          <div className="bg-white border rounded-2xl p-6">
            <h2 className="text-xs font-black mb-4 uppercase">Inventario Disponible</h2>
            <div className="flex gap-2 mb-4">
              <input id="in-stock" type="text" placeholder="Producto y Talla..." className="flex-1 p-3 bg-slate-50 rounded-xl outline-none" />
              <button onClick={() => {
                const val = document.getElementById('in-stock').value;
                if(val) setStock([...stock, { id: Date.now(), nombre: val.toUpperCase() }]);
                document.getElementById('in-stock').value = '';
              }} className="bg-emerald-500 text-white px-6 rounded-xl font-bold">Añadir</button>
            </div>
            <div className="divide-y">
              {stock.map(s => (
                <div key={s.id} className="py-3 flex justify-between items-center">
                  <span className="font-medium">{s.nombre}</span>
                  <button onClick={() => setStock(stock.filter(i => i.id !== s.id))} className="text-red-400 text-xs font-bold">Eliminar</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {modo === 'deudas' && (
          <div className="bg-white border rounded-2xl p-6">
            <h2 className="text-xs font-black mb-4 uppercase">Cuentas por Cobrar</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
              <input id="d-nom" type="text" placeholder="Cliente" className="p-3 bg-slate-50 rounded-xl outline-none" />
              <input id="d-val" type="number" placeholder="Monto COP" className="p-3 bg-slate-50 rounded-xl outline-none" />
              <button onClick={() => {
                const n = document.getElementById('d-nom').value;
                const v = document.getElementById('d-val').value;
                if(n && v) setDeudas([...deudas, { id: Date.now(), nombre: n, monto: v }]);
                document.getElementById('d-nom').value = ''; document.getElementById('d-val').value = '';
              }} className="bg-red-500 text-white rounded-xl font-bold">Registrar</button>
            </div>
            <div className="space-y-2">
              {deudas.map(d => (
                <div key={d.id} className="p-4 bg-red-50 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-red-400 uppercase">{d.nombre}</p>
                    <p className="font-black text-red-700">{fmt(d.monto)}</p>
                  </div>
                  <button onClick={() => setDeudas(deudas.filter(i => i.id !== d.id))} className="bg-white p-2 rounded-lg shadow-sm">✅ Pagado</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;