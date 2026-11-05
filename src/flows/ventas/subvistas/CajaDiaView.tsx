import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@ui/auth';
import Icon from '@ui/components/Icon';
import './CajaDiaReal.css';

type Pago = { metodo: string; monto: string | number };
type Venta = {
  id: string; codigo: string; total: string | number; descuento: string | number; cobrada_en: string | null;
  created_at: string; usuario_sistema_id: string | null; caja_id: number | null;
  cliente: { nombre_razon_social: string } | null;
  caja: { id: number; nombre: string; codigo: string } | null;
  sucursal: { nombre: string } | null;
  usuario_sistema: { nombres: string; apellidos: string | null; usuario: string } | null;
  pagos: Pago[] | null; cambio: string | number | null;
  detalles: { id: string; nombre_item: string; cantidad: string | number; precio_unitario: string | number; total: string | number }[];
};
type RespuestaVentas = { data: Venta[]; current_page: number; last_page: number };
const moneda = (valor: number) => `Bs ${valor.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const vendedor = (venta: Venta) => venta.usuario_sistema ? [venta.usuario_sistema.nombres, venta.usuario_sistema.apellidos].filter(Boolean).join(' ') || venta.usuario_sistema.usuario : 'No registrado';
const fechaVenta = (venta: Venta) => new Date(venta.cobrada_en || venta.created_at);
const fechaLocal = (venta: Venta) => {
  const fecha = fechaVenta(venta);
  return Number.isNaN(fecha.getTime()) ? '' : new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha);
};
const mostrarFecha = (venta: Venta) => {
  const fecha = fechaVenta(venta);
  return Number.isNaN(fecha.getTime()) ? 'No registrada' : new Intl.DateTimeFormat('es-BO', { timeZone: 'America/La_Paz', dateStyle: 'short', timeStyle: 'short' }).format(fecha);
};
const metodos = (venta: Venta) => venta.pagos?.length ? [...new Set(venta.pagos.map(pago => pago.metodo))].join(', ') : 'No registrado';

export function CajaDiaView() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [fecha, setFecha] = useState('');
  const [caja, setCaja] = useState('');
  const [usuario, setUsuario] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [seleccionada, setSeleccionada] = useState<Venta | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true); setError('');
    const cargar = async () => {
      const resultados: Venta[] = [];
      let pagina = 1;
      let ultima = 1;
      do {
        const respuesta = await apiFetch(`/api/v1/ventas?per_page=100&page=${pagina}`, { signal: controller.signal });
        const cuerpo = await respuesta.json();
        if (!respuesta.ok) throw new Error(cuerpo.message || 'No se pudieron consultar las ventas.');
        const resultado = cuerpo as RespuestaVentas;
        if (!Array.isArray(resultado.data) || !Number.isInteger(resultado.last_page) || resultado.last_page < 1) throw new Error('El servidor devolvió un listado de ventas inválido.');
        resultados.push(...resultado.data);
        ultima = resultado.last_page;
        pagina++;
      } while (pagina <= ultima);
      if (!controller.signal.aborted) setVentas(resultados);
    };
    void cargar().catch(causa => { if (!controller.signal.aborted) { setVentas([]); setError(causa instanceof Error ? causa.message : 'No se pudieron consultar las ventas.'); } })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [revision]);

  const cajas = useMemo(() => [...new Map(ventas.filter(v => v.caja).map(v => [String(v.caja!.id), v.caja!])).values()].sort((a, b) => a.nombre.localeCompare(b.nombre)), [ventas]);
  const vendedores = useMemo(() => [...new Map(ventas.filter(v => v.usuario_sistema_id).map(v => [v.usuario_sistema_id!, vendedor(v)])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [ventas]);
  const visibles = useMemo(() => ventas.filter(v => (!fecha || fechaLocal(v) === fecha) && (!caja || String(v.caja_id) === caja) && (!usuario || v.usuario_sistema_id === usuario)), [ventas, fecha, caja, usuario]);
  const total = visibles.reduce((suma, venta) => suma + Math.round(Number(venta.total) * 100), 0);
  const resumen = new Map<string, { nombre: string; cantidad: number; total: number }>();
  const cobros = new Map<string, number>();
  let sinPago = 0;
  for (const venta of visibles) {
    const clave = venta.usuario_sistema_id || 'sin-usuario';
    const actual = resumen.get(clave) || { nombre: vendedor(venta), cantidad: 0, total: 0 };
    actual.cantidad++; actual.total += Math.round(Number(venta.total) * 100); resumen.set(clave, actual);
    if (!venta.pagos?.length) { sinPago++; continue; }
    let cambioPendiente = Math.round(Number(venta.cambio || 0) * 100);
    for (const pago of venta.pagos) {
      let monto = Math.round(Number(pago.monto) * 100);
      if (pago.metodo === 'Efectivo' && cambioPendiente > 0) {
        const deduccion = Math.min(monto, cambioPendiente);
        monto -= deduccion; cambioPendiente -= deduccion;
      }
      cobros.set(pago.metodo, (cobros.get(pago.metodo) || 0) + monto);
    }
  }
  const exportar = () => {
    const filas = [['Fecha', 'Venta', 'Sucursal', 'Caja', 'Vendedor', 'Cliente', 'Pago', 'Total (Bs)'], ...visibles.map(v => [mostrarFecha(v), v.codigo, v.sucursal?.nombre || 'No registrada', v.caja?.nombre || 'No registrada', vendedor(v), v.cliente?.nombre_razon_social || 'No registrado', metodos(v), Number(v.total).toFixed(2)])];
    const csv = filas.map(fila => fila.map(celda => {
      const texto = String(celda);
      const seguro = /^[\s\u0000-\u001f]*[=+\-@]/.test(texto) ? `'${texto}` : texto;
      return `"${seguro.replaceAll('"', '""')}"`;
    }).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
    const enlace = document.createElement('a'); enlace.href = url; enlace.download = `ventas-${fecha || 'todas'}.csv`; enlace.click(); URL.revokeObjectURL(url);
  };

  return <section className="caja-dia-vista" aria-label="Ventas por caja">
    <section className="caja-dia-filtros" aria-label="Filtros de ventas">
      <label>Fecha<input type="date" value={fecha} onChange={evento => setFecha(evento.target.value)} /></label>
      <label>Caja<select value={caja} onChange={evento => setCaja(evento.target.value)}><option value="">Todas las cajas</option>{cajas.map(item => <option key={item.id} value={item.id}>{item.codigo} · {item.nombre}</option>)}</select></label>
      <label>Vendedor<select value={usuario} onChange={evento => setUsuario(evento.target.value)}><option value="">Todos</option>{vendedores.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}</select></label>
      <button type="button" className="primario" disabled={cargando} onClick={() => setRevision(valor => valor + 1)}><Icon name="search" size={16} /> Consultar</button>
      <button type="button" className="secundario" disabled={cargando || !!error || !visibles.length} onClick={exportar}><Icon name="fileText" size={16} /> Exportar CSV</button>
    </section>
    {cargando && <p role="status">Cargando ventas registradas…</p>}
    {error && <p role="alert">{error} <button type="button" onClick={() => setRevision(valor => valor + 1)}>Reintentar</button></p>}
    <div className="caja-dia-kpis"><article><span><Icon name="cash" size={18} /></span><div><small>Ventas</small><strong>{cargando || error ? '—' : visibles.length}</strong></div></article><article><span><Icon name="fileText" size={18} /></span><div><small>Total vendido</small><strong>{cargando || error ? '—' : moneda(total / 100)}</strong></div></article><article><span><Icon name="user" size={18} /></span><div><small>Vendedores</small><strong>{cargando || error ? '—' : new Set(visibles.map(v => v.usuario_sistema_id).filter(Boolean)).size}</strong></div></article><article><span><Icon name="chart" size={18} /></span><div><small>Ticket promedio</small><strong>{cargando || error ? '—' : moneda(visibles.length ? total / 100 / visibles.length : 0)}</strong></div></article></div>
    <div className="caja-dia-columnas"><section className="ventas-panel caja-dia-listado"><div className="ventas-panel-head"><div><h3>Ventas registradas</h3><small>{fecha ? `Ventas del ${fecha}` : 'Todas las fechas'} · {visibles.length} registros</small></div></div><div className="caja-dia-tabla" role="table" aria-label="Ventas registradas"><div className="caja-dia-fila encabezado" role="row"><span>Fecha y hora</span><span>Venta</span><span>Vendedor</span><span>Cliente</span><span>Pago</span><span>Total</span><span /></div>{visibles.map(venta => <div className="caja-dia-fila" role="row" key={venta.id}><span>{mostrarFecha(venta)}</span><strong>{venta.codigo}</strong><span>{vendedor(venta)}</span><span>{venta.cliente?.nombre_razon_social || 'No registrado'}</span><span>{metodos(venta)}</span><strong>{moneda(Number(venta.total))}</strong><button type="button" title="Ver detalle de la venta" aria-label={`Ver detalle de la venta ${venta.codigo}`} onClick={() => setSeleccionada(venta)}><Icon name="eye" size={16} /></button></div>)}</div>{!cargando && !error && !visibles.length && <p className="caja-dia-vacio">No hay ventas que coincidan con los filtros.</p>}</section>
      <aside className="caja-dia-resumen"><section><h3>Resumen por vendedor</h3>{[...resumen.values()].map((item, indice) => <article key={indice}><span>{item.nombre}</span><strong>{item.cantidad} ventas · {moneda(item.total / 100)}</strong></article>)}{!resumen.size && <p>Sin ventas para mostrar.</p>}</section><section><h3>Distribución de cobros</h3>{[...cobros.entries()].map(([metodo, monto]) => <article key={metodo}><span>{metodo}</span><strong>{moneda(monto / 100)}</strong></article>)}{sinPago > 0 && <p>{sinPago} {sinPago === 1 ? 'venta sin método de pago registrado.' : 'ventas sin método de pago registrado.'}</p>}{!cobros.size && !sinPago && <p>Sin cobros para mostrar.</p>}</section></aside>
    </div>
    <section className="ventas-panel caja-dia-historico"><div className="ventas-panel-head"><div><h3>Histórico de cierres</h3><small>Los cierres de caja aún no están registrados en el sistema.</small></div></div></section>
    {seleccionada && <div className="caja-exportar-fondo" role="presentation" onMouseDown={evento => { if (evento.target === evento.currentTarget) setSeleccionada(null); }}><section className="caja-exportar-modal caja-dia-detalle" role="dialog" aria-modal="true" aria-labelledby="caja-dia-detalle-titulo"><header><div><p>VENTA REGISTRADA</p><h3 id="caja-dia-detalle-titulo">{seleccionada.codigo}</h3></div><button type="button" onClick={() => setSeleccionada(null)} aria-label="Cerrar"><Icon name="close" size={18} /></button></header><p>{mostrarFecha(seleccionada)} · {seleccionada.caja?.nombre || 'Caja no registrada'}</p><p>Cliente: {seleccionada.cliente?.nombre_razon_social || 'No registrado'}<br />Vendedor: {vendedor(seleccionada)}</p><div className="caja-dia-detalle-items">{seleccionada.detalles.map(item => <article key={item.id}><span>{item.nombre_item}<small>{Number(item.cantidad)} × {moneda(Number(item.precio_unitario))}</small></span><strong>{moneda(Number(item.total))}</strong></article>)}</div><p>Pago: {metodos(seleccionada)}</p><strong>Total: {moneda(Number(seleccionada.total))}</strong><footer><button type="button" onClick={() => setSeleccionada(null)}>Cerrar</button></footer></section></div>}
  </section>;
}
