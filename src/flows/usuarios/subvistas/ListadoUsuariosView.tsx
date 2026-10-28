import { useEffect, useRef, useState, Fragment, type FormEvent } from 'react';
import Icon from '@ui/components/Icon';
import SelectorMultiple, { type OpcionMultiple } from '@ui/components/SelectorMultiple';
import PaginacionTabla from '@ui/components/PaginacionTabla';
import { apiFetch } from '@ui/auth';
import { leerRespuesta, type Rol, type CatalogoRoles } from '../accesos';

type Usuario = { id: string; nombres: string; apellidos: string | null; ci: string | null; sucursal: string | null; cajas: string[] | null; cajas_asignadas: { id: number; nombre: string; codigo: string; sucursal_id: number }[]; almacenes: string[] | null; usuario: string; estado: 'ACTIVO' | 'INACTIVO'; sucursales_asignadas: { id: number; nombre: string }[]; almacenes_asignados: { id: number; nombre: string; sucursal_id: number }[]; roles: { id: string; nombre: string; codigo: string }[] };
type Pagina = { data: Usuario[]; total: number; last_page: number };
const formularioInicial = { nombres: '', apellidos: '', ci: '', sucursal_ids: [] as number[], caja_ids: [] as number[], almacen_ids: [] as number[], rol_id: '', usuario: '', password: '', password_confirmation: '', estado: 'ACTIVO' };
const campos = [['nombres', 'Nombres'], ['apellidos', 'Apellidos'], ['ci', 'CI'], ['usuario', 'Usuario']] as const;


export function ListadoUsuariosView({ puedeCrear = true }: { puedeCrear?: boolean }) {
  const [query, setQuery] = useState('');
  const [estado, setEstado] = useState('');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [ubicaciones, setUbicaciones] = useState<{ sucursales: { id: number; nombre: string; codigo: string }[]; almacenes: { id: number; nombre: string; codigo: string; sucursal_id: number }[]; cajas: { id: number; nombre: string; codigo: string; sucursal_id: number; almacen_ids: number[] }[] }>({ sucursales: [], almacenes: [], cajas: [] });
  const [cargandoUbicaciones, setCargandoUbicaciones] = useState(false);
  const [errorUbicaciones, setErrorUbicaciones] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<'crear' | 'ver' | 'editar' | null>(null);
  const [seleccionado, setSeleccionado] = useState<Usuario | null>(null);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [errorFormulario, setErrorFormulario] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [filas, setFilas] = useState(20);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [paginas, setPaginas] = useState(1);
  const [recarga, setRecarga] = useState(0);
  const nombreInput = useRef<HTMLInputElement>(null);
  const abrirButton = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true); setError('');
    const params = new URLSearchParams({ tipo_usuario: 'EMPRESA', buscar: query, por_pagina: String(filas), page: String(pagina) });
    if (estado) params.set('estado', estado);
    const timer = window.setTimeout(async () => {
      try {
        const datos = await leerRespuesta<Pagina>(await apiFetch('/api/v1/usuarios?' + params, { signal: controller.signal }));
        if (!controller.signal.aborted) { setUsuarios(datos.data); setTotal(datos.total); setPaginas(datos.last_page); }
      } catch (error) { if (!controller.signal.aborted) { setUsuarios([]); setError(error instanceof Error ? error.message : 'No se pudieron cargar los usuarios.'); } }
      finally { if (!controller.signal.aborted) setCargando(false); }
    }, 200);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [query, estado, pagina, filas, recarga]);

  useEffect(() => {
    const controller = new AbortController();
    apiFetch('/api/v1/roles', { signal: controller.signal }).then(leerRespuesta<CatalogoRoles>).then(datos => {
      if (!controller.signal.aborted) setRoles(datos.data);
    }).catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'No se pudieron cargar los roles.'); });
    return () => controller.abort();
  }, []);

  useEffect(() => { if (modal && modal !== 'ver') nombreInput.current?.focus(); }, [modal]);

  useEffect(() => {
    if (!modal || modal === 'ver') return;
    const controller = new AbortController();
    setCargandoUbicaciones(true); setErrorUbicaciones('');
    void apiFetch('/api/v1/usuarios/opciones', { signal: controller.signal }).then(leerRespuesta<{ data: typeof ubicaciones }>).then(datos => {
      if (!controller.signal.aborted) setUbicaciones(datos.data);
    }).catch(error => { if (!controller.signal.aborted) setErrorUbicaciones(error instanceof Error ? error.message : 'No se pudieron cargar las ubicaciones.'); })
      .finally(() => { if (!controller.signal.aborted) setCargandoUbicaciones(false); });
    return () => controller.abort();
  }, [modal]);

  function abrir(modo: 'crear' | 'ver' | 'editar', usuario: Usuario | null, boton: HTMLButtonElement) {
    abrirButton.current = boton;
    setSeleccionado(usuario); setErrorFormulario('');
    setFormulario(usuario ? { nombres: usuario.nombres, apellidos: usuario.apellidos || '', ci: usuario.ci || '', sucursal_ids: (usuario.sucursales_asignadas || []).map(s => s.id), caja_ids: (usuario.cajas_asignadas || []).map(c => c.id), almacen_ids: (usuario.almacenes_asignados || []).map(a => a.id), rol_id: usuario.roles[0]?.id || '', usuario: usuario.usuario, password: '', password_confirmation: '', estado: usuario.estado } : formularioInicial);
    setModal(modo);
  }
  function cerrar() {
    if (guardando) return;
    setModal(null); setFormulario(formularioInicial); setSeleccionado(null);
    requestAnimationFrame(() => abrirButton.current?.focus());
  }
  function actualizar(campo: keyof typeof formulario, valor: string) {
    setFormulario(actual => ({ ...actual, [campo]: valor })); setErrorFormulario('');
  }
  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (guardando || modal === 'ver') return;
    setGuardando(true); setErrorFormulario('');
    try {
      const body = { ...formulario, tipo_usuario: 'EMPRESA' };
      await leerRespuesta(await apiFetch(modal === 'editar' && seleccionado ? '/api/v1/usuarios/' + seleccionado.id : '/api/v1/usuarios', {
        method: modal === 'editar' ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      }));
      setModal(null); setFormulario(formularioInicial); setSeleccionado(null); setPagina(1); setRecarga(value => value + 1);
      window.dispatchEvent(new Event('contable:actualizar-sesion'));
      requestAnimationFrame(() => abrirButton.current?.focus());
    } catch (error) { setErrorFormulario(error instanceof Error ? error.message : 'No se pudo guardar el usuario.'); }
    finally { setGuardando(false); }
  }
  const soloLectura = modal === 'ver';
  function cambiarUbicaciones(sucursal_ids: number[], almacen_ids: number[]) {
    setFormulario(actual => ({ ...actual, sucursal_ids, almacen_ids,
      caja_ids: actual.caja_ids.filter(id => ubicaciones.cajas.some(c => c.id === id && sucursal_ids.includes(c.sucursal_id) && c.almacen_ids.some(a => almacen_ids.includes(a)))) }));
  }
  const opcionesCajas: OpcionMultiple[] = ubicaciones.cajas.filter(c => formulario.sucursal_ids.includes(c.sucursal_id) && c.almacen_ids.some(a => formulario.almacen_ids.includes(a)))
    .map(c => ({ id: c.id, nombre: c.nombre, detalle: c.codigo }));
  for (const c of seleccionado?.cajas_asignadas || []) if (formulario.caja_ids.includes(c.id) && !opcionesCajas.some(o => o.id === c.id)) opcionesCajas.push({ id: c.id, nombre: c.nombre, detalle: c.codigo, inactiva: true });
  const selectorCajas = <SelectorMultiple etiqueta="Cajas" opciones={opcionesCajas} seleccionados={formulario.caja_ids}
    placeholder={formulario.almacen_ids.length ? 'Buscar caja por nombre o código…' : 'Selecciona primero un almacén'}
    disabled={soloLectura || guardando || cargandoUbicaciones || !!errorUbicaciones || !formulario.almacen_ids.length}
    vacio="No hay cajas activas para los almacenes seleccionados."
    onChange={ids => setFormulario(actual => ({ ...actual, caja_ids: ids }))} />;
  const rolSeleccionado = roles.find(rol => rol.id === formulario.rol_id);
  const opcionesSucursales: OpcionMultiple[] = ubicaciones.sucursales.map(s => ({ ...s, detalle: s.codigo }));
  for (const s of seleccionado?.sucursales_asignadas || []) if (!opcionesSucursales.some(o => o.id === s.id)) opcionesSucursales.push({ ...s, inactiva: true });
  const opcionesAlmacenes: OpcionMultiple[] = ubicaciones.almacenes.filter(a => formulario.sucursal_ids.includes(a.sucursal_id)).map(a => ({ ...a, detalle: `${a.codigo} · ${ubicaciones.sucursales.find(s => s.id === a.sucursal_id)?.nombre || ''}` }));
  for (const a of seleccionado?.almacenes_asignados || []) if (!opcionesAlmacenes.some(o => o.id === a.id)) opcionesAlmacenes.push({ ...a, inactiva: true });
  const selectorSucursales = <SelectorMultiple etiqueta="Sucursales" opciones={opcionesSucursales} seleccionados={formulario.sucursal_ids} disabled={soloLectura || guardando || cargandoUbicaciones || !!errorUbicaciones} onChange={ids => cambiarUbicaciones(ids, formulario.almacen_ids.filter(id => ubicaciones.almacenes.some(a => a.id === id && ids.includes(a.sucursal_id))))} />;
  const selectorAlmacenes = <SelectorMultiple etiqueta="Almacenes" placeholder={formulario.sucursal_ids.length ? 'Buscar por nombre o código…' : 'Selecciona primero una sucursal'} opciones={opcionesAlmacenes} seleccionados={formulario.almacen_ids} disabled={soloLectura || guardando || cargandoUbicaciones || !!errorUbicaciones || !formulario.sucursal_ids.length} vacio="No hay almacenes activos en las sucursales seleccionadas." onChange={ids => cambiarUbicaciones(formulario.sucursal_ids, ids)} />;
  return <div className="usuarios-contenido">
    <div className="usuarios-filtros">
      <label className="usuarios-buscador-ventas"><Icon name="search" size={17} /><input type="search" placeholder="Buscar por nombre, usuario o rol" aria-label="Buscar en usuarios" value={query} onChange={event => { setQuery(event.target.value); setPagina(1); }} /></label>
      <select aria-label="Filtrar por estado" value={estado} onChange={event => { setEstado(event.target.value); setPagina(1); }}><option value="">Todos</option><option value="ACTIVO">Activos</option><option value="INACTIVO">Inactivos</option></select>
      <span className="usuarios-contador">{total} registros</span>
      {puedeCrear && <button className="usuarios-accion" type="button" onClick={event => abrir('crear', null, event.currentTarget)}><Icon name="plus" size={17} /> Registrar usuario</button>}
    </div>
    {error && <p className="usuarios-modal-error" role="alert">{error}</p>}
    <PaginacionTabla total={total} filas={filas} pagina={pagina} totalPaginas={paginas} onFilas={cantidad => { setFilas(cantidad); setPagina(1); }} onPagina={setPagina} />
    <div className="usuarios-tabla" role="table" aria-label="Usuarios" aria-busy={cargando}>
      <div className="usuarios-tabla-head" role="row">{['N°', 'Nombre', 'Apellido', 'CI', 'Sucursales', 'Cant. cajas', 'Cant. almacenes', 'Usuario', 'Acciones'].map(nombre => <span key={nombre} role="columnheader">{nombre}</span>)}</div>
      {!cargando && usuarios.map((item, indice) => <div className="usuarios-tabla-fila" role="row" key={item.id}>
        <span role="cell">{(pagina - 1) * filas + indice + 1}</span><strong role="cell">{item.nombres}</strong><span role="cell">{item.apellidos || '—'}</span><span role="cell">{item.ci || '—'}</span><span role="cell">{item.sucursales_asignadas?.map(s => s.nombre).join(', ') || item.sucursal || '—'}</span><span role="cell">{item.cajas_asignadas?.length || 0}</span><span role="cell">{item.almacenes?.length || 0}</span><span role="cell">{item.usuario}</span>
        <div className="usuarios-acciones" role="cell"><button type="button" aria-label={'Ver ' + item.nombres} onClick={event => abrir('ver', item, event.currentTarget)}><Icon name="eye" size={16} /></button>{puedeCrear && <button type="button" aria-label={'Editar ' + item.nombres} onClick={event => abrir('editar', item, event.currentTarget)}><Icon name="edit" size={16} /></button>}</div>
      </div>)}
      {cargando && <div className="usuarios-vacio" role="status">Cargando usuarios…</div>}
      {!cargando && !usuarios.length && !error && <div className="usuarios-vacio"><Icon name="users" size={25} /><strong>No hay usuarios para mostrar</strong><small>Registra un usuario o cambia los filtros.</small></div>}
    </div>
    {modal && <div className="usuarios-modal-fondo" onMouseDown={cerrar}><form className="usuarios-modal" role="dialog" aria-modal="true" aria-labelledby="usuario-modal-titulo" onSubmit={guardar} onMouseDown={event => event.stopPropagation()} onKeyDown={event => {
      if (event.key === 'Escape') cerrar();
      if (event.key === 'Tab') {
        const campos = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled)'));
        const primero = campos[0], ultimo = campos[campos.length - 1];
        if (event.shiftKey && document.activeElement === primero) { event.preventDefault(); ultimo?.focus(); }
        else if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primero?.focus(); }
      }
    }}>
      <header><div><p>{modal === 'crear' ? 'REGISTRO DE USUARIO' : soloLectura ? 'DETALLE DE USUARIO' : 'EDICIÓN DE USUARIO'}</p><h3 id="usuario-modal-titulo">{modal === 'crear' ? 'Nuevo usuario' : seleccionado?.nombres}</h3></div><button type="button" disabled={guardando} aria-label="Cerrar usuario" autoFocus={soloLectura} onClick={cerrar}><Icon name="close" size={18} /></button></header>
      <div className="usuarios-modal-grid">
        {campos.map(([campo, etiqueta]) => <Fragment key={campo}><label>{etiqueta}<input ref={campo === 'nombres' ? nombreInput : undefined} disabled={soloLectura || guardando || (campo === 'usuario' && modal === 'editar')} required={campo === 'nombres' || campo === 'usuario'} maxLength={campo === 'ci' ? 25 : campo === 'usuario' ? 60 : 100} value={formulario[campo]} onChange={event => actualizar(campo, event.target.value)} /></label>{campo === 'ci' && <>{selectorSucursales}{selectorAlmacenes}{selectorCajas}</>}</Fragment>)}


        {cargandoUbicaciones && <p role="status">Cargando sucursales y almacenes…</p>}
        {errorUbicaciones && <p role="alert">{errorUbicaciones}</p>}
        <label>Rol<select required disabled={soloLectura || guardando} value={formulario.rol_id} onChange={event => actualizar('rol_id', event.target.value)}><option value="">Selecciona un rol</option>{roles.filter(rol => rol.activo || rol.id === formulario.rol_id).map(rol => <option key={rol.id} value={rol.id}>{rol.nombre}{!rol.activo ? ' (Inactivo)' : ''}</option>)}</select></label>
        {!soloLectura && <><label>{modal === 'editar' ? 'Nueva contraseña (opcional)' : 'Contraseña'}<input type="password" autoComplete="new-password" required={modal === 'crear'} minLength={8} maxLength={255} disabled={guardando} value={formulario.password} onChange={event => actualizar('password', event.target.value)} /></label><label>Confirmar contraseña<input type="password" autoComplete="new-password" required={modal === 'crear' || !!formulario.password} minLength={8} maxLength={255} disabled={guardando} value={formulario.password_confirmation} onChange={event => actualizar('password_confirmation', event.target.value)} /></label></>}
      </div>
      {rolSeleccionado && <p className="usuarios-rol-resumen">Rol: {rolSeleccionado.nombre} · {rolSeleccionado.permisos.length} permisos</p>}
      {modal !== 'crear' && <label className="usuarios-estado-switch"><input type="checkbox" disabled={soloLectura || guardando} checked={formulario.estado === 'ACTIVO'} onChange={event => actualizar('estado', event.target.checked ? 'ACTIVO' : 'INACTIVO')} /> Usuario activo</label>}
      {errorFormulario && <p className="usuarios-modal-error" role="alert">{errorFormulario}</p>}
      <footer><button type="button" disabled={guardando} onClick={cerrar}>{soloLectura ? 'Cerrar' : 'Cancelar'}</button>{!soloLectura && <button type="submit" disabled={guardando || cargandoUbicaciones || !!errorUbicaciones}><Icon name="check" size={16} />{guardando ? 'Guardando…' : modal === 'crear' ? 'Registrar usuario' : 'Guardar cambios'}</button>}</footer>
    </form></div>}
  </div>;
}
