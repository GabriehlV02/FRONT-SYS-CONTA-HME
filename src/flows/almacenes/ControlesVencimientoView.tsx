import { apiFetch } from '@ui/auth';
import { useEffect, useMemo, useState } from 'react';
import Icon from '@ui/components/Icon';
import { leerRespuesta } from '../usuarios/accesos';
import './ControlesVencimientoView.css';

type Lote = { id: string; codigo: string; nombre?: string; marca?: string; lote?: string; vence?: string; disponible: number; almacen?: string };
type Filtro = 'todos' | 'vencidos' | 'proximos';
const fechaHoy = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/La_Paz' }).format(new Date());
const diasHasta = (fecha: string, hoy: string) => Math.round((Date.parse(`${fecha}T00:00:00Z`) - Date.parse(`${hoy}T00:00:00Z`)) / 86_400_000);
const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');

export function ControlesVencimientoView() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true); setError('');
    apiFetch('/api/v1/stock/lotes', { signal: controller.signal })
      .then(leerRespuesta<{ data: Lote[] }>)
      .then(({ data }) => { if (!controller.signal.aborted) setLotes(data); })
      .catch((causa) => { if (!controller.signal.aborted) setError(causa instanceof Error ? causa.message : 'No se pudieron cargar los vencimientos.'); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [recarga]);

  const hoy = fechaHoy();
  const alertas = useMemo(() => lotes.filter((lote) => lote.disponible > 0 && lote.vence && !Number.isNaN(Date.parse(`${lote.vence}T00:00:00Z`)))
    .map((lote) => ({ ...lote, dias: diasHasta(lote.vence!, hoy) }))
    .filter((lote) => lote.dias <= 90)
    .sort((a, b) => a.dias - b.dias || a.nombre?.localeCompare(b.nombre || '', 'es') || 0), [hoy, lotes]);
  const vencidos = alertas.filter((lote) => lote.dias < 0);
  const proximos = alertas.filter((lote) => lote.dias >= 0);
  const visibles = alertas.filter((lote) => (filtro === 'vencidos' ? lote.dias < 0 : filtro === 'proximos' ? lote.dias >= 0 : true)
    && normalizar(`${lote.codigo} ${lote.nombre || ''} ${lote.marca || ''} ${lote.lote || ''} ${lote.almacen || ''}`).includes(normalizar(busqueda.trim())));
  const etiqueta = (dias: number) => dias < 0 ? `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? '' : 's'}` : dias === 0 ? 'Vence hoy' : `Vence en ${dias} días`;

  return <section className="controles-vencimiento" aria-label="Control de vencimientos">
    <header className="control-cabecera"><div><span>CONTROL DE INVENTARIO</span><h2>Vencimientos de lotes</h2><p>Revisa lotes vencidos y productos con vencimiento dentro de los próximos 90 días.</p></div><div className="control-cabecera-acciones"><div className="control-fecha"><Icon name="calendar" size={17} /><span>Fecha de consulta <b>{new Date(`${hoy}T12:00:00`).toLocaleDateString('es-BO')}</b></span></div><button type="button" className="control-actualizar" disabled={cargando} onClick={() => setRecarga((actual) => actual + 1)}>{cargando ? 'Actualizando…' : 'Actualizar'}</button></div></header>
    <div className="control-resumen" aria-label="Resumen de vencimientos">
      <button type="button" aria-pressed={filtro === 'todos'} className={filtro === 'todos' ? 'activo' : ''} onClick={() => setFiltro('todos')}><small>Vencidos o próximos</small><strong>{cargando ? '—' : alertas.length}</strong><span>lotes con existencia y fecha</span></button>
      <button type="button" aria-pressed={filtro === 'vencidos'} className={`vencido ${filtro === 'vencidos' ? 'activo' : ''}`} onClick={() => setFiltro('vencidos')}><small>Vencidos</small><strong>{cargando ? '—' : vencidos.length}</strong><span>requieren revisión inmediata</span></button>
      <button type="button" aria-pressed={filtro === 'proximos'} className={`proximo ${filtro === 'proximos' ? 'activo' : ''}`} onClick={() => setFiltro('proximos')}><small>Por vencer en 90 días</small><strong>{cargando ? '—' : proximos.length}</strong><span>fecha vigente o vence hoy</span></button>
    </div>
    <div className="control-herramientas"><label><Icon name="search" size={17} /><input type="search" aria-label="Buscar vencimiento" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar producto, marca, lote o almacén" /></label><span>{cargando ? 'Consultando…' : `${visibles.length} lotes mostrados`}</span></div>
    {error && <p className="control-error" role="alert">{error}<button type="button" onClick={() => setRecarga((actual) => actual + 1)}>Reintentar</button></p>}
    <div className="control-tabla-scroll" aria-busy={cargando}><table className="control-tabla"><thead><tr><th scope="col">Producto</th><th scope="col">Marca</th><th scope="col">Lote</th><th scope="col">Almacén</th><th scope="col">Disponibles</th><th scope="col">Vencimiento</th><th scope="col">Estado</th></tr></thead><tbody>{!cargando && !error && visibles.map((lote) => <tr key={lote.id}><td><strong>{lote.nombre || lote.codigo}</strong><small>{lote.codigo}</small></td><td>{lote.marca || 'Sin marca'}</td><td>{lote.lote || 'Sin lote'}</td><td>{lote.almacen || 'Sin almacén'}</td><td className="control-cantidad">{lote.disponible.toLocaleString('es-BO', { maximumFractionDigits: 3 })}</td><td>{new Date(`${lote.vence}T12:00:00`).toLocaleDateString('es-BO')}</td><td><span className={`control-estado ${lote.dias < 0 ? 'vencido' : lote.dias <= 30 ? 'urgente' : 'vigente'}`}>{etiqueta(lote.dias)}</span></td></tr>)}</tbody></table>
      {cargando && <p className="control-vacio" role="status">Consultando lotes y existencias…</p>}
      {!cargando && !error && !visibles.length && <div className="control-vacio" role="status"><Icon name="calendar" size={26} /><strong>{alertas.length ? 'No hay coincidencias' : 'No hay vencimientos para mostrar'}</strong><span>{alertas.length ? 'Cambia la búsqueda o selecciona otro filtro.' : 'Aquí aparecerán lotes con existencia vencidos o que vencerán dentro de 90 días.'}</span></div>}
    </div>
  </section>;
}
