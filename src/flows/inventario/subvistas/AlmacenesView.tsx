import { useEffect, useMemo, useState } from 'react';
import Icon from '@ui/components/Icon';
import { apiFetch } from '@ui/auth';
import { leerRespuesta } from '../../usuarios/accesos';
import './AlmacenesListado.css';

type Almacen = { id: number; nombre: string; codigo: string; sucursalId: number; tiposItem: string[]; estado: 'Activo' | 'Inactivo' };
type Sucursal = { id: number; nombre: string; estado: 'Activa' | 'Inactiva' };
type Orden = 'nombre' | 'codigo' | 'sucursal' | 'estado';
const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');

export function AlmacenesView() {
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [sucursal, setSucursal] = useState('todas');
  const [estado, setEstado] = useState('todos');
  const [orden, setOrden] = useState<Orden>('nombre');
  const [direccion, setDireccion] = useState<'asc' | 'desc'>('asc');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setError('');
    apiFetch('/api/v1/configuracion/general', { signal: controller.signal })
      .then(leerRespuesta<{ data: { almacenes: Almacen[]; sucursales: Sucursal[] } }>)
      .then(({ data }) => {
        if (!controller.signal.aborted) {
          setAlmacenes(data.almacenes);
          setSucursales(data.sucursales);
        }
      })
      .catch((causa) => { if (!controller.signal.aborted) setError(causa instanceof Error ? causa.message : 'No se pudieron cargar los almacenes.'); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [recarga]);

  const nombreSucursal = (id: number) => sucursales.find((item) => item.id === id)?.nombre || 'Sin sucursal';
  const visibles = useMemo(() => almacenes.filter((item) => {
    const consulta = normalizar(busqueda.trim());
    return (sucursal === 'todas' || String(item.sucursalId) === sucursal)
      && (estado === 'todos' || item.estado.toLocaleLowerCase('es') === estado)
      && (!consulta || normalizar(`${item.codigo} ${item.nombre} ${nombreSucursal(item.sucursalId)} ${item.tiposItem.join(' ')}`).includes(consulta));
  }).sort((a, b) => {
    const aValor = orden === 'sucursal' ? nombreSucursal(a.sucursalId) : a[orden];
    const bValor = orden === 'sucursal' ? nombreSucursal(b.sucursalId) : b[orden];
    return String(aValor).localeCompare(String(bValor), 'es', { numeric: true }) * (direccion === 'asc' ? 1 : -1);
  }), [almacenes, busqueda, estado, sucursal, orden, direccion, sucursales]);
  const activos = almacenes.filter((item) => item.estado === 'Activo').length;
  const inactivos = almacenes.length - activos;
  const sucursalesConAlmacen = new Set(almacenes.map((item) => item.sucursalId)).size;

  return <section className="almacenes-listado" aria-label="Almacenes registrados">
    <div className="almacenes-listado-resumen">
      <article><span><Icon name="building" size={17} /></span><div><small>Almacenes</small><strong>{cargando ? '—' : almacenes.length}</strong></div></article>
      <article><span className="estado-activo"><Icon name="check" size={17} /></span><div><small>Activos</small><strong>{cargando ? '—' : activos}</strong></div></article>
      <article><span className="estado-inactivo"><Icon name="close" size={17} /></span><div><small>Inactivos</small><strong>{cargando ? '—' : inactivos}</strong></div></article>
      <article><span><Icon name="building" size={17} /></span><div><small>Sucursales con almacén</small><strong>{cargando ? '—' : sucursalesConAlmacen}</strong></div></article>
    </div>
    <div className="almacenes-listado-filtros">
      <label className="almacenes-busqueda"><Icon name="search" size={17} /><input type="search" aria-label="Buscar almacén" placeholder="Buscar por código, nombre, sucursal o tipo de ítem" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} /></label>
      <select aria-label="Filtrar por sucursal" value={sucursal} onChange={(event) => setSucursal(event.target.value)}><option value="todas">Todas las sucursales</option>{sucursales.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select>
      <select aria-label="Filtrar por estado" value={estado} onChange={(event) => setEstado(event.target.value)}><option value="todos">Todos los estados</option><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select>
      <select aria-label="Ordenar almacenes" value={orden} onChange={(event) => setOrden(event.target.value as Orden)}><option value="nombre">Ordenar por nombre</option><option value="codigo">Ordenar por código</option><option value="sucursal">Ordenar por sucursal</option><option value="estado">Ordenar por estado</option></select>
      <button className="almacenes-direccion" type="button" onClick={() => setDireccion((actual) => actual === 'asc' ? 'desc' : 'asc')} aria-label={direccion === 'asc' ? 'Orden ascendente; cambiar a descendente' : 'Orden descendente; cambiar a ascendente'}>{direccion === 'asc' ? 'Ascendente' : 'Descendente'} <Icon name="chevronDown" size={15} /></button>
      <button className="almacenes-actualizar" type="button" disabled={cargando} onClick={() => setRecarga((actual) => actual + 1)}>{cargando ? 'Cargando…' : 'Actualizar'}</button>
    </div>
    {error && <div className="almacenes-error" role="alert"><span>{error}</span><button type="button" onClick={() => setRecarga((actual) => actual + 1)}>Reintentar</button></div>}
    <div className="almacenes-listado-meta"><strong>{cargando ? 'Cargando almacenes…' : `${visibles.length} de ${almacenes.length} almacenes`}</strong><span>La administración y creación se realiza desde Sucursales y cajas.</span></div>
    <div className="almacenes-tabla-scroll" aria-busy={cargando}>
      <table><thead><tr><th scope="col">Código</th><th scope="col">Almacén</th><th scope="col">Sucursal</th><th scope="col">Tipos habilitados</th><th scope="col">Estado</th></tr></thead>
        <tbody>{visibles.map((item) => <tr key={item.id}><td><strong className="almacen-codigo">{item.codigo}</strong></td><td><strong>{item.nombre}</strong></td><td>{nombreSucursal(item.sucursalId)}</td><td><div className="almacen-tipos">{item.tiposItem.map((tipo) => <span key={tipo}>{tipo}</span>)}</div></td><td><span className={`almacen-estado ${item.estado === 'Activo' ? 'activo' : 'inactivo'}`}>{item.estado}</span></td></tr>)}</tbody>
      </table>
      {cargando && <p className="almacenes-vacio" role="status">Consultando almacenes…</p>}
      {!cargando && !error && !visibles.length && <div className="almacenes-vacio" role="status"><Icon name="building" size={25} /><strong>{almacenes.length ? 'No hay almacenes coincidentes' : 'Todavía no hay almacenes registrados'}</strong><span>{almacenes.length ? 'Prueba cambiando la búsqueda o los filtros.' : 'Los almacenes disponibles aparecerán aquí cuando se registren en Sucursales y cajas.'}</span></div>}
    </div>
  </section>;
}
