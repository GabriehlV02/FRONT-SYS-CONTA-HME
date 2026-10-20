import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '@ui/auth';
import { leerRespuesta } from '../../usuarios/accesos';

type Opcion = { id: string; nombre: string; activo: boolean };
type Grupo = { id: number; codigo: string; nombre: string; estado: string; tipo: Opcion; categoria: Opcion | null; subcategoria: Opcion | null };
type Lote = { id: number; numero: string; vencimiento: string | null; precio_1: string; precio_2: string; precio_3: string };
type Item = { id: number; codigo: string; producto_base_id: number; producto_base: Grupo; nombre_comercial: string; marca: string; presentacion: string; descripcion: string | null; unidad_id: string; unidad: Opcion; codigo_barras: string | null; precio_1: string; precio_2: string; precio_3: string; estado: string; lotes: Lote[] };
type Pagina = { data: Item[]; total: number; current_page: number; last_page: number; from: number | null; to: number | null };
type Opciones = { productos: Grupo[]; unidades: Opcion[] };
type Modal = 'crear' | 'editar' | 'detalle' | 'lotes' | 'lote';
const inicial = { producto_base_id: '', nombre_comercial: '', marca: '', presentacion: '', descripcion: '', unidad_id: '', codigo_barras: '', precio_1: '', precio_2: '', precio_3: '', estado: 'ACTIVO' };
const loteInicial = { numero: '', vencimiento: '', precio_1: '', precio_2: '', precio_3: '' };
const dinero = (valor: string) => 'Bs ' + Number(valor).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function ItemsGeneralView({ puedeGestionar = false, onReportes }: { puedeGestionar?: boolean; onReportes: () => void }) {
  const [opciones, setOpciones] = useState<Opciones>({ productos: [], unidades: [] });
  const [pagina, setPagina] = useState<Pagina>({ data: [], total: 0, current_page: 1, last_page: 1, from: null, to: null });
  const [buscar, setBuscar] = useState('');
  const [grupo, setGrupo] = useState('');
  const [estado, setEstado] = useState('');
  const [orden, setOrden] = useState('nombre_comercial');
  const [direccion, setDireccion] = useState('asc');
  const [filas, setFilas] = useState(20);
  const [numero, setNumero] = useState(1);
  const [galeria, setGaleria] = useState(false);
  const [recarga, setRecarga] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [opcionesListas, setOpcionesListas] = useState(false);
  const [errorOpciones, setErrorOpciones] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modal, setModal] = useState<Modal | null>(null);
  const [seleccionado, setSeleccionado] = useState<Item | null>(null);
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null);
  const [formulario, setFormulario] = useState(inicial);
  const [loteFormulario, setLoteFormulario] = useState(loteInicial);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState('');
  const dialogo = useRef<HTMLDivElement>(null);
  const origen = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setOpcionesListas(false); setErrorOpciones('');
    apiFetch('/api/v1/inventario/items/opciones', { signal: controller.signal }).then(leerRespuesta<{ data: Opciones }>).then(respuesta => {
      setOpciones(respuesta.data); setOpcionesListas(true);
    }).catch(error => { if (!controller.signal.aborted) setErrorOpciones(error.message); });
    return () => controller.abort();
  }, [recarga]);
  useEffect(() => {
    const controller = new AbortController();
    setCargando(true); setError('');
    const timer = window.setTimeout(() => {
      const parametros = new URLSearchParams({ buscar, producto_base_id: grupo, estado, orden, direccion, page: String(numero), por_pagina: String(filas) });
      apiFetch('/api/v1/inventario/items?' + parametros, { signal: controller.signal }).then(leerRespuesta<Pagina>).then(setPagina)
        .catch(error => { if (!controller.signal.aborted) setError(error.message); })
        .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [buscar, grupo, estado, orden, direccion, numero, filas, recarga]);
  useEffect(() => {
    if (modal) (dialogo.current?.querySelector<HTMLElement>('input:enabled, select:enabled') || dialogo.current?.querySelector<HTMLElement>('button:enabled'))?.focus();
  }, [modal]);
  useEffect(() => {
    if (!modal) return;
    const contenedor = document.querySelector('.sistema-contable') || document.body;
    const elementos = Array.from(contenedor.children).filter((elemento): elemento is HTMLElement => elemento instanceof HTMLElement && !elemento.contains(dialogo.current));
    const estados = elementos.map(elemento => elemento.inert);
    elementos.forEach(elemento => { elemento.inert = true; });
    const scrollAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { elementos.forEach((elemento, indice) => { elemento.inert = estados[indice]; }); document.body.style.overflow = scrollAnterior; };
  }, [!!modal]);

  function abrir(modo: Modal, boton: HTMLElement, item: Item | null = null) {
    origen.current = boton; setSeleccionado(item); setErrorFormulario(''); setMensaje('');
    setFormulario(item ? { producto_base_id: String(item.producto_base_id), nombre_comercial: item.nombre_comercial, marca: item.marca, presentacion: item.presentacion, descripcion: item.descripcion || '', unidad_id: item.unidad_id, codigo_barras: item.codigo_barras || '', precio_1: item.precio_1, precio_2: item.precio_2, precio_3: item.precio_3, estado: item.estado } : { ...inicial, producto_base_id: grupo, unidad_id: opciones.unidades[0]?.id || '' });
    setModal(modo);
  }
  function cerrar() {
    if (guardando) return;
    setModal(null); requestAnimationFrame(() => origen.current?.isConnected ? origen.current.focus() : document.querySelector<HTMLElement>('.items-general-registrar')?.focus());
  }
  function abrirLote(lote: Lote | null = null) {
    if (!seleccionado) return;
    setLoteSeleccionado(lote); setErrorFormulario('');
    setLoteFormulario(lote ? { numero: lote.numero, vencimiento: lote.vencimiento || '', precio_1: lote.precio_1, precio_2: lote.precio_2, precio_3: lote.precio_3 } : { ...loteInicial, precio_1: seleccionado.precio_1, precio_2: seleccionado.precio_2, precio_3: seleccionado.precio_3 });
    setModal('lote');
  }
  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (guardando || !puedeGestionar) return;
    setGuardando(true); setErrorFormulario('');
    try {
      if (modal === 'lote' && seleccionado) {
        const respuesta = await leerRespuesta<{ data: Lote }>(await apiFetch('/api/v1/inventario/items/' + seleccionado.id + '/lotes' + (loteSeleccionado ? '/' + loteSeleccionado.id : ''), {
          method: loteSeleccionado ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...loteFormulario, vencimiento: loteFormulario.vencimiento || null }),
        }));
        setSeleccionado({ ...seleccionado, lotes: loteSeleccionado ? seleccionado.lotes.map(lote => lote.id === loteSeleccionado.id ? respuesta.data : lote) : [...seleccionado.lotes, respuesta.data] });
        setModal('lotes');
      } else {
        await leerRespuesta(await apiFetch('/api/v1/inventario/items' + (modal === 'editar' ? '/' + seleccionado!.id : ''), {
          method: modal === 'editar' ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formulario, producto_base_id: Number(formulario.producto_base_id), codigo_barras: formulario.codigo_barras || null }),
        }));
        setMensaje(modal === 'editar' ? 'Ítem actualizado correctamente.' : 'Ítem comercial registrado correctamente. Puedes agregar sus lotes desde Lotes.');
        setModal(null); setNumero(1); setBuscar(''); setGrupo(''); setEstado('');
        requestAnimationFrame(() => origen.current?.focus());
      }
      setRecarga(valor => valor + 1);
    } catch (error) { setErrorFormulario(error instanceof Error ? error.message : 'No se pudo guardar.'); }
    finally { setGuardando(false); }
  }

  const grupos = [...opciones.productos];
  if (seleccionado && !grupos.some(grupo => grupo.id === seleccionado.producto_base_id)) grupos.push(seleccionado.producto_base);
  const unidades = [...opciones.unidades];
  if (seleccionado && !unidades.some(unidad => unidad.id === seleccionado.unidad_id)) unidades.push(seleccionado.unidad);
  const agrupador = grupos.find(grupo => String(grupo.id) === formulario.producto_base_id);
  const detalle = modal === 'detalle';
  const esFormularioItem = modal === 'crear' || modal === 'editar' || detalle;
  const titulo = modal === 'crear' ? 'Registrar ítem comercial' : modal === 'editar' ? 'Editar ítem comercial' : detalle ? 'Detalle del ítem' : modal === 'lote' ? (loteSeleccionado ? 'Editar lote' : 'Registrar lote') : 'Lotes del ítem';
  const botones = (item: Item) => <div className="productos-base-acciones"><button onClick={event => abrir('detalle', event.currentTarget, item)} aria-label={'Ver ' + item.nombre_comercial}>Ver</button><button onClick={event => abrir('lotes', event.currentTarget, item)} aria-label={'Lotes de ' + item.nombre_comercial}>Lotes ({item.lotes.length})</button>{puedeGestionar && <button disabled={!opcionesListas} onClick={event => abrir('editar', event.currentTarget, item)} aria-label={'Editar ' + item.nombre_comercial}>Editar</button>}</div>;
  const paginacion = <nav className="productos-base-paginacion" aria-label="Paginación de ítems"><button disabled={cargando || numero <= 1} onClick={() => setNumero(1)}>Primera</button><button disabled={cargando || numero <= 1} onClick={() => setNumero(valor => valor - 1)}>Anterior</button><span>Página {pagina.current_page} de {pagina.last_page}</span><button disabled={cargando || numero >= pagina.last_page} onClick={() => setNumero(valor => valor + 1)}>Siguiente</button><button disabled={cargando || numero >= pagina.last_page} onClick={() => setNumero(pagina.last_page)}>Última</button></nav>;

  return <div className="inventario-contenido productos-base items-general">
    <header className="productos-base-encabezado"><div><h2>Ítems general</h2><p>Registra nombres comerciales y marcas bajo el código de un producto genérico. Los precios se ingresan manualmente.</p></div><div className="productos-base-acciones"><button onClick={onReportes}>Reportes</button>{puedeGestionar && <button className="inventario-nuevo items-general-registrar" disabled={!opcionesListas} onClick={event => abrir('crear', event.currentTarget)}>+ Registro de ítem</button>}</div></header>
    <div className="inventario-filtros"><label><input type="search" aria-label="Buscar ítem, genérico, marca o lote" placeholder="Buscar ítem, código, genérico, marca o lote" value={buscar} onChange={event => { setBuscar(event.target.value); setNumero(1); }} /></label>
      <select aria-label="Filtrar por agrupador" value={grupo} onChange={event => { setGrupo(event.target.value); setNumero(1); }}><option value="">Todos los agrupadores</option>{grupos.map(grupo => <option key={grupo.id} value={grupo.id}>{grupo.codigo} · {grupo.nombre}</option>)}</select>
      <select aria-label="Filtrar estado" value={estado} onChange={event => { setEstado(event.target.value); setNumero(1); }}><option value="">Todos los estados</option><option value="ACTIVO">Activo</option><option value="INACTIVO">Inactivo</option></select>
      <select aria-label="Ordenar ítems" value={orden} onChange={event => { setOrden(event.target.value); setNumero(1); }}><option value="nombre_comercial">Nombre comercial</option><option value="id">Código</option><option value="marca">Marca</option><option value="precio_1">Precio 1</option><option value="precio_2">Precio 2</option><option value="precio_3">Precio 3</option></select>
      <select aria-label="Dirección del orden" value={direccion} onChange={event => { setDireccion(event.target.value); setNumero(1); }}><option value="asc">Ascendente</option><option value="desc">Descendente</option></select>
    </div>
    {(error || errorOpciones) && <p role="alert" className="productos-base-error">{error || errorOpciones} <button onClick={() => setRecarga(valor => valor + 1)}>Reintentar</button></p>}
    {opcionesListas && puedeGestionar && (!opciones.productos.length || !opciones.unidades.length) && <p className="items-general-ayuda">Primero registra un agrupador activo en Productos e insumos y una unidad de medida en Configuración admin.</p>}
    <p role="status" className="productos-base-mensaje">{mensaje}</p>
    <div className="productos-base-resumen"><span className="inventario-contador">{pagina.total} ítems comerciales</span><span>{cargando ? 'Cargando…' : `${pagina.from || 0}–${pagina.to || 0} de ${pagina.total}`}</span><label>Filas <select value={filas} onChange={event => { setFilas(Number(event.target.value)); setNumero(1); }}><option>20</option><option>50</option><option>100</option></select></label><button aria-pressed={!galeria} onClick={() => setGaleria(false)}>Listado</button><button aria-pressed={galeria} onClick={() => setGaleria(true)}>Galería</button></div>
    {!cargando && !error && pagina.data.length === 0 && <p className="items-general-vacio">{buscar || grupo || estado ? 'No hay ítems que coincidan con los filtros.' : 'Todavía no hay ítems comerciales. Registra el primero y vincúlalo a su agrupador.'}</p>}
    {!galeria ? <div className="productos-base-tabla" aria-busy={cargando}><table data-interactiva="true"><thead><tr>{['Código del ítem', 'Agrupador genérico', 'Nombre comercial', 'Marca', 'Presentación', 'Unidad', 'Precio 1', 'Precio 2', 'Precio 3', 'Lotes', 'Estado', 'Acciones'].map(titulo => <th key={titulo} scope="col">{titulo}</th>)}</tr></thead><tbody>{pagina.data.map(item => <tr key={item.id}><td>{item.codigo}</td><td><strong>{item.producto_base.codigo}</strong><small>{item.producto_base.nombre}</small></td><td><strong>{item.nombre_comercial}</strong><small>{item.codigo_barras}</small></td><td>{item.marca}</td><td>{item.presentacion}</td><td>{item.unidad.nombre}</td><td>{dinero(item.precio_1)}</td><td>{dinero(item.precio_2)}</td><td>{dinero(item.precio_3)}</td><td>{item.lotes.length}</td><td>{item.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}</td><td>{botones(item)}</td></tr>)}</tbody></table></div> : <div className="items-general-galeria">{pagina.data.map(item => <article key={item.id}><small>{item.producto_base.codigo} · {item.producto_base.nombre}</small><h3>{item.nombre_comercial}</h3><p>{item.marca} · {item.presentacion}</p><p>{item.codigo} · {item.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}</p><dl>{(['precio_1', 'precio_2', 'precio_3'] as const).map((campo, indice) => <div key={campo}><dt>Precio {indice + 1}</dt><dd>{dinero(item[campo])}</dd></div>)}</dl>{botones(item)}</article>)}</div>}
    {paginacion}
    {modal && createPortal(<div className="inventario-modal-fondo items-general-modal-fondo"><div ref={dialogo} className="inventario-modal productos-base-modal items-general-modal" role="dialog" aria-modal="true" aria-labelledby="item-titulo" onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); cerrar(); }
      if (event.key === 'Tab') {
        const elementos = dialogo.current?.querySelectorAll<HTMLElement>('input:enabled, select:enabled, textarea:enabled, button:enabled');
        if (!elementos?.length) return;
        const primero = elementos[0], ultimo = elementos[elementos.length - 1];
        if (event.shiftKey && document.activeElement === primero) { event.preventDefault(); ultimo.focus(); }
        if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primero.focus(); }
      }
    }}><header><h2 id="item-titulo">{titulo}</h2><button aria-label="Cerrar formulario" disabled={guardando} onClick={cerrar}>×</button></header>
      {esFormularioItem ? <><p>El agrupador conserva el nombre genérico; este registro identifica su variante comercial. Los precios de aquí son la referencia para nuevos lotes.</p><form onSubmit={guardar}><fieldset disabled={detalle || guardando}><div className="productos-base-campos">
        {seleccionado && <label>Código del ítem<input readOnly value={seleccionado.codigo} /></label>}
        <label className="productos-base-ancho">Agrupador genérico *<select required disabled={modal === 'editar'} value={formulario.producto_base_id} onChange={event => setFormulario({ ...formulario, producto_base_id: event.target.value })}><option value="">Seleccionar producto por código y nombre</option>{grupos.map(grupo => <option key={grupo.id} value={grupo.id} disabled={grupo.estado !== 'ACTIVO'}>{grupo.codigo} · {grupo.nombre}</option>)}</select></label>
        {agrupador && <p className="productos-base-ancho items-general-ayuda">{agrupador.tipo.nombre} · {agrupador.categoria?.nombre || 'Sin categoría'} · {agrupador.subcategoria?.nombre || 'Sin subcategoría'}</p>}
        <label className="productos-base-ancho">Nombre comercial *<input required maxLength={150} value={formulario.nombre_comercial} placeholder="Nombre del medicamento o producto comercial" onChange={event => setFormulario({ ...formulario, nombre_comercial: event.target.value })} /></label>
        <label>Marca / laboratorio *<input required maxLength={100} value={formulario.marca} onChange={event => setFormulario({ ...formulario, marca: event.target.value })} /></label>
        <label>Presentación / concentración *<input required maxLength={150} placeholder="Ej. Tabletas 500 mg, caja de 20" value={formulario.presentacion} onChange={event => setFormulario({ ...formulario, presentacion: event.target.value })} /></label>
        <label>Unidad de medida *<select required value={formulario.unidad_id} onChange={event => setFormulario({ ...formulario, unidad_id: event.target.value })}><option value="">Seleccionar</option>{unidades.map(unidad => <option key={unidad.id} value={unidad.id} disabled={!unidad.activo}>{unidad.nombre}{!unidad.activo ? ' (inactiva)' : ''}</option>)}</select></label>
        <label>Código de barras<input maxLength={100} value={formulario.codigo_barras} onChange={event => setFormulario({ ...formulario, codigo_barras: event.target.value })} /></label>
        {(['precio_1', 'precio_2', 'precio_3'] as const).map((campo, indice) => <label key={campo}>Precio {indice + 1} (Bs) *<input required type="number" min="0" max="9999999999.99" step="0.01" placeholder="0.00" value={formulario[campo]} onChange={event => setFormulario({ ...formulario, [campo]: event.target.value })} /></label>)}
        <label>Estado<select value={formulario.estado} onChange={event => setFormulario({ ...formulario, estado: event.target.value })}><option value="ACTIVO">Activo</option><option value="INACTIVO">Inactivo</option></select></label>
        <label className="productos-base-ancho">Descripción<textarea rows={3} maxLength={2000} value={formulario.descripcion} onChange={event => setFormulario({ ...formulario, descripcion: event.target.value })} /></label>
      </div></fieldset>{errorFormulario && <p role="alert" className="productos-base-error">{errorFormulario}</p>}<footer><button type="button" disabled={guardando} onClick={cerrar}>{detalle ? 'Cerrar' : 'Cancelar'}</button>{!detalle && <button type="submit" className="inventario-nuevo" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar ítem'}</button>}</footer></form></> : modal === 'lotes' && seleccionado ? <div className="items-general-lotes"><h3>{seleccionado.nombre_comercial} · {seleccionado.marca}</h3><p>{seleccionado.codigo} → {seleccionado.producto_base.codigo} · {seleccionado.producto_base.nombre}</p><p>Los lotes conservan sus propios precios manuales. Las cantidades se ingresarán con las compras.</p>{puedeGestionar && <button className="inventario-nuevo" disabled={seleccionado.estado !== 'ACTIVO' || seleccionado.producto_base.estado !== 'ACTIVO'} onClick={() => abrirLote()}>+ Registrar lote</button>}
        <div className="productos-base-tabla"><table data-interactiva="true"><thead><tr><th>Lote</th><th>Vencimiento</th><th>Precio 1</th><th>Precio 2</th><th>Precio 3</th>{puedeGestionar && <th>Acciones</th>}</tr></thead><tbody>{seleccionado.lotes.map(lote => <tr key={lote.id}><td>{lote.numero}</td><td>{lote.vencimiento || 'Sin fecha'}</td><td>{dinero(lote.precio_1)}</td><td>{dinero(lote.precio_2)}</td><td>{dinero(lote.precio_3)}</td>{puedeGestionar && <td><button onClick={() => abrirLote(lote)}>Editar lote</button></td>}</tr>)}</tbody></table>{!seleccionado.lotes.length && <p>No hay lotes registrados para este ítem.</p>}</div><button onClick={cerrar}>Cerrar</button></div> : <><p>{seleccionado?.codigo} · {seleccionado?.nombre_comercial}. Puedes ajustar los tres precios para este lote.</p><form onSubmit={guardar}><fieldset disabled={guardando}><div className="productos-base-campos"><label>Número de lote *<input required maxLength={100} value={loteFormulario.numero} onChange={event => setLoteFormulario({ ...loteFormulario, numero: event.target.value })} /></label><label>Fecha de vencimiento<input type="date" value={loteFormulario.vencimiento} onChange={event => setLoteFormulario({ ...loteFormulario, vencimiento: event.target.value })} /></label>{(['precio_1', 'precio_2', 'precio_3'] as const).map((campo, indice) => <label key={campo}>Precio {indice + 1} del lote (Bs) *<input required type="number" min="0" max="9999999999.99" step="0.01" value={loteFormulario[campo]} onChange={event => setLoteFormulario({ ...loteFormulario, [campo]: event.target.value })} /></label>)}</div></fieldset>{errorFormulario && <p role="alert" className="productos-base-error">{errorFormulario}</p>}<footer><button type="button" disabled={guardando} onClick={() => setModal('lotes')}>Volver a lotes</button><button type="submit" className="inventario-nuevo" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar lote'}</button></footer></form></>}
    </div></div>, document.querySelector('.sistema-contable') || document.body)}
  </div>;
}
