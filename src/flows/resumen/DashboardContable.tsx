import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@ui/auth';
import Icon from '@ui/components/Icon';
import './DashboardStock.css';

type Venta = { id: string; codigo: string; total: string | number; cobrada_en: string | null; cliente: { nombre_razon_social: string } | null; detalles: { codigo_item: string | null; nombre_item: string; tipo_item: string | null; cantidad: string | number; total: string | number }[] };
type Item = { id: number; nombre_comercial: string };
type Existencia = { itemId: number; disponible: number | string };
type Pagina<T> = { data: T[]; last_page: number };
const dinero = (valor: number) => `Bs ${valor.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fechaLocal = (fecha: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha);
const diaTexto = (fecha: string) => new Intl.DateTimeFormat('es-BO', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${fecha}T12:00:00Z`)).replace('.', '');

async function paginas<T>(url: string, signal: AbortSignal): Promise<T[]> {
  const todos: T[] = []; let page = 1; let ultima = 1;
  do {
    const respuesta = await apiFetch(`${url}&page=${page}`, { signal });
    if (!respuesta.ok) throw new Error(respuesta.status === 403 ? 'No tienes permiso para consultar estos datos.' : 'No se pudieron consultar los datos.');
    const cuerpo: Pagina<T> = await respuesta.json();
    if (!Array.isArray(cuerpo.data) || !Number.isInteger(cuerpo.last_page) || cuerpo.last_page < 1) throw new Error('El servidor devolvió datos incompletos.');
    todos.push(...cuerpo.data); ultima = cuerpo.last_page; page++;
  } while (page <= ultima);
  return todos;
}

export function DashboardContable({ onSelect }: { onSelect: (id: string) => void }) {
  const [ventas, setVentas] = useState<Venta[] | null>(null);
  const [inventario, setInventario] = useState<{ items: Item[]; existencias: Existencia[] } | null>(null);
  const [errorVentas, setErrorVentas] = useState(''); const [errorInventario, setErrorInventario] = useState(''); const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setVentas(null); setInventario(null); setErrorVentas(''); setErrorInventario('');
    paginas<Venta>('/api/v1/ventas?per_page=100', controller.signal).then(setVentas).catch(error => { if (!controller.signal.aborted) setErrorVentas(error.message); });
    Promise.all([
      paginas<Item>('/api/v1/inventario/items?por_pagina=100&estado=ACTIVO', controller.signal),
      apiFetch('/api/v1/stock/lotes', { signal: controller.signal }).then(async respuesta => {
        if (!respuesta.ok) throw new Error(respuesta.status === 403 ? 'No tienes permiso para consultar inventario.' : 'No se pudieron consultar las existencias.');
        const cuerpo = await respuesta.json();
        if (!Array.isArray(cuerpo.data)) throw new Error('El servidor devolvió existencias incompletas.');
        return cuerpo.data as Existencia[];
      }),
    ]).then(([items, existencias]) => setInventario({ items, existencias })).catch(error => { if (!controller.signal.aborted) setErrorInventario(error.message); });
    return () => controller.abort();
  }, [revision]);
  const datos = useMemo(() => {
    const hoy = fechaLocal(new Date()); const mes = hoy.slice(0, 7); const desde = new Date(`${hoy}T12:00:00Z`);
    const dias = Array.from({ length: 7 }, (_, i) => { const fecha = new Date(desde); fecha.setUTCDate(fecha.getUTCDate() - (6 - i)); return { fecha: fecha.toISOString().slice(0, 10), total: 0 }; });
    const ranking = new Map<string, { nombre: string; cantidad: number; total: number }>(); let ventasHoy = 0; let ingresosMes = 0;
    for (const venta of ventas ?? []) {
      if (!venta.cobrada_en) continue;
      const instante = new Date(venta.cobrada_en); if (Number.isNaN(instante.getTime())) continue;
      const fecha = fechaLocal(instante); const centavos = Math.round(Number(venta.total) * 100);
      if (fecha === hoy) ventasHoy++; if (fecha.startsWith(mes)) ingresosMes += centavos;
      const dia = dias.find(item => item.fecha === fecha); if (dia) dia.total += centavos;
      for (const detalle of venta.detalles ?? []) {
        const clave = `${detalle.tipo_item || ''}|${detalle.codigo_item || detalle.nombre_item}`;
        const actual = ranking.get(clave) ?? { nombre: detalle.nombre_item, cantidad: 0, total: 0 };
        actual.cantidad += Number(detalle.cantidad); actual.total += Math.round(Number(detalle.total) * 100); ranking.set(clave, actual);
      }
    }
    const stock = new Map<number, number>();
    for (const fila of inventario?.existencias ?? []) stock.set(fila.itemId, (stock.get(fila.itemId) ?? 0) + Number(fila.disponible));
    const agotados = (inventario?.items ?? []).filter(item => (stock.get(item.id) ?? 0) <= 0);
    return { hoy, dias, ventasHoy, ingresosMes, ranking: [...ranking.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 5), agotados };
  }, [ventas, inventario]);
  const maximo = Math.max(1, ...datos.dias.map(dia => dia.total));
  const accesos = [['ventas', 'cart', 'Nueva venta'], ['inventario', 'plus', 'Crear producto'], ['inventario', 'package', 'Inventario'], ['ventas', 'fileText', 'Gestión ventas'], ['usuarios', 'users', 'Usuarios']] as const;
  const metricas = [
    { label: 'Productos e insumos', value: inventario ? String(inventario.items.length) : '—', note: errorInventario || (inventario ? 'Ítems activos accesibles' : 'Cargando inventario…'), icon: 'package' as const },
    { label: 'Ventas de hoy', value: ventas ? String(datos.ventasHoy) : '—', note: errorVentas || (ventas ? 'Ventas completadas' : 'Cargando ventas…'), icon: 'fileText' as const },
    { label: 'Ingresos del mes', value: ventas ? dinero(datos.ingresosMes / 100) : '—', note: ventas ? `Promedio diario ${dinero(datos.ingresosMes / 100 / Number(datos.hoy.slice(-2)))}` : errorVentas || 'Cargando ventas…', icon: 'cash' as const },
    { label: 'Productos agotados', value: inventario ? String(datos.agotados.length) : '—', note: errorInventario || (inventario ? 'Sin existencias en almacenes accesibles' : 'Cargando existencias…'), icon: 'audit' as const },
  ];
  return <section className="dashboard-contable">
    {(errorVentas || errorInventario) && <p role="alert">Algunos datos no están disponibles. <button type="button" onClick={() => setRevision(valor => valor + 1)}>Reintentar</button></p>}
    <section className="dashboard-metricas">{metricas.map(item => <article key={item.label}><div><span>{item.label}</span><Icon name={item.icon} size={25}/></div><strong>{item.value}</strong><small>{item.note}</small></article>)}</section>
    <nav className="dashboard-accesos" aria-label="Accesos rápidos">{accesos.map(([id, icon, label]) => <button key={label} type="button" onClick={() => onSelect(id)}><Icon name={icon} size={19}/><strong>{label}</strong></button>)}</nav>
    <div className="dashboard-detalle">
      <section className="dashboard-panel dashboard-indice"><header><div><h3>Índice de ventas</h3><p>Importe de ventas completadas en los últimos 7 días</p></div><Icon name="audit" size={22}/></header>{ventas ? <div className="dashboard-barras">{datos.dias.map(dia => <div key={dia.fecha}><i><b style={{ height: `${dia.total ? Math.max(5, dia.total / maximo * 100) : 0}%` }}/></i><strong>{diaTexto(dia.fecha)}</strong><small>{dinero(dia.total / 100)}</small></div>)}</div> : <p>{errorVentas || 'Cargando ventas…'}</p>}</section>
      <section className="dashboard-panel"><header><div><h3>Servicios y productos más vendidos</h3><p>Ranking histórico por cantidad vendida</p></div></header><div className="dashboard-ranking">{ventas ? datos.ranking.length ? datos.ranking.map((item, indice) => <article key={`${item.nombre}-${indice}`}><b>{indice + 1}</b><div><strong>{item.nombre}</strong><small>{item.cantidad.toLocaleString('es-BO')} unidades · {dinero(item.total / 100)}</small></div></article>) : <p>Sin ventas registradas.</p> : <p>{errorVentas || 'Cargando ventas…'}</p>}</div></section>
      <section className="dashboard-panel dashboard-estado"><header className="dashboard-stock-cabecera"><div><h3>Stock para revisar</h3><p>Productos e insumos sin existencias en almacenes accesibles</p></div>{inventario && <strong className="dashboard-stock-total">{datos.agotados.length} agotados</strong>}</header>{inventario ? datos.agotados.length ? <><ul className="dashboard-stock-lista">{datos.agotados.slice(0, 5).map(item => <li key={item.id}><span className="dashboard-stock-icono"><Icon name="package" size={16}/></span><strong>{item.nombre_comercial}</strong><span className="dashboard-stock-insignia">Agotado</span></li>)}</ul><button className="dashboard-stock-enlace" type="button" onClick={() => onSelect('inventario')}>Ver inventario <span aria-hidden="true">→</span></button></> : <div className="dashboard-stock-vacio">No hay ítems agotados.</div> : <div className="dashboard-stock-vacio">{errorInventario || 'Cargando inventario…'}</div>}</section>
      <section className="dashboard-panel dashboard-ventas-recientes"><h3>Ventas recientes</h3><p>Últimas ventas completadas</p>{ventas ? ventas.length ? ventas.slice(0, 5).map(venta => <article key={venta.id}><div><strong>{venta.codigo}</strong><small>{venta.cliente?.nombre_razon_social || 'Cliente no registrado'}</small></div><b>{dinero(Number(venta.total))}</b></article>) : <p>Sin ventas registradas.</p> : <p>{errorVentas || 'Cargando ventas…'}</p>}</section>
    </div>
  </section>;
}
