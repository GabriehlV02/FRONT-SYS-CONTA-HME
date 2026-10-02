import { useEffect, useMemo, useState } from 'react';
import Icon from '@ui/components/Icon';
import './ControlesVencimientoView.css';

type Lote = { id: string; codigo: string; nombre?: string; marca?: string; lote?: string; vence?: string; disponible: number; almacen?: string };
type Filtro = 'todos' | 'vencidos' | 'proximos';
const fechaHoy = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/La_Paz' }).format(new Date());
const diasHasta = (fecha: string, hoy: string) => Math.round((Date.parse(`${fecha}T00:00:00Z`) - Date.parse(`${hoy}T00:00:00Z`)) / 86_400_000);

export function ControlesVencimientoView() {
  const [lotes, setLotes] = useState<Lote[]>([]), [filtro, setFiltro] = useState<Filtro>('todos'), [busqueda, setBusqueda] = useState(''), [cargando, setCargando] = useState(true), [error, setError] = useState('');
  useEffect(() => { let vigente = true; fetch('/api/stock/lotes').then(async respuesta => { const datos = await respuesta.json(); if (!respuesta.ok || !Array.isArray(datos.data)) throw new Error(); if (vigente) setLotes(datos.data); }).catch(() => { if (vigente) setError('No se pudieron cargar los lotes para el control de vencimientos.'); }).finally(() => { if (vigente) setCargando(false); }); return () => { vigente = false; }; }, []);
  const hoy = fechaHoy();
  const alertas = useMemo(() => lotes.filter(lote => lote.disponible > 0 && lote.vence).map(lote => ({ ...lote, dias: diasHasta(lote.vence!, hoy) })).filter(lote => lote.dias <= 90).sort((a, b) => a.dias - b.dias), [hoy, lotes]);
  const vencidos = alertas.filter(lote => lote.dias < 0), proximos = alertas.filter(lote => lote.dias >= 0);
  const visibles = alertas.filter(lote => (filtro === 'vencidos' ? lote.dias < 0 : filtro === 'proximos' ? lote.dias >= 0 : true) && `${lote.codigo} ${lote.nombre || ''} ${lote.marca || ''} ${lote.lote || ''} ${lote.almacen || ''}`.toLowerCase().includes(busqueda.toLowerCase()));
  const etiqueta = (dias: number) => dias < 0 ? `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? '' : 's'}` : dias === 0 ? 'Vence hoy' : `Vence en ${dias} días`;
  return <section className="controles-vencimiento"><header><div><span>CONTROL DE INVENTARIO</span><h2>Vencimientos de lotes</h2><p>Supervisa los productos con fecha de vencimiento próxima o vencida.</p></div><div className="control-fecha"><Icon name="calendar" size={18} /><span>Actualizado al <b>{new Date(`${hoy}T00:00:00`).toLocaleDateString('es-BO')}</b></span></div></header>
    <div className="control-resumen"><button className={filtro === 'todos' ? 'activo' : ''} onClick={() => setFiltro('todos')}><small>Total en control</small><strong>{alertas.length}</strong><span>lotes en los próximos 90 días</span></button><button className={`vencido ${filtro === 'vencidos' ? 'activo' : ''}`} onClick={() => setFiltro('vencidos')}><small>Vencidos</small><strong>{vencidos.length}</strong><span>requieren revisión inmediata</span></button><button className={`proximo ${filtro === 'proximos' ? 'activo' : ''}`} onClick={() => setFiltro('proximos')}><small>Próximos a vencer</small><strong>{proximos.length}</strong><span>con fecha vigente</span></button></div>
    <div className="control-herramientas"><label><Icon name="search" size={17} /><input value={busqueda} onChange={evento => setBusqueda(evento.target.value)} placeholder="Buscar ítem, marca, lote o almacén" /></label><span>{visibles.length} lotes</span></div>
    <div className="control-tabla"><div className="control-tabla-head"><span>Producto</span><span>Marca</span><span>Lote</span><span>Almacén</span><span>Disponibles</span><span>Vencimiento</span><span>Estado</span></div>{cargando ? <p className="control-vacio">Cargando controles…</p> : error ? <p className="control-vacio error">{error}</p> : visibles.map(lote => <article key={lote.id}><div><strong>{lote.nombre || lote.codigo}</strong><small>{lote.codigo}</small></div><span>{lote.marca || 'Sin marca'}</span><span className="control-lote">{lote.lote || 'Sin lote'}</span><span>{lote.almacen || 'Sin almacén'}</span><span>{lote.disponible}</span><span>{new Date(`${lote.vence}T00:00:00`).toLocaleDateString('es-BO')}</span><i className={lote.dias < 0 ? 'vencido' : lote.dias <= 30 ? 'urgente' : ''}>{etiqueta(lote.dias)}</i></article>)}{!cargando && !error && !visibles.length && <p className="control-vacio">No hay lotes vencidos ni próximos a vencer con los filtros seleccionados.</p>}</div>
  </section>;
}
