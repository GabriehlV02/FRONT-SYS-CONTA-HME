import { useMemo, useState } from 'react';
import Icon, { type IconName } from '@ui/components/Icon';
import './NotificacionesView.css';

type Categoria = 'Usuarios' | 'Inventario' | 'Ventas' | 'Sistema';
type Aviso = { id: number; titulo: string; detalle: string; categoria: Categoria; destino: string; icono: IconName; momento: string; leida: boolean; prioridad: 'normal' | 'alta' };


export function NotificacionesView({ onSelect }: { onSelect: (id: string) => void }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [estado, setEstado] = useState<'Todas' | 'No leídas' | 'Leídas'>('Todas');
  const [categoria, setCategoria] = useState<'Todas' | Categoria>('Todas');
  const [busqueda, setBusqueda] = useState('');
  const pendientes = avisos.filter((item) => !item.leida).length;
  const criticas = avisos.filter((item) => !item.leida && item.prioridad === 'alta').length;
  const visibles = useMemo(() => avisos.filter((item) => {
    const coincideTexto = `${item.titulo} ${item.detalle} ${item.categoria}`.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = estado === 'Todas' || (estado === 'No leídas' ? !item.leida : item.leida);
    return coincideTexto && coincideEstado && (categoria === 'Todas' || item.categoria === categoria);
  }), [avisos, busqueda, categoria, estado]);
  const abrir = (item: Aviso) => { setAvisos((actual) => actual.map((aviso) => aviso.id === item.id ? { ...aviso, leida: true } : aviso)); onSelect(item.destino); };
  const alternar = (id: number) => setAvisos((actual) => actual.map((item) => item.id === id ? { ...item, leida: !item.leida } : item));

  return <section className="notificaciones-centro">
    <div className="notificaciones-herramientas"><label><Icon name="search" size={17} /><input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar en notificaciones" /></label><div className="notificaciones-estados">{(['Todas', 'No leídas', 'Leídas'] as const).map((item) => <button key={item} type="button" className={estado === item ? 'activo' : ''} onClick={() => setEstado(item)}>{item}</button>)}</div><button className="notificaciones-leer-todas" type="button" disabled={!pendientes} onClick={() => setAvisos((actual) => actual.map((item) => ({ ...item, leida: true }))) }><Icon name="check" size={15} /> Marcar todas como leídas</button></div>
    <div className="notificaciones-categorias">{(['Todas', 'Usuarios', 'Inventario', 'Ventas', 'Sistema'] as const).map((item) => <button key={item} type="button" className={categoria === item ? 'activo' : ''} onClick={() => setCategoria(item)}>{item}</button>)}</div>
    <div className="notificaciones-cuerpo"><div className="notificaciones-listado">{visibles.length ? visibles.map((item) => <article className={`notificacion-tarjeta ${item.leida ? 'leida' : 'nueva'} ${item.prioridad === 'alta' ? 'prioritaria' : ''}`} key={item.id}><span className="notificacion-icono"><Icon name={item.icono} size={19} /></span><button className="notificacion-contenido" type="button" onClick={() => abrir(item)}><span className="notificacion-meta"><b>{item.categoria}</b><small>{item.momento}</small></span><strong>{item.titulo}</strong><p>{item.detalle}</p></button><div className="notificacion-acciones">{!item.leida && <span>Nueva</span>}<button type="button" onClick={() => alternar(item.id)} title={item.leida ? 'Marcar como no leída' : 'Marcar como leída'} aria-label={item.leida ? 'Marcar como no leída' : 'Marcar como leída'}><Icon name={item.leida ? 'eyeOff' : 'check'} size={16} /></button><button type="button" onClick={() => abrir(item)} title="Abrir cambio" aria-label="Abrir cambio"><Icon name="chevronRight" size={17} /></button></div></article>) : <div className="notificaciones-vacio"><Icon name="bell" size={28} /><strong>No hay notificaciones</strong><span>No hay avisos recibidos.</span></div>}</div><aside className="notificaciones-ayuda"><span><Icon name="sparkles" size={18} /></span><strong>Avisos del sistema</strong><p>Las notificaciones aparecerán aquí cuando el servidor las envíe.</p><div><b>{pendientes ? `${pendientes} pendientes` : 'Todo al día'}</b><small>{criticas ? `${criticas} requiere atención` : 'Sin avisos nuevos'}</small></div></aside></div>
  </section>;
}

