import { useEffect, useRef, useState, type FormEvent } from 'react';
import { apiFetch } from '@ui/auth';
import { leerRespuesta } from '../../usuarios/accesos';

type Opcion = { id: string; nombre: string; activo: boolean; tipo_base?: string; categoria_id?: string };
type Catalogos = { tipos: Opcion[]; categorias: Opcion[]; subcategorias: Opcion[]; clasificaciones: Opcion[] };
type Producto = { id: number; codigo: string; nombre: string; descripcion: string | null; estado: string; tipo_id: string; categoria_id: string | null; subcategoria_id: string | null; clasificacion_id: string | null; tipo: Opcion; categoria: Opcion | null; subcategoria: Opcion | null; clasificacion: Opcion | null };
type Pagina = { data: Producto[]; total: number; current_page: number; last_page: number; from: number | null; to: number | null };
const vacio = { nombre: '', descripcion: '', tipo_id: '', categoria_id: '', subcategoria_id: '', clasificacion_id: '', estado: 'ACTIVO' };
const catalogosVacios: Catalogos = { tipos: [], categorias: [], subcategorias: [], clasificaciones: [] };

export function ProductosInsumosView({ puedeGestionar = false }: { puedeGestionar?: boolean }) {
  const [catalogos, setCatalogos] = useState<Catalogos>(catalogosVacios);
  const [pagina, setPagina] = useState<Pagina>({ data: [], total: 0, current_page: 1, last_page: 1, from: null, to: null });
  const [buscar, setBuscar] = useState('');
  const [categoria, setCategoria] = useState('');
  const [estado, setEstado] = useState('');
  const [orden, setOrden] = useState('nombre');
  const [direccion, setDireccion] = useState('asc');
  const [filas, setFilas] = useState(20);
  const [numeroPagina, setNumeroPagina] = useState(1);
  const [recarga, setRecarga] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [catalogosListos, setCatalogosListos] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modal, setModal] = useState<'crear' | 'editar' | 'ver' | null>(null);
  const [seleccionado, setSeleccionado] = useState<Producto | null>(null);
  const [formulario, setFormulario] = useState(vacio);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState('');
  const dialogo = useRef<HTMLDivElement>(null);
  const origen = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setCatalogosListos(false);
    apiFetch('/api/v1/inventario/configuracion', { signal: controller.signal }).then(leerRespuesta<{ data: Catalogos }>).then(respuesta => {
      setCatalogos(respuesta.data); setCatalogosListos(true);
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [recarga]);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true); setError('');
    const timer = window.setTimeout(() => {
      const parametros = new URLSearchParams({ buscar, categoria_id: categoria, estado, orden, direccion, page: String(numeroPagina), por_pagina: String(filas) });
      apiFetch('/api/v1/inventario/productos-base?' + parametros, { signal: controller.signal }).then(leerRespuesta<Pagina>).then(setPagina)
        .catch(error => { if (!controller.signal.aborted) setError(error.message); })
        .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [buscar, categoria, estado, orden, direccion, numeroPagina, filas, recarga]);

  useEffect(() => {
    if (modal) (dialogo.current?.querySelector<HTMLElement>('input:enabled') || dialogo.current?.querySelector<HTMLElement>('button:enabled'))?.focus();
  }, [modal]);

  function abrir(modo: 'crear' | 'editar' | 'ver', boton: HTMLElement, producto: Producto | null = null) {
    origen.current = boton; setSeleccionado(producto); setErrorFormulario(''); setMensaje('');
    setFormulario(producto ? { nombre: producto.nombre, descripcion: producto.descripcion || '', tipo_id: producto.tipo_id, categoria_id: producto.categoria_id || '', subcategoria_id: producto.subcategoria_id || '', clasificacion_id: producto.clasificacion_id || '', estado: producto.estado } : { ...vacio, tipo_id: catalogos.tipos.find(tipo => tipo.activo && tipo.tipo_base === 'PRODUCTO')?.id || catalogos.tipos.find(tipo => tipo.activo && tipo.tipo_base !== 'SERVICIO')?.id || '' });
    setModal(modo);
  }
  function cerrar() {
    if (guardando) return;
    setModal(null); requestAnimationFrame(() => origen.current?.focus());
  }
  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (guardando || !puedeGestionar || modal === 'ver') return;
    setGuardando(true); setErrorFormulario('');
    try {
      const payload = { ...formulario, categoria_id: formulario.categoria_id || null, subcategoria_id: formulario.subcategoria_id || null, clasificacion_id: formulario.clasificacion_id || null };
      const respuesta = await leerRespuesta<{ data: Producto }>(await apiFetch('/api/v1/inventario/productos-base' + (modal === 'editar' ? '/' + seleccionado!.id : ''), {
        method: modal === 'editar' ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      }));
      setMensaje(respuesta.data.nombre + (modal === 'editar' ? ' se actualizó correctamente.' : ' se registró como producto base.'));
      setBuscar(''); setCategoria(''); setEstado(''); setNumeroPagina(1); setRecarga(valor => valor + 1); setModal(null);
      requestAnimationFrame(() => origen.current?.focus());
    } catch (error) { setErrorFormulario(error instanceof Error ? error.message : 'No se pudo guardar el producto base.'); }
    finally { setGuardando(false); }
  }
  const soloLectura = modal === 'ver';
  const opciones = (registros: Opcion[], actual: string, condicion: (registro: Opcion) => boolean = () => true) => registros.filter(registro => (registro.activo && condicion(registro)) || registro.id === actual).map(registro => <option key={registro.id} value={registro.id} disabled={!registro.activo}>{registro.nombre}{!registro.activo ? ' (inactivo)' : ''}</option>);

  return <div className="inventario-contenido productos-base">
    <header className="productos-base-encabezado"><div><h2>Productos base e insumos</h2><p>Registra el grupo general, por ejemplo Paracetamol. Sus presentaciones, precios y lotes se agregarán en la vista de ítems.</p></div>
      {puedeGestionar && <button className="inventario-nuevo" disabled={!catalogosListos} onClick={event => abrir('crear', event.currentTarget)}>+ Registrar producto base</button>}
    </header>
    <div className="inventario-filtros">
      <label><input type="search" aria-label="Buscar producto base por nombre o código" placeholder="Buscar producto base por nombre o código" value={buscar} onChange={event => { setBuscar(event.target.value); setNumeroPagina(1); }} /></label>
      <select aria-label="Filtrar por categoría" value={categoria} onChange={event => { setCategoria(event.target.value); setNumeroPagina(1); }}><option value="">Todas las categorías</option>{catalogos.categorias.map(opcion => <option key={opcion.id} value={opcion.id}>{opcion.nombre}</option>)}</select>
      <select aria-label="Filtrar por estado" value={estado} onChange={event => { setEstado(event.target.value); setNumeroPagina(1); }}><option value="">Todos los estados</option><option value="ACTIVO">Activo</option><option value="INACTIVO">Inactivo</option></select>
      <select aria-label="Ordenar por" value={orden} onChange={event => { setOrden(event.target.value); setNumeroPagina(1); }}><option value="nombre">Ordenar por nombre</option><option value="id">Ordenar por código</option><option value="estado">Ordenar por estado</option></select>
      <select aria-label="Dirección del orden" value={direccion} onChange={event => { setDireccion(event.target.value); setNumeroPagina(1); }}><option value="asc">Ascendente</option><option value="desc">Descendente</option></select>
    </div>
    {error && <p role="alert" className="productos-base-error">{error} <button onClick={() => setRecarga(valor => valor + 1)}>Reintentar</button></p>}
    <p role="status" className="productos-base-mensaje">{mensaje}</p>
    <div className="productos-base-resumen"><span className="inventario-contador">{pagina.total} productos base</span><span>{cargando ? 'Cargando…' : `${pagina.from || 0}–${pagina.to || 0} de ${pagina.total}`}</span><label>Filas <select value={filas} onChange={event => { setFilas(Number(event.target.value)); setNumeroPagina(1); }}><option>20</option><option>50</option><option>100</option></select></label></div>
    <div className="productos-base-tabla" aria-busy={cargando}><table data-interactiva="true"><thead><tr><th scope="col">Código</th><th scope="col">Producto base</th><th scope="col">Tipo</th><th scope="col">Categoría</th><th scope="col">Subcategoría</th><th scope="col">Clasificación / familia</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead>
      <tbody>{!cargando && !error && pagina.data.length === 0 && <tr><td colSpan={8} className="productos-base-vacio"><strong>{buscar || categoria || estado ? 'No hay coincidencias' : 'Todavía no hay productos base'}</strong><p>{buscar || categoria || estado ? 'Prueba con otros filtros.' : 'Registra un producto como Paracetamol para agrupar sus futuros ítems.'}</p></td></tr>}
        {pagina.data.map(producto => <tr key={producto.id}><td>{producto.codigo}</td><td><strong>{producto.nombre}</strong>{producto.descripcion && <small>{producto.descripcion}</small>}</td><td>{producto.tipo.nombre}</td><td>{producto.categoria?.nombre || '—'}</td><td>{producto.subcategoria?.nombre || '—'}</td><td>{producto.clasificacion?.nombre || '—'}</td><td>{producto.estado === 'ACTIVO' ? '● Activo' : '○ Inactivo'}</td><td><div className="productos-base-acciones"><button aria-label={'Ver ' + producto.nombre} onClick={event => abrir('ver', event.currentTarget, producto)}>Ver</button>{puedeGestionar && <button disabled={!catalogosListos} aria-label={'Editar ' + producto.nombre} onClick={event => abrir('editar', event.currentTarget, producto)}>Editar</button>}</div></td></tr>)}
      </tbody></table></div>
    <nav className="productos-base-paginacion" aria-label="Paginación de productos base"><button disabled={cargando || numeroPagina <= 1} onClick={() => setNumeroPagina(1)}>Primera</button><button disabled={cargando || numeroPagina <= 1} onClick={() => setNumeroPagina(valor => valor - 1)}>Anterior</button><span>Página {pagina.current_page} de {pagina.last_page}</span><button disabled={cargando || numeroPagina >= pagina.last_page} onClick={() => setNumeroPagina(valor => valor + 1)}>Siguiente</button><button disabled={cargando || numeroPagina >= pagina.last_page} onClick={() => setNumeroPagina(pagina.last_page)}>Última</button></nav>
    {modal && <div className="inventario-modal-fondo"><div ref={dialogo} className="inventario-modal productos-base-modal" role="dialog" aria-modal="true" aria-labelledby="producto-base-titulo" aria-describedby="producto-base-ayuda" onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); cerrar(); }
      if (event.key === 'Tab') {
        const elementos = dialogo.current?.querySelectorAll<HTMLElement>('input:enabled, select:enabled, textarea:enabled, button:enabled');
        if (!elementos?.length) return;
        const primero = elementos[0], ultimo = elementos[elementos.length - 1];
        if (event.shiftKey && document.activeElement === primero) { event.preventDefault(); ultimo.focus(); }
        if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primero.focus(); }
      }
    }}><header><h2 id="producto-base-titulo">{soloLectura ? 'Detalle del producto base' : modal === 'editar' ? 'Editar producto base' : 'Registrar producto base'}</h2><button type="button" aria-label="Cerrar formulario" disabled={guardando} onClick={cerrar}>×</button></header>
      <p id="producto-base-ayuda">Este registro agrupa las distintas presentaciones de un producto. Ejemplo: Paracetamol.</p>
      <form onSubmit={guardar}><fieldset disabled={soloLectura || guardando}><div className="productos-base-campos">
        {seleccionado && <label>Código<input value={seleccionado.codigo} readOnly /></label>}
        <label className="productos-base-ancho">Nombre del producto base *<input autoComplete="off" required maxLength={150} placeholder="Ej. Paracetamol" value={formulario.nombre} onChange={event => setFormulario({ ...formulario, nombre: event.target.value })} /></label>
        <label>Tipo *<select required value={formulario.tipo_id} onChange={event => setFormulario({ ...formulario, tipo_id: event.target.value })}><option value="">Seleccionar tipo</option>{opciones(catalogos.tipos, formulario.tipo_id, opcion => opcion.tipo_base !== 'SERVICIO')}</select></label>
        <label>Estado<select value={formulario.estado} onChange={event => setFormulario({ ...formulario, estado: event.target.value })}><option value="ACTIVO">Activo</option><option value="INACTIVO">Inactivo</option></select></label>
        <label>Categoría<select value={formulario.categoria_id} onChange={event => setFormulario({ ...formulario, categoria_id: event.target.value, subcategoria_id: '' })}><option value="">Sin categoría</option>{opciones(catalogos.categorias, formulario.categoria_id)}</select></label>
        <label>Subcategoría<select disabled={!formulario.categoria_id} value={formulario.subcategoria_id} onChange={event => setFormulario({ ...formulario, subcategoria_id: event.target.value })}><option value="">Sin subcategoría</option>{opciones(catalogos.subcategorias, formulario.subcategoria_id, opcion => opcion.categoria_id === formulario.categoria_id)}</select></label>
        <label className="productos-base-ancho">Clasificación / familia<select value={formulario.clasificacion_id} onChange={event => setFormulario({ ...formulario, clasificacion_id: event.target.value })}><option value="">Sin clasificación</option>{opciones(catalogos.clasificaciones, formulario.clasificacion_id)}</select></label>
        <label className="productos-base-ancho">Descripción general<textarea rows={3} maxLength={2000} placeholder="Descripción del producto base" value={formulario.descripcion} onChange={event => setFormulario({ ...formulario, descripcion: event.target.value })} /></label>
      </div></fieldset>{errorFormulario && <p role="alert" className="productos-base-error">{errorFormulario}</p>}
      <footer><button type="button" disabled={guardando} onClick={cerrar}>{soloLectura ? 'Cerrar' : 'Cancelar'}</button>{!soloLectura && <button className="inventario-nuevo" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar producto base'}</button>}</footer></form>
    </div></div>}
  </div>;
}
