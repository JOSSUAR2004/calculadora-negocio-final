import React, { useState, useEffect } from 'react';

const App = () => {
  // --- ESTADOS DE PERSISTENCIA ---
  const [tasaCOP, setTasaCOP] = useState(() => JSON.parse(localStorage.getItem('g93_tasa')) || 3600);
  const [modo, setModo] = useState('camisetas');
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('g93_items')) || []);
  const [historial, setHistorial] = useState(() => JSON.parse(localStorage.getItem('g93_historial')) || []);
  const [stock, setStock] = useState(() => JSON.parse(localStorage.getItem('g93_stock')) || []);
  const [deudas, setDeudas] = useState(() => JSON.parse(localStorage.getItem('g93_deudas')) || []);
  const [ventas, setVentas] = useState(() => JSON.parse(localStorage.getItem('g93_ventas')) || []);
  const [editandoId, setEditandoId] = useState(null); // Para saber qué fila se edita
  const [tempEdit, setTempEdit] = useState({});      // Para guardar los cambios temporales

  // --- SINCRONIZACIÓN LOCALSTORAGE ---
  useEffect(() => {
    localStorage.setItem('g93_tasa', JSON.stringify(tasaCOP));
    localStorage.setItem('g93_items', JSON.stringify(items));
    localStorage.setItem('g93_historial', JSON.stringify(historial));
    localStorage.setItem('g93_stock', JSON.stringify(stock));
    localStorage.setItem('g93_deudas', JSON.stringify(deudas));
    localStorage.setItem('g93_ventas', JSON.stringify(ventas));
  }, [tasaCOP, items, historial, stock, deudas, ventas]);


  const iniciarEdicion = (item) => {
    setEditandoId(item.id);
    setTempEdit({ ...item });
  };

  const guardarEdicion = () => {
    setStock(stock.map(i => i.id === editandoId ? tempEdit : i));
    setEditandoId(null);
  };

  const registrarVenta = (item) => {
    const nuevaVenta = {
      ...item,
      fechaVenta: new Date().toLocaleString(),
      idVenta: Date.now()
    };
    setVentas([nuevaVenta, ...ventas]); // Agrega al historial
    setStock(stock.filter(i => i.id !== item.id)); // Elimina del stock
  };

  const limpiarVentas = () => {
    const confirmar = window.confirm("¿Estás seguro de que quieres borrar todo el historial de ventas? Esta acción no se puede deshacer.");
    if (confirmar) {
      setVentas([]);
      // Opcional: También podrías limpiar el localStorage manualmente aquí, 
      // aunque el useEffect lo hará automáticamente al cambiar el estado.
    }
  };
  // --- CONSTANTES LOGÍSTICAS ---
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

  // --- ESTADOS DE INTERFAZ ---
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);

  // --- FORMULARIOS ---
  const [cajaZapatos, setCajaZapatos] = useState({ cantidadTotalCaja: 1 });
  const [newZapato, setNewZapato] = useState({ nombre: '', costoUSD: '', margen: 20, cantidad: 1 });
  const [newJersey, setNewJersey] = useState({ nombre: '', tipo: 'player', parches: 0, dorsal: false, cantidad: 1 });
  const [newStock, setNewStock] = useState({ referencia: '', talla: 'L', tipo: 'player' });

  // --- LÓGICA DE CÁLCULO ---
  const calcularValores = (item, trm) => {
    if (item.tipoItem === 'zapato') {
      const costoTotalUSD = parseFloat(item.costoUSD) + item.costoLogisticaUSD;
      const costoCOP = costoTotalUSD * trm;
      const venta = costoCOP / (1 - (item.margen / 100));
      return { costoCOP, venta, ganancia: venta - costoCOP, costoUSD: costoTotalUSD };
    } else {
      const costoExtrasUSD = (item.dorsal ? 1 : 0) + (parseInt(item.parches) || 0);
      const costoTotalUSD = item.costoBaseUSD + costoExtrasUSD;
      const costoCOP = costoTotalUSD * trm;
      const venta = PRECIOS_VENTA_JERSEY[item.tipo];
      return { costoCOP, venta, ganancia: venta - costoCOP, costoUSD: costoTotalUSD };
    }
  };

  // --- ACCIONES ---
  const agregarZapato = () => {
    if (!newZapato.nombre || !newZapato.costoUSD) return;
    const nTotalCaja = parseInt(cajaZapatos.cantidadTotalCaja) || 1;
    const logisticaPorParUSD = (ENVIO_CHINA_USA + CARGOS_FIJOS + ((nTotalCaja * PESO_PAR_LB) * COSTO_LIBRA)) / nTotalCaja;
    const nuevos = Array.from({ length: parseInt(newZapato.cantidad) || 1 }, () => ({
      ...newZapato,
      id: Math.random().toString(36).substr(2, 9),
      costoLogisticaUSD: logisticaPorParUSD,
      tipoItem: 'zapato',
      trmRegistro: tasaCOP,
      fechaAgregado: new Date().toISOString()
    }));
    setItems([...items, ...nuevos]);
    setNewZapato({ ...newZapato, nombre: '', costoUSD: '', cantidad: 1 });
  };

  const agregarJersey = () => {
    if (!newJersey.nombre) return;
    const nuevos = Array.from({ length: parseInt(newJersey.cantidad) || 1 }, () => ({
      ...newJersey,
      id: Math.random().toString(36).substr(2, 9),
      costoBaseUSD: COSTOS_BASE_JERSEY[newJersey.tipo],
      tipoItem: 'camiseta',
      trmRegistro: tasaCOP,
      fechaAgregado: new Date().toISOString()
    }));
    setItems([...items, ...nuevos]);
    setNewJersey({ ...newJersey, nombre: '', parches: 0, dorsal: false, cantidad: 1 });
  };

  const guardarLotePrincipal = () => {
    if (items.length === 0) return;
    setCargando(true);
    setTimeout(() => {
      const totalG = items.reduce((acc, i) => acc + calcularValores(i, tasaCOP).ganancia, 0);
      const nuevoLote = {
        id: Date.now(),
        fecha: new Date().toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        ganancia: totalG,
        und: items.length,
        tipo: modo,
        trm: tasaCOP,
        productos: items.map(i => ({ ...i, ...calcularValores(i, tasaCOP) }))
      };
      setHistorial([nuevoLote, ...historial]);
      setItems([]);
      setCargando(false);
    }, 600);
  };

  const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <header className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6 bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <span className="text-white font-black text-xl"></span>
            </div>
            <div>
              <h1 className="text-2xl font-black italic uppercase tracking-tighter">ORBITA<span className="text-emerald-500">90</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Panel de Importación v2.0</p>
            </div>
          </div>

          <nav className="flex bg-slate-100 p-1.5 rounded-2xl w-full lg:w-auto overflow-x-auto border border-slate-200">
            {[

              { id: 'camisetas', label: 'Camisetas', icon: '👕' },
              { id: 'zapatos', label: 'Guayos', icon: '👟' },
              { id: 'stock', label: 'Inventario', icon: '📦' },
              { id: 'deudas', label: 'Cuentas', icon: '💸' },
              { id: 'ventas', label: 'Sales', icon: '🛒' },



            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setModo(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[11px] uppercase transition-all duration-300 whitespace-nowrap ${modo === tab.id ? 'bg-white shadow-md text-slate-900 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 bg-emerald-50 p-1.5 rounded-2xl border border-emerald-100">
            <div className="px-3">
              <p className="text-[8px] font-black text-emerald-600 uppercase">TRM Mercado</p>
              <input
                type="number"
                value={tasaCOP}
                onChange={(e) => setTasaCOP(parseFloat(e.target.value) || 0)}
                className="bg-transparent border-none outline-none font-black text-emerald-800 text-lg w-24"
              />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* PANEL LATERAL */}
          <aside className="lg:col-span-4 space-y-6">
            {modo === 'zapatos' && (
              <section className="animate-in fade-in slide-in-from-left duration-500">
                <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-2xl mb-6 relative overflow-hidden">
                  <InputDark label="Capacidad Caja (Pares)" type="number" value={cajaZapatos.cantidadTotalCaja} onChange={v => setCajaZapatos({ cantidadTotalCaja: v })} />
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-5">
                  <Input label="Referencia del Guayo" value={newZapato.nombre} onChange={v => setNewZapato({ ...newZapato, nombre: v })} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Costo China (USD)" type="number" value={newZapato.costoUSD} onChange={v => setNewZapato({ ...newZapato, costoUSD: v })} />
                    <Input label="Margen %" type="number" value={newZapato.margen} onChange={v => setNewZapato({ ...newZapato, margen: v })} />
                  </div>
                  <Input label="Cantidad" type="number" value={newZapato.cantidad} onChange={v => setNewZapato({ ...newZapato, cantidad: v })} />
                  <button onClick={agregarZapato} className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-100">Registrar en Lote</button>
                </div>
              </section>
            )}

            {modo === 'camisetas' && (
              <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-5 border-b-[6px] border-indigo-500 animate-in fade-in slide-in-from-left duration-500">
                <Input label="Equipo / Selección" value={newJersey.nombre} onChange={v => setNewJersey({ ...newJersey, nombre: v })} />
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Calidad / Versión</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-700 outline-none"
                    value={newJersey.tipo}
                    onChange={e => setNewJersey({ ...newJersey, tipo: e.target.value })}
                  >
                    {Object.keys(COSTOS_BASE_JERSEY).map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4 items-end">
                  <Input label="Parches" type="number" value={newJersey.parches} onChange={v => setNewJersey({ ...newJersey, parches: v })} />
                  <button onClick={() => setNewJersey({ ...newJersey, dorsal: !newJersey.dorsal })} className={`p-4 rounded-2xl border-2 font-black text-[10px] h-[58px] transition-all ${newJersey.dorsal ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
                    {newJersey.dorsal ? 'CON DORSAL' : 'SIN DORSAL'}
                  </button>
                </div>
                <Input label="Unidades" type="number" value={newJersey.cantidad} onChange={v => setNewJersey({ ...newJersey, cantidad: v })} />
                <button onClick={agregarJersey} className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-100">Agregar al Carrito</button>
              </section>
            )}

            {modo === 'stock' && (
              <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-5 animate-in fade-in duration-500">
                <h3 className="text-xs font-black uppercase text-white-500 italic">Nuevo Ingreso a stock</h3>
                <Input
                  label="Referencia / Equipo"
                  placeholder="Ej: Real Madrid Local"
                  value={newStock.referencia}
                  onChange={v => setNewStock({ ...newStock, referencia: v })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-wider">Tipo</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none font-bold text-slate-700 text-sm focus:ring-2 ring-orange-500/20 focus:border-orange-500 transition-all"
                      value={newStock.tipo}
                      onChange={e => setNewStock({ ...newStock, tipo: e.target.value })}
                    >
                      <option value="player">Player</option>
                      <option value="fan">Fan</option>
                      <option value="retro">Retro</option>
                      <option value="children">Niño</option>
                      <option value="nba">NBA</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-wider">Talla</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none font-bold text-slate-700 text-sm focus:ring-2 ring-orange-500/20 focus:border-white-500 transition-all"
                      value={newStock.talla}
                      onChange={e => setNewStock({ ...newStock, talla: e.target.value })}
                    >
                      <optgroup label="Ropa">
                        {['S', 'M', 'L', 'XL', 'XXL'].map(t => <option key={t} value={t}>{t}</option>)}
                      </optgroup>
                      <optgroup label="Calzado">
                        {['38', '39', '40', '41', '42', '43'].map(t => <option key={t} value={t}>{t}</option>)}
                      </optgroup>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!newStock.referencia) return;
                    setStock([{ id: Date.now(), ...newStock }, ...stock]);
                    setNewStock({ referencia: '', talla: 'L', tipo: 'player' });
                  }}
                  className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-100"
                >
                  Confirmar Entrada
                </button>
              </section>
            )}

            {modo === 'ventas' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* BANNER DE RESUMEN */}
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl flex justify-between items-center border-b-[6px] border-emerald-500">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Historial de Salidas Reales</p>
                    <h2 className="text-4xl font-black tracking-tighter">
                      {ventas.length} <span className="text-lg opacity-40 italic">Productos</span>
                    </h2>
                  </div>

                  {ventas.length > 0 && (
                    <button
                      onClick={limpiarVentas}
                      className="bg-red-500/10 hover:bg-red-600 border border-red-500/20 text-red-500 hover:text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase transition-all shadow-lg active:scale-95"
                    >
                      🗑️ Limpiar Todo
                    </button>
                  )}
                </div>

                {/* TABLA DE DETALLES */}
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase bg-slate-50/50">
                          <th className="p-6">Fecha y Hora</th>
                          <th className="p-6">Producto / Referencia</th>
                          <th className="p-6 text-center">Tipo</th>
                          <th className="p-6 text-center">Talla</th>
                          <th className="p-6 text-right">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {ventas.map((v) => (
                          <tr key={v.idVenta} className="hover:bg-emerald-50/30 transition-colors">
                            <td className="p-6">
                              <div className="text-[10px] font-black text-slate-400 uppercase leading-none">{v.fechaVenta.split(',')[0]}</div>
                              <div className="text-[9px] font-bold text-emerald-600 mt-1">{v.fechaVenta.split(',')[1]}</div>
                            </td>
                            <td className="p-6">
                              <div className="font-black text-slate-800 text-sm uppercase">{v.referencia}</div>
                              <div className="text-[9px] text-slate-400 font-bold italic">ID: {v.idVenta.toString().slice(-6)}</div>
                            </td>
                            <td className="p-6 text-center">
                              <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase">
                                {v.tipo}
                              </span>
                            </td>
                            <td className="p-6 text-center">
                              <span className="text-sm font-black text-slate-700">{v.talla}</span>
                            </td>
                            <td className="p-6 text-right">
                              <div className="flex flex-col items-end">
                                <span className="text-emerald-500 font-black text-[10px] uppercase tracking-tighter">✓ Vendido</span>
                                <span className="text-[8px] font-bold text-slate-300 uppercase">Salida Bodega</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {ventas.length === 0 && (
                      <div className="p-20 text-center">
                        <div className="text-4xl mb-4 opacity-20">📦</div>
                        <p className="text-slate-300 font-black uppercase text-xs italic tracking-widest">
                          Esperando la primera venta de Gol93Store...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {modo === 'deudas' && (
              <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-5 animate-in fade-in duration-500">
                <h3 className="text-xs font-black uppercase text-white-500 italic">Registrar Saldo</h3>
                <Input label="Cliente" id="d-nom" />
                <Input label="Valor COP" type="number" id="d-val" />
                <button
                  onClick={() => {
                    const n = document.getElementById('d-nom').value;
                    const v = document.getElementById('d-val').value;

                    if (n && v) {
                      // El secreto está en Number(v) para evitar la concatenación loca
                      setDeudas([{
                        id: Date.now(),
                        cliente: n,
                        monto: Number(v), // Convertimos explícitamente a número
                        fecha: new Date().toLocaleDateString()
                      }, ...deudas]);

                      document.getElementById('d-nom').value = '';
                      document.getElementById('d-val').value = '';
                    }
                  }}
                  className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-100"
                >
                  Crear Cuenta
                </button>
              </section>
            )}
          </aside>

          {/* ÁREA PRINCIPAL */}
          <main className="lg:col-span-8 space-y-8">
            {(modo === 'camisetas' || modo === 'zapatos') && (
              <div className="space-y-8">
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-50 flex justify-between bg-slate-50/50">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Items en el Lote</span>
                    <span className="text-[10px] font-bold text-slate-400 italic">{items.length} productos listos</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase">
                          <th className="p-6">Descripción</th>
                          <th className="p-6 text-center">Inversión</th>
                          <th className="p-6 text-right">Utilidad</th>
                          <th className="p-6"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {items.map(item => {
                          const { costoCOP, ganancia } = calcularValores(item, tasaCOP);
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="p-6">
                                <div className="font-bold text-slate-800 text-sm uppercase">{item.nombre}</div>
                                <div className="text-[9px] font-black text-slate-400 uppercase italic">
                                  {item.tipoItem === 'zapato' ? 'Guayo' : `Jersey ${item.tipo}`}
                                </div>
                              </td>
                              <td className="p-6 text-center font-bold text-slate-500 text-xs">{fmt(costoCOP)}</td>
                              <td className="p-6 text-right">
                                <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg font-black text-xs">+{fmt(ganancia)}</span>
                              </td>
                              <td className="p-6 text-right">
                                <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-slate-200 hover:text-red-500 transition-colors">✕</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl border-b-[8px] border-emerald-500">
                    <div>
                      <p className="text-emerald-400 text-[11px] font-black uppercase tracking-widest mb-2">Ganancia Neta Lote</p>
                      <h2 className="text-5xl font-black tracking-tighter">
                        {fmt(items.reduce((acc, i) => acc + calcularValores(i, tasaCOP).ganancia, 0))}
                      </h2>
                    </div>
                    <button onClick={guardarLotePrincipal} className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-100">
                      {cargando ? 'Procesando...' : 'Finalizar y Guardar'}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {historial.map(lote => (
                    <div key={lote.id} onClick={() => setLoteSeleccionado(lote)} className="bg-white p-5 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm hover:shadow-xl transition-all cursor-pointer">
                      <div>
                        <p className="text-[9px] font-black text-slate-800 mb-1">{lote.fecha}</p>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase ${lote.tipo === 'zapatos' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                          {lote.tipo} - {lote.und} UND
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-emerald-600 leading-none">{fmt(lote.ganancia)}</p>
                        <button onClick={(e) => { e.stopPropagation(); setHistorial(historial.filter(h => h.id !== lote.id)) }} className="text-slate-200 hover:text-red-500 text-[10px] mt-2 font-black">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN STOCK EN TABLA */}
            {modo === 'stock' && (
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in duration-300">
                <div className="p-6 border-b border-slate-50 flex justify-between bg-slate-50/50 items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Inventario en Bodega</span>
                  <span className="bg-orange-50 text-orange-600 text-[10px] font-black px-3 py-1 rounded-full">{stock.length} Artículos</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase">
                        <th className="p-6">Referencia</th>
                        <th className="p-6 text-center">Tipo</th>
                        <th className="p-6 text-center">Talla</th>
                        <th className="p-6 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {stock.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          {editandoId === item.id ? (
                            <>
                              <td className="p-4">
                                <input className="border rounded-lg p-2 w-full font-bold uppercase text-sm"
                                  value={tempEdit.referencia}
                                  onChange={e => setTempEdit({ ...tempEdit, referencia: e.target.value })} />
                              </td>
                              <td className="p-4 text-center text-[9px] font-black text-slate-400 uppercase italic">
                                {item.tipo}
                              </td>
                              <td className="p-4 text-center">
                                <input className="border rounded-lg p-2 w-20 font-bold text-center"
                                  value={tempEdit.talla}
                                  onChange={e => setTempEdit({ ...tempEdit, talla: e.target.value })} />
                              </td>
                              <td className="p-4 text-right">
                                <button onClick={guardarEdicion} className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase mr-2">Guardar</button>
                                <button onClick={() => setEditandoId(null)} className="text-slate-400 font-black text-[10px] uppercase">Cancelar</button>
                              </td>
                            </>
                          ) : (
                            <>
                              {/* 1. REFERENCIA */}
                              <td className="p-6 font-bold text-slate-800 uppercase">{item.referencia}</td>

                              {/* 2. TIPO (Esta es la columna que faltaba para que no se ruede) */}
                              <td className="p-6 text-center text-[9px] font-black text-slate-400 uppercase italic">
                                {item.tipo}
                              </td>

                              {/* 3. TALLA */}
                              <td className="p-6 text-center font-bold text-slate-800 uppercase"> {item.talla}</td>

                              {/* 4. ACCIÓN */}
                              <td className="p-6 text-right space-x-4">
                                <button onClick={() => iniciarEdicion(item)} className="text-slate-400 hover:text-indigo-600 transition-colors">Editar</button>
                                <button onClick={() => registrarVenta(item)} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase hover:bg-emerald-500 transition-colors">Vendido</button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {stock.length === 0 && <p className="p-10 text-center text-slate-300 font-bold uppercase text-xs">No hay productos en stock</p>}
                </div>
              </div>
            )}

            {/* SECCIÓN DEUDAS EN TABLA + TOTAL */}
            {modo === 'deudas' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Banner Total Deudas */}
                <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 border-b-[6px] border-indigo-800 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Total por Cobrar</p>
                    <h2 className="text-4xl font-black tracking-tighter">
                      {fmt(deudas.reduce((acc, d) => acc + d.monto, 0))}
                    </h2>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">$</div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase">
                          <th className="p-6">Fecha</th>
                          <th className="p-6">Cliente</th>
                          <th className="p-6 text-center">Monto</th>
                          <th className="p-6 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {deudas.map(deuda => (
                          <tr key={deuda.id} className="hover:bg-red-50/30 transition-colors">
                            <td className="p-6 text-[10px] font-black text-slate-400 uppercase">{deuda.fecha}</td>
                            <td className="p-6 font-black text-slate-800 text-sm uppercase">{deuda.cliente}</td>
                            <td className="p-6 text-center font-black text-red-600 text-md">{fmt(deuda.monto)}</td>
                            <td className="p-6 text-right">
                              <button
                                onClick={() => setDeudas(deudas.filter(d => d.id !== deuda.id))}
                                className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase transition-all"
                              >
                                Marcar Pagado
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {deudas.length === 0 && <p className="p-10 text-center text-slate-300 font-bold uppercase text-xs">Cuentas al día</p>}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MODAL DETALLE LOTE */}
      {loteSeleccionado && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-8 bg-[#f8fafc] border-b flex justify-between items-center">
              <div>
                <span className="bg-slate-900 text-white text-[9px] font-black px-3 py-1 rounded-lg uppercase italic">{loteSeleccionado.tipo}</span>
                <h3 className="text-2xl font-black uppercase text-slate-800 mt-2">Desglose de Operación</h3>
              </div>
              <button onClick={() => setLoteSeleccionado(null)} className="bg-white w-10 h-10 rounded-full shadow-lg font-black text-slate-400 hover:text-red-500 transition-colors">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  <tr><th className="p-4">Producto</th><th className="p-4 text-center">Costo COP</th><th className="p-4 text-center">Venta</th><th className="p-4 text-right">Ganancia</th></tr>
                </thead>
                <tbody className="divide-y">
                  {loteSeleccionado.productos.map((prod, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-5 font-bold text-slate-800 text-sm uppercase">{prod.nombre}</td>
                      <td className="p-5 text-center font-bold text-slate-400 text-xs">{fmt(prod.costoCOP)}</td>
                      <td className="p-5 text-center font-black text-indigo-500 text-sm">{fmt(prod.venta)}</td>
                      <td className="p-5 text-right font-black text-emerald-500 text-sm">+{fmt(prod.ganancia)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-8 bg-slate-900 text-right">
              <p className="text-[10px] font-black text-emerald-400 uppercase mb-2 tracking-widest">Utilidad Final Lote</p>
              <p className="text-4xl font-black text-white leading-none">{fmt(loteSeleccionado.ganancia)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// COMPONENTES ATÓMICOS
const Input = ({ label, onChange, ...p }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-wider">{label}</label>
    <input {...p} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none font-bold text-slate-700 text-sm focus:ring-2 ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300" />
  </div>
);

const InputDark = ({ label, onChange, ...p }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-wider">{label}</label>
    <input {...p} onChange={e => onChange(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none font-bold text-white text-sm focus:border-emerald-400 transition-all" />
  </div>
);

export default App;