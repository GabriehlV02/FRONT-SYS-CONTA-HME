import { useEffect, useState } from 'react';
export function AvisosPrecio() {
  const [avisos, setAvisos] = useState<{ id: number; detalle: string; prioridad: string; fecha: string }[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { fetch('/api/inventario/avisos').then(async r => { if (!r.ok) throw new Error('No se pudieron cargar las alertas de costos'); return r.json(); }).then(r => setAvisos(r.data)).catch(e => setError(e.message)); }, []);
  return <section style={{ padding: 20 }}><h2>Historial de alertas de costos y precios</h2><p>Confirma los precios pendientes desde Ítems → Editar → Confirmar precio de venta revisado. Las compras más baratas nunca reducen automáticamente el precio.</p>{error && <p role="alert">{error}</p>}{avisos.map(a => <article key={a.id} style={{ margin: '10px 0', padding: 14, borderLeft: `4px solid ${a.prioridad === 'alta' ? '#dc2626' : '#2563eb'}`, background: a.prioridad === 'alta' ? '#fff1f2' : '#eff6ff' }}><small>{new Date(a.fecha).toLocaleString('es-BO')}</small><p>{a.detalle}</p></article>)}{!avisos.length && !error && <p>Sin cambios de costo registrados.</p>}</section>;
}
