import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '@ui/auth';
import { leerRespuesta } from '../../usuarios/accesos';
import Icon from '@ui/components/Icon';
import PaginacionTabla from '@ui/components/PaginacionTabla';
import { MovimientosNavegacion, type SubvistaAdquisiciones } from '../componentes/MovimientosNavegacion';

type Lote = { id: number; numero: string; vencimiento: string | null; precio_1: string; precio_2: string; precio_3: string };
type Item = { itemId: number; codigo: string; nombre: string; grupoId: number; codigoGenerico: string; generico: string; categoria: string; unidadMedida: string; marca: string; presentacion: string; precio1: string; precio2: string; precio3: string; lotes: Lote[] };
type Almacen = { id: number; nombre: string; codigo: string; sucursal: { id: number; nombre: string } };
type Opciones = { items: Item[]; almacenes: Almacen[]; sucursales: { id: number; nombre: string }[] };
type Linea = { id: string; itemId: number; codigo: string; producto: string; categoria: string; marca: string; lote: string; cantidad: number; unidad: string; costoUnitario: number; vence: string; observacion: string; precio1: string; precio2: string; precio3: string; subtotal?: string };
type Ingreso = { id: string; fecha: string; proveedor: string; comprobante: string; almacenId: number; almacen: string; total: string; lineas: Linea[] };
const lineaInicial = { itemId: '', lote: '', cantidad: '', costoUnitario: '', vence: '', observacion: '', precio1: '', precio2: '', precio3: '' };
const moneda = (valor: string | number, decimales = 2) => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 2, maximumFractionDigits: decimales }).format(Number(valor));
const normalizar = (valor: string) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
const hoy = () => { const fecha = new Date(); return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`; };

export function AdquisicionesView({ activeId, administraCatalogo = false }: { activeId?: string; administraCatalogo?: boolean }) {
  const resolver = (id?: string): SubvistaAdquisiciones => id === 'adquisiciones-comprobante' ? 'comprobante' : 'cargado';
  const [subvista, setSubvista] = useState(() => resolver(activeId));
  const [registros, setRegistros] = useState<Ingreso[]>([]);
  const [opciones, setOpciones] = useState<Opciones>({ items: [], almacenes: [], sucursales: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [almacenFiltro, setAlmacenFiltro] = useState('');
  const [filas, setFilas] = useState(20);
  const [pagina, setPagina] = useState(1);
  const [modal, setModal] = useState<'crear' | 'detalle' | null>(null);
  const [detalle, setDetalle] = useState<Ingreso | null>(null);
  const [cabecera, setCabecera] = useState({ fecha: hoy(), proveedor: '', comprobante: '', almacen_id: '' });
  const [sucursalDestino, setSucursalDestino] = useState('');
  const [linea, setLinea] = useState(lineaInicial);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [grupoId, setGrupoId] = useState('');
  const [modoLote, setModoLote] = useState<'nuevo' | 'existente'>('nuevo');
  const [errorModal, setErrorModal] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [nuevoAlmacen, setNuevoAlmacen] = useState(false);
  const [formAlmacen, setFormAlmacen] = useState({ nombre: '', codigo: '', sucursal_id: '' });
  const [guardandoAlmacen, setGuardandoAlmacen] = useState(false);
  const [estudios, setEstudios] = useState<{ codigo: string; nombre: string; stock: number }[]>([]);
  const [errorEstudios, setErrorEstudios] = useState('');
  const [cargandoEstudios, setCargandoEstudios] = useState(false);
  const [umbral, setUmbral] = useState(10);
  const solicitudId = useRef('');
  const bloqueoEnvio = useRef(false);
  const envioPendiente = useRef<string | null>(null);
  const [pendiente, setPendiente] = useState(false);
  const dialogo = useRef<HTMLElement>(null);
  const origen = useRef<HTMLElement | null>(null);

  useEffect(() => setSubvista(resolver(activeId)), [activeId]);
  useEffect(() => {
    const controller = new AbortController(); setCargando(true); setError('');
    Promise.all([
      apiFetch('/api/v1/adquisiciones', { signal: controller.signal }).then(leerRespuesta<{ data: Ingreso[] }>),
      apiFetch('/api/v1/adquisiciones/opciones', { signal: controller.signal }).then(leerRespuesta<{ data: Opciones }>),
    ]).then(([ingresos, catalogo]) => { setRegistros(ingresos.data); setOpciones(catalogo.data); })
      .catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [recarga]);
  useEffect(() => {
    if (subvista !== 'comprobante') return;
    const controller = new AbortController(); setCargandoEstudios(true); setErrorEstudios('');
    apiFetch('/api/v1/stock/estudios', { signal: controller.signal }).then(leerRespuesta<{ data: typeof estudios }>)
      .then(({ data }) => setEstudios(data)).catch(error => { if (!controller.signal.aborted) setErrorEstudios(error.message); })
      .finally(() => { if (!controller.signal.aborted) setCargandoEstudios(false); });
    return () => controller.abort();
  }, [subvista, recarga]);
  useEffect(() => setPagina(1), [busqueda, desde, hasta, almacenFiltro, filas]);
  useEffect(() => {
    if (!modal) return;
    dialogo.current?.querySelector<HTMLElement>('button, input, select')?.focus();
    const contenedor = document.querySelector('.sistema-contable') || document.body;
    const elementos = Array.from(contenedor.children).filter((el): el is HTMLElement => el instanceof HTMLElement && !el.contains(dialogo.current));
    const estados = elementos.map(el => el.inert); elementos.forEach(el => { el.inert = true; });
    const scroll = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { elementos.forEach((el, i) => { el.inert = estados[i]; }); document.body.style.overflow = scroll; };
  }, [!!modal]);
  const item = opciones.items.find(item => String(item.itemId) === linea.itemId);
  const grupos = [...new Map(opciones.items.map(i => [i.grupoId, { id: i.grupoId, codigo: i.codigoGenerico, nombre: i.generico }])).values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const productosGrupo = opciones.items.filter(i => String(i.grupoId) === grupoId);
  const almacenesDestino = opciones.almacenes.filter(a => String(a.sucursal.id) === sucursalDestino);
  const loteExistente = item?.lotes.find(lote => normalizar(lote.numero) === normalizar(linea.lote));
  const filtrados = useMemo(() => registros.filter(registro => (!desde || registro.fecha >= desde) && (!hasta || registro.fecha <= hasta)
    && (!almacenFiltro || String(registro.almacenId) === almacenFiltro)
    && [registro.id, registro.proveedor, registro.comprobante, registro.almacen, ...registro.lineas.flatMap(linea => [linea.codigo, linea.producto, linea.marca, linea.lote])].some(valor => normalizar(valor).includes(normalizar(busqueda)))), [registros, desde, hasta, almacenFiltro, busqueda]);
  const paginas = Math.max(1, Math.ceil(filtrados.length / filas));
  const paginaActual = Math.min(pagina, paginas);
  const almacenesFiltro = [...new Map([...opciones.almacenes.map(a => [a.id, `${a.sucursal.nombre} - ${a.nombre}`] as const), ...registros.map(r => [r.almacenId, r.almacen] as const)]).entries()];
  function cerrar() { if (guardando || guardandoAlmacen) return; setModal(null); requestAnimationFrame(() => origen.current?.focus()); }
  function abrir(boton: HTMLElement, registro?: Ingreso) {
    origen.current = boton; setErrorModal(''); setMensaje('');
    if (registro) { setDetalle(registro); setModal('detalle'); return; }
    solicitudId.current = crypto.randomUUID(); envioPendiente.current = null; setPendiente(false);
    setCabecera({ fecha: hoy(), proveedor: '', comprobante: '', almacen_id: String(opciones.almacenes[0]?.id ?? '') });
    setSucursalDestino(String(opciones.almacenes[0]?.sucursal.id ?? opciones.sucursales[0]?.id ?? ''));
    setLinea(lineaInicial); setLineas([]); setEditando(null); setGrupoId(''); setModoLote('nuevo'); setNuevoAlmacen(false); setModal('crear');
  }
  function cambiarItem(id: string) {
    const seleccionado = opciones.items.find(item => String(item.itemId) === id);
    setModoLote(seleccionado?.lotes.length ? 'existente' : 'nuevo');
    setLinea({ ...lineaInicial, itemId: id, precio1: seleccionado?.precio1 ?? '', precio2: seleccionado?.precio2 ?? '', precio3: seleccionado?.precio3 ?? '' });
  }
  function cambiarLote(numero: string) {
    const lote = item?.lotes.find(l => normalizar(l.numero) === normalizar(numero));
    setLinea(actual => ({ ...actual, lote: numero, ...(lote ? { vence: lote.vencimiento ?? '', precio1: lote.precio_1, precio2: lote.precio_2, precio3: lote.precio_3 } : {}) }));
  }
  function agregar(event: FormEvent) {
    event.preventDefault(); if (!item) return;
    if (modoLote === 'nuevo' && loteExistente) { setErrorModal('Este lote ya existe. Elige Recibir lote existente para agregarle stock.'); return; }
    if (lineas.some(l => l.id !== editando && l.itemId === item.itemId && normalizar(l.lote) === normalizar(linea.lote))) { setErrorModal('Este ítem y lote ya está en el ingreso. Edita su cantidad.'); return; }
    const nueva: Linea = { ...linea, id: editando ?? crypto.randomUUID(), itemId: item.itemId, codigo: item.codigo, producto: item.nombre, categoria: item.categoria, marca: item.marca,
      lote: linea.lote.trim(), cantidad: Number(linea.cantidad), costoUnitario: Number(linea.costoUnitario), unidad: item.unidadMedida };
    setLineas(actuales => editando ? actuales.map(l => l.id === editando ? nueva : l) : [...actuales, nueva]);
    setLinea(lineaInicial); setEditando(null); setErrorModal('');
  }
  async function guardar(event: FormEvent) {
    event.preventDefault(); if (bloqueoEnvio.current || !lineas.length || editando) return;
    bloqueoEnvio.current = true; setGuardando(true); setErrorModal('');
    const body = envioPendiente.current ?? JSON.stringify({ ...cabecera, almacen_id: Number(cabecera.almacen_id), solicitud_id: solicitudId.current,
      lineas: lineas.map(l => ({ item_id: l.itemId, lote: l.lote, cantidad: l.cantidad, costoUnitario: l.costoUnitario, vence: l.vence || null, observacion: l.observacion, precio1: l.precio1, precio2: l.precio2, precio3: l.precio3 })) });
    envioPendiente.current = body;
    try {
      const respuesta = await apiFetch('/api/v1/adquisiciones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      if (respuesta.status === 422) { envioPendiente.current = null; setPendiente(false); }
      const resultado = await leerRespuesta<{ data: Ingreso }>(respuesta);
      setRegistros(actual => [resultado.data, ...actual.filter(r => r.id !== resultado.data.id)]);
      setMensaje(`Ingreso ${resultado.data.id} registrado. Las existencias fueron actualizadas.`);
      setModal(null); setRecarga(v => v + 1); requestAnimationFrame(() => origen.current?.focus());
    } catch (error) { setErrorModal(error instanceof Error ? error.message : 'No se pudo guardar el ingreso.'); setPendiente(Boolean(envioPendiente.current)); }
    finally { bloqueoEnvio.current = false; setGuardando(false); }
  }
  async function guardarAlmacen(event: FormEvent) {
    event.preventDefault(); if (guardandoAlmacen) return; setGuardandoAlmacen(true); setErrorModal('');
    try {
      const { data } = await leerRespuesta<{ data: Almacen }>(await apiFetch('/api/v1/adquisiciones/almacenes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formAlmacen, sucursal_id: formAlmacen.sucursal_id ? Number(formAlmacen.sucursal_id) : null }) }));
      setOpciones(actual => ({ ...actual, almacenes: [...actual.almacenes, data], sucursales: actual.sucursales.some(s => s.id === data.sucursal.id) ? actual.sucursales : [...actual.sucursales, data.sucursal] }));
      setSucursalDestino(String(data.sucursal.id));
      setCabecera(actual => ({ ...actual, almacen_id: String(data.id) })); setNuevoAlmacen(false); setFormAlmacen({ nombre: '', codigo: '', sucursal_id: '' });
    } catch (error) { setErrorModal(error instanceof Error ? error.message : 'No se pudo registrar el almacén.'); }
    finally { setGuardandoAlmacen(false); }
  }
  const totalProvisional = lineas.reduce((total, l) => total + Math.round((l.cantidad * l.costoUnitario + Number.EPSILON) * 100), 0) / 100;
  const visible = modal === 'detalle' ? detalle?.lineas ?? [] : lineas;
  return <>
    <MovimientosNavegacion activa={subvista} onSeleccionar={setSubvista} />
    <div className="movimientos-contenido adquisiciones-contenido">
      {mensaje && <p role="status">{mensaje}</p>}
      {subvista === 'cargado' ? <>
        {error && <div role="alert">{error} <button type="button" onClick={() => setRecarga(v => v + 1)}>Reintentar</button></div>}
        <div className="adquisiciones-controles"><div className="adquisiciones-filtros">
          <label className="adquisiciones-filtro-busqueda"><Icon name="search" size={17} /><input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar registro, producto, proveedor o lote" aria-label="Buscar cargas de stock" /></label>
          <label className="adquisiciones-filtro-campo"><span>Desde</span><input type="date" value={desde} max={hasta || undefined} onChange={e => setDesde(e.target.value)} /></label>
          <label className="adquisiciones-filtro-campo"><span>Hasta</span><input type="date" value={hasta} min={desde || undefined} onChange={e => setHasta(e.target.value)} /></label>
          <label className="adquisiciones-filtro-campo"><span>Almacén</span><select value={almacenFiltro} onChange={e => setAlmacenFiltro(e.target.value)}><option value="">Todos los almacenes</option>{almacenesFiltro.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}</select></label>
          <button className="adquisiciones-cargar" type="button" disabled={cargando || Boolean(error)} onClick={e => abrir(e.currentTarget)}><Icon name="plus" size={17} /> Cargar stock</button>
          <button type="button" disabled={cargando} onClick={() => setRecarga(v => v + 1)}>Actualizar</button>
        </div></div>
        <PaginacionTabla total={filtrados.length} filas={filas} pagina={paginaActual} totalPaginas={paginas} onFilas={setFilas} onPagina={setPagina} />
        <div className="movimientos-tabla adquisiciones-tabla" role="table" aria-label="Notas de ingreso" aria-busy={cargando}>
          <div className="movimientos-tabla-head" role="row">{['Fecha', 'Registro', 'Proveedor', 'Comprobante', 'Productos', 'Costo total', 'Almacén', 'Acciones'].map(t => <span role="columnheader" key={t}>{t}</span>)}</div>
          {!cargando && !error && filtrados.slice((paginaActual - 1) * filas, paginaActual * filas).map(r => <article className="adquisiciones-row" role="row" key={r.id}>
            <span className="adquisiciones-codigo" role="cell">{r.fecha}</span><strong role="cell">{r.id}</strong><span role="cell">{r.proveedor}</span><span className="adquisiciones-chip" role="cell">{r.comprobante || 'Sin comprobante'}</span><span role="cell">{r.lineas.length} artículos</span><span role="cell">{moneda(r.total)}</span><span role="cell">{r.almacen}</span><div className="adquisiciones-acciones" role="cell"><button type="button" onClick={e => abrir(e.currentTarget, r)}><Icon name="eye" size={15} /> Ver detalle</button></div>
          </article>)}
        </div>
        {(cargando || (!error && filtrados.length === 0)) && <p role="status">{cargando ? 'Cargando ingresos…' : registros.length ? 'No hay ingresos con estos filtros.' : 'Todavía no hay notas de ingreso. Registra la primera con Cargar stock.'}</p>}
      </> : <>
        {errorEstudios && <p role="alert">{errorEstudios} <button onClick={() => setRecarga(v => v + 1)}>Reintentar</button></p>}
        <section className="estudio-stock-seccion"><div className="estudio-stock-titulo"><h3>Ítems con stock bajo</h3><label>Stock igual o menor a <input type="number" min="0" step="0.001" value={umbral} onChange={e => setUmbral(Math.max(0, Number(e.target.value)))} /></label></div>
          <div className="estudio-stock-tabla estudio-stock-analisis" role="table" aria-label="Ítems con stock bajo" aria-busy={cargandoEstudios}><div className="estudio-stock-head" role="row"><span role="columnheader">Código</span><span role="columnheader">Ítem</span><span role="columnheader">Stock actual</span></div>
            {!cargandoEstudios && !errorEstudios && estudios.filter(i => i.stock <= umbral).sort((a, b) => a.stock - b.stock).map(i => <div className="estudio-stock-fila" role="row" key={i.codigo}><span role="cell">{i.codigo}</span><span role="cell">{i.nombre}</span><span role="cell">{i.stock.toLocaleString('es-BO')}</span></div>)}
          </div>
          {cargandoEstudios ? <p role="status">Cargando existencias…</p> : !errorEstudios && !estudios.some(i => i.stock <= umbral) && <p>No hay ítems con stock bajo para este límite.</p>}
        </section><p>El análisis de productos más vendidos estará disponible al conectar las salidas de ventas con este inventario.</p>
      </>}
    </div>
    {modal && createPortal(<div className="adquisiciones-modal-fondo" onMouseDown={e => { if (e.target === e.currentTarget) cerrar(); }}>
      <section className="adquisiciones-carga-stock adquisiciones-recepcion-real" ref={dialogo} role="dialog" aria-modal="true" aria-labelledby="ingreso-titulo" onKeyDown={e => {
        if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
        if (e.key === 'Tab') { const elementos = Array.from(dialogo.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]') ?? []).filter(el => el.getClientRects().length); const primero = elementos[0], ultimo = elementos.at(-1); if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo?.focus(); } else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero?.focus(); } }
      }}>
        <header className="adquisiciones-carga-header"><div><span>{modal === 'crear' ? 'Nueva nota de ingreso' : 'Ingreso confirmado'}</span><h2 id="ingreso-titulo">{modal === 'crear' ? 'Cargar stock' : detalle?.id}</h2></div><button type="button" disabled={guardando || guardandoAlmacen} onClick={cerrar} aria-label="Cerrar ingreso"><Icon name="close" size={18} /></button></header>
        {errorModal && <p role="alert">{errorModal}</p>}
        {modal === 'crear' ? <>
          {pendiente && <p role="status">La confirmación está pendiente. Reintenta el mismo ingreso para comprobarlo sin duplicar el stock.</p>}
          <form id="guardar-ingreso" onSubmit={guardar}><fieldset className="adquisiciones-lote-panel" disabled={guardando || pendiente}>
            <label>Sucursal destino<select required value={sucursalDestino} onChange={e => { const id = e.target.value; setSucursalDestino(id); setCabecera(actual => ({ ...actual, almacen_id: String(opciones.almacenes.find(a => String(a.sucursal.id) === id)?.id ?? '') })); }}><option value="">Selecciona una sucursal</option>{opciones.sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></label>
            <label>Almacén destino<select required disabled={!sucursalDestino || !almacenesDestino.length} value={cabecera.almacen_id} onChange={e => setCabecera({ ...cabecera, almacen_id: e.target.value })}><option value="">{sucursalDestino && !almacenesDestino.length ? 'Esta sucursal no tiene almacenes' : 'Selecciona un almacén'}</option>{almacenesDestino.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></label>
            <label>Fecha de recepción<input type="date" required max={hoy()} value={cabecera.fecha} onChange={e => setCabecera({ ...cabecera, fecha: e.target.value })} /></label>
            <label>Proveedor<input required maxLength={200} value={cabecera.proveedor} onChange={e => setCabecera({ ...cabecera, proveedor: e.target.value })} /></label>
            <label>Comprobante<input maxLength={100} placeholder="Factura, recibo o nota" value={cabecera.comprobante} onChange={e => setCabecera({ ...cabecera, comprobante: e.target.value })} /></label>
          </fieldset></form>
          {administraCatalogo && <button type="button" disabled={guardando || pendiente || guardandoAlmacen || !opciones.sucursales.length} aria-expanded={nuevoAlmacen} onClick={() => { setFormAlmacen(actual => ({ ...actual, sucursal_id: actual.sucursal_id || sucursalDestino || String(opciones.sucursales[0]?.id ?? '') })); setNuevoAlmacen(v => !v); }}>{nuevoAlmacen ? 'Cancelar nuevo almacén' : 'Registrar almacén destino'}</button>}
          {!opciones.sucursales.length && <p role="status">Registra una sucursal en Configuración general para recibir stock.</p>}
          {nuevoAlmacen && <form onSubmit={guardarAlmacen}><fieldset className="adquisiciones-lote-panel" disabled={guardandoAlmacen}>
            <label>Sucursal<select required value={formAlmacen.sucursal_id} onChange={e => setFormAlmacen({ ...formAlmacen, sucursal_id: e.target.value })}><option value="">Selecciona una sucursal registrada</option>{opciones.sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></label>
            <label>Nombre del almacén<input required maxLength={150} value={formAlmacen.nombre} onChange={e => setFormAlmacen({ ...formAlmacen, nombre: e.target.value })} /></label>
            <label>Código del almacén<input required maxLength={30} value={formAlmacen.codigo} onChange={e => setFormAlmacen({ ...formAlmacen, codigo: e.target.value })} /></label><button type="submit">{guardandoAlmacen ? 'Guardando…' : 'Guardar almacén'}</button>
          </fieldset></form>}
          <form className="recepcion-editor-lote" onSubmit={agregar}>
            <fieldset className="recepcion-editor-contenido" disabled={guardando || pendiente}>
              <section className="recepcion-producto" aria-labelledby="recepcion-producto-titulo">
                <div className="recepcion-seccion-titulo"><h3 id="recepcion-producto-titulo">Selecciona el producto</h3><p>Selecciona un grupo y elige el producto comercial que estás recibiendo.</p></div>
                {!opciones.items.length && <p role="status">Aún no hay productos disponibles. Registra el grupo en Productos e insumos y su producto comercial en Ítems general.</p>}
                <div className="recepcion-selector-grupo">
                  <label htmlFor="recepcion-grupo">Grupo / genérico</label>
                  <select id="recepcion-grupo" required value={grupoId} onChange={e => { setGrupoId(e.target.value); cambiarItem(''); }}>
                    <option value="">Selecciona un grupo registrado</option>
                    {grupos.map(g => <option key={g.id} value={g.id}>{g.codigo} · {g.nombre} ({opciones.items.filter(i => i.grupoId === g.id).length} productos)</option>)}
                  </select>
                </div>
                <div className="recepcion-selector-producto">
                  <label htmlFor="recepcion-producto">Producto comercial</label>
                  <select id="recepcion-producto" required disabled={!grupoId} value={linea.itemId} onChange={e => cambiarItem(e.target.value)}>
                    <option value="">{grupoId ? 'Selecciona el producto registrado' : 'Primero selecciona un grupo'}</option>
                    {productosGrupo.map(i => <option key={i.itemId} value={i.itemId}>{i.codigo} · {i.nombre} · {i.marca} · {i.presentacion}</option>)}
                  </select>
                  {grupoId && !productosGrupo.length && <p role="status">No hay productos registrados en este grupo.</p>}
                </div>
                {item && <div className="recepcion-producto-ficha"><div><Icon name="package" size={21} /><div><strong>{item.nombre}</strong><span>{item.codigo}</span></div></div><dl>
                  <div><dt>Marca</dt><dd>{item.marca || 'Sin marca'}</dd></div><div><dt>Presentación</dt><dd>{item.presentacion || 'Sin presentación'}</dd></div><div><dt>Unidad</dt><dd>{item.unidadMedida}</dd></div><div><dt>Categoría</dt><dd>{item.categoria}</dd></div>
                </dl></div>}
              </section>
              <fieldset className="recepcion-datos-lote" disabled={!item}>
                <legend>Datos del lote</legend>
                <div className="recepcion-modo-lote" role="radiogroup" aria-label="Tipo de recepción del lote">
                  <label><input type="radio" name="modo-lote" value="nuevo" checked={modoLote === 'nuevo'} onChange={() => { setModoLote('nuevo'); setLinea(actual => ({ ...actual, lote: '', vence: '', precio1: item?.precio1 ?? '', precio2: item?.precio2 ?? '', precio3: item?.precio3 ?? '' })); }} />Registrar lote nuevo</label>
                  <label><input type="radio" name="modo-lote" value="existente" disabled={!item?.lotes.length} checked={modoLote === 'existente'} onChange={() => { setModoLote('existente'); setLinea(actual => ({ ...actual, lote: '', vence: '' })); }} />Recibir lote existente{item ? ` (${item.lotes.length})` : ''}</label>
                </div>
                <div className="recepcion-campos-lote">
                  <label>{modoLote === 'nuevo' ? 'Número de lote' : 'Lote registrado'}{modoLote === 'nuevo'
                    ? <input required maxLength={100} placeholder="Ej. LT-2026-001" value={linea.lote} onChange={e => setLinea({ ...linea, lote: e.target.value })} />
                    : <select required aria-label="Lote registrado" value={linea.lote} onChange={e => cambiarLote(e.target.value)}><option value="">Selecciona un lote</option>{item?.lotes.map(l => <option key={l.id} value={l.numero}>{l.numero}{l.vencimiento ? ` · Vence ${l.vencimiento}` : ' · Sin vencimiento'}</option>)}</select>}
                  </label>
                  <label>Vencimiento<input type="date" readOnly={modoLote === 'existente'} value={linea.vence} onChange={e => setLinea({ ...linea, vence: e.target.value })} /></label>
                  <label>Cantidad a recibir{item && <small>En {item.unidadMedida.toLocaleLowerCase('es')}</small>}<input required type="number" min="0.001" max="100000" step="0.001" placeholder="0" value={linea.cantidad} onChange={e => setLinea({ ...linea, cantidad: e.target.value })} /></label>
                  <label>Costo por unidad (Bs)<input required type="number" min="0" max="100000" step="0.0001" placeholder="0.00" value={linea.costoUnitario} onChange={e => setLinea({ ...linea, costoUnitario: e.target.value })} /></label>
                </div>
                {modoLote === 'existente' && linea.lote && <p className="recepcion-ayuda">Se sumará la cantidad recibida al lote seleccionado. Su vencimiento se conserva.</p>}
                {modoLote === 'nuevo' && loteExistente && <p role="alert">Este número de lote ya está registrado para el producto. Selecciona Recibir lote existente.</p>}
              </fieldset>
              <fieldset className="recepcion-precios" disabled={!item}>
                <legend>Precios de venta del lote</legend>
                <p>Ingresa los tres precios manualmente. Puedes ajustar los valores de referencia.</p>
                <div className="recepcion-campos-precios">{(['precio1', 'precio2', 'precio3'] as const).map((campo, indice) => <label key={campo}>Precio {indice + 1} (Bs)<input type="number" required min="0" max="9999999999.99" step="0.01" placeholder="0.00" value={linea[campo]} onChange={e => setLinea({ ...linea, [campo]: e.target.value })} /></label>)}</div>
                <label className="recepcion-observacion">Observación <small>Opcional</small><input maxLength={1000} placeholder="Estado del empaque u otra nota de recepción" value={linea.observacion} onChange={e => setLinea({ ...linea, observacion: e.target.value })} /></label>
              </fieldset>
              <div className="recepcion-agregar-resumen"><div><span>Subtotal del lote</span><strong>{moneda(Math.round((Number(linea.cantidad) * Number(linea.costoUnitario) + Number.EPSILON) * 100) / 100)}</strong></div><div>
                {editando && <button type="button" onClick={() => { setEditando(null); setLinea(lineaInicial); }}>Cancelar edición</button>}
                <button className="adquisiciones-agregar-linea" type="submit" disabled={!item || (modoLote === 'nuevo' && Boolean(loteExistente))}><Icon name={editando ? 'check' : 'plus'} size={16} />{editando ? 'Actualizar lote' : 'Agregar lote al ingreso'}</button>
              </div></div>
            </fieldset>
          </form>
        </> : <div className="adquisiciones-detalle-resumen"><div><small>Fecha</small><strong>{detalle?.fecha}</strong></div><div><small>Almacén</small><strong>{detalle?.almacen}</strong></div><div><small>Proveedor</small><strong>{detalle?.proveedor}</strong></div><div><small>Comprobante</small><strong>{detalle?.comprobante || 'Sin comprobante'}</strong></div></div>}
        {modal === 'crear' && <h3 className="adquisiciones-carga-seccion">Lotes agregados ({lineas.length})</h3>}
        <div className="adquisiciones-recepcion-lineas">
          {visible.length === 0 && <p>Los lotes que agregues aparecerán aquí. Después podrás confirmar el ingreso completo.</p>}
          {visible.map(l => <article key={l.id}><div><strong>{l.codigo} · {l.producto}</strong><p>{l.marca} · Lote {l.lote} · Vence: {l.vence || 'Sin vencimiento'}</p><p>{l.cantidad} {l.unidad} × {moneda(l.costoUnitario, 4)} · Subtotal: {moneda(l.subtotal ?? l.cantidad * l.costoUnitario)}</p><p>Precio 1: {moneda(l.precio1)} · Precio 2: {moneda(l.precio2)} · Precio 3: {moneda(l.precio3)}</p>{l.observacion && <p>{l.observacion}</p>}</div>
            {modal === 'crear' && <div className="adquisiciones-linea-acciones"><button type="button" disabled={guardando || pendiente} onClick={() => { setEditando(l.id); const producto = opciones.items.find(i => i.itemId === l.itemId); setGrupoId(String(producto?.grupoId ?? '')); setModoLote(producto?.lotes.some(lote => normalizar(lote.numero) === normalizar(l.lote)) ? 'existente' : 'nuevo'); setLinea({ ...l, itemId: String(l.itemId), cantidad: String(l.cantidad), costoUnitario: String(l.costoUnitario) }); }}>Editar</button><button type="button" disabled={guardando || pendiente} onClick={() => { setLineas(actual => actual.filter(i => i.id !== l.id)); if (editando === l.id) { setEditando(null); setLinea(lineaInicial); } }}>Quitar</button></div>}
          </article>)}
        </div>
        <div className="adquisiciones-detalle-total">Total: <strong>{moneda(modal === 'detalle' ? detalle?.total ?? 0 : totalProvisional)}</strong></div>
        <footer className="adquisiciones-carga-footer"><button type="button" disabled={guardando || guardandoAlmacen} onClick={cerrar}>{modal === 'crear' ? 'Cancelar' : 'Cerrar'}</button>{modal === 'detalle' && <button type="button" onClick={() => window.print()}>Imprimir</button>}{modal === 'crear' && <button type="submit" form="guardar-ingreso" className="adquisiciones-cargar" disabled={guardando || guardandoAlmacen || nuevoAlmacen || !cabecera.almacen_id || !lineas.length || Boolean(editando)}>{guardando ? 'Guardando ingreso…' : pendiente ? 'Reintentar confirmación' : 'Guardar registro'}</button>}</footer>
      </section>
    </div>, document.querySelector('.sistema-contable') || document.body)}
  </>;
}
