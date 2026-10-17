import { apiFetch } from '@ui/auth';
import { useEffect, useState } from 'react';
import Icon from '@ui/components/Icon';
import { leerRespuesta, type Rol, type Sistema, type CatalogoRoles } from '../accesos';

export function RolesPermisosView() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [editando, setEditando] = useState<Rol | 'nuevo' | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [recarga, setRecarga] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setError('');
    apiFetch('/api/v1/roles', { signal: controller.signal }).then(leerRespuesta<CatalogoRoles>).then(datos => {
      if (!controller.signal.aborted) { setRoles(datos.data); setSistemas(datos.sistemas); }
    }).catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'No se pudieron cargar los roles.'); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [recarga]);
  if (editando) return <EditorRol rol={editando === 'nuevo' ? null : editando} sistemas={sistemas} onBack={() => setEditando(null)} onSaved={() => { setEditando(null); setRecarga(value => value + 1); window.dispatchEvent(new Event('contable:actualizar-sesion')); }} />;
  return <div className="usuarios-contenido">
    <div className="usuarios-filtros roles-filtros"><span className="usuarios-contador">{roles.length} roles</span><button className="usuarios-accion" disabled={cargando || !!error} onClick={() => setEditando('nuevo')}><Icon name="plus" size={17} /> Nuevo rol</button></div>
    {error && <p className="usuarios-modal-error" role="alert">{error}</p>}
    {cargando ? <p role="status">Cargando roles…</p> : <div className="usuarios-tabla">
      <div className="usuarios-tabla-head"><span>Nombre</span><span>Permisos</span><span>Estado</span><span>Acciones</span></div>
      {roles.map(rol => <div className="usuarios-tabla-fila roles-fila" key={rol.id}><div><strong>{rol.nombre}</strong><small>{rol.descripcion}</small></div><span className="permisos-contador">{rol.permisos.length} permisos</span><span className="estado-activo">{rol.activo ? 'Activo' : 'Inactivo'}</span><button aria-label={rol.codigo === 'ADMINISTRADOR' ? 'Ver Administrador' : 'Editar ' + rol.nombre} onClick={() => setEditando(rol)}><Icon name={rol.codigo === 'ADMINISTRADOR' ? 'eye' : 'edit'} size={16} /></button></div>)}
      {!roles.length && !error && <div className="usuarios-vacio">No hay roles registrados.</div>}
    </div>}
  </div>;
}

function EditorRol({ rol, sistemas, onBack, onSaved }: { rol: Rol | null; sistemas: Sistema[]; onBack: () => void; onSaved: () => void }) {
  const protegido = rol?.codigo === 'ADMINISTRADOR';
  const [nombre, setNombre] = useState(rol?.nombre || '');
  const [descripcion, setDescripcion] = useState(rol?.descripcion || '');
  const [activo, setActivo] = useState(rol?.activo ?? true);
  const [habilitados, setHabilitados] = useState<string[]>(rol?.sistemas || []);
  const [permisos, setPermisos] = useState<string[]>(rol?.permisos || []);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  function alternarSistema(sistema: Sistema) {
    const seleccionado = habilitados.includes(sistema.codigo);
    setHabilitados(actual => seleccionado ? actual.filter(item => item !== sistema.codigo) : [...actual, sistema.codigo]);
    if (seleccionado) setPermisos(actual => actual.filter(item => !sistema.permisos.some(permiso => permiso.codigo === item)));
  }
  function alternarTodo(sistema: Sistema) {
    const codigos = sistema.permisos.map(permiso => permiso.codigo);
    setPermisos(actual => codigos.every(codigo => actual.includes(codigo)) ? actual.filter(codigo => !codigos.includes(codigo)) : [...new Set([...actual, ...codigos])]);
  }
  async function guardar() {
    if (protegido || guardando) return;
    setError('');
    if (!nombre.trim() || !habilitados.length) { setError('Ingresa un nombre y selecciona al menos un sistema.'); return; }
    setGuardando(true);
    try {
      await leerRespuesta(await apiFetch(rol ? '/api/v1/roles/' + rol.id : '/api/v1/roles', {
        method: rol ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), descripcion, activo, sistemas: habilitados, permisos }),
      }));
      onSaved();
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo guardar el rol.'); }
    finally { setGuardando(false); }
  }
  return <div className="rol-editor">
    <button className="usuarios-volver" disabled={guardando} onClick={onBack}><Icon name="chevronLeft" size={16} /> Volver a roles</button>
    <header className="usuarios-vista-cabecera"><div><p>CONFIGURACIÓN DEL ROL</p><h2>{nombre || 'Nuevo rol'}</h2><small>{protegido ? 'El rol inicial del administrador está protegido.' : 'Selecciona sistemas y permisos para este rol.'}</small></div>{!protegido && <button className="usuarios-accion" disabled={guardando} onClick={() => void guardar()}>{guardando ? 'Guardando…' : 'Guardar rol'}</button>}</header>
    {error && <p className="usuarios-modal-error" role="alert">{error}</p>}
    <section className="rol-datos"><label>Nombre del rol<input maxLength={100} value={nombre} disabled={protegido || guardando} onChange={event => setNombre(event.target.value)} placeholder="Ej. Recepción" /></label><label>Descripción<textarea maxLength={1000} value={descripcion} disabled={protegido || guardando} onChange={event => setDescripcion(event.target.value)} rows={3} /></label></section>
    {!protegido && <label className="usuarios-estado-switch"><input type="checkbox" checked={activo} disabled={guardando} onChange={event => setActivo(event.target.checked)} /> Rol activo</label>}
    <div className="permisos-encabezado"><div><h3>Sistemas y permisos</h3><small>Activa un sistema y configura sus permisos.</small></div><span>{permisos.length} permisos</span></div>
    <div className="sistemas-permisos">{sistemas.map(sistema => {
      const seleccionado = habilitados.includes(sistema.codigo);
      const completos = sistema.permisos.length > 0 && sistema.permisos.every(permiso => permisos.includes(permiso.codigo));
      return <section className="sistema-permisos" key={sistema.codigo}><label className="sistema-permisos-titulo"><input type="checkbox" disabled={protegido || guardando} checked={seleccionado} onChange={() => alternarSistema(sistema)} /><strong>{sistema.nombre}</strong></label>
        {seleccionado && <><label className="seleccionar-todo"><input type="checkbox" disabled={protegido || guardando} checked={completos} onChange={() => alternarTodo(sistema)} /> Seleccionar todo el módulo</label><div className="sistema-permisos-lista">{sistema.permisos.map(permiso => <label key={permiso.codigo}><input type="checkbox" disabled={protegido || guardando} checked={permisos.includes(permiso.codigo)} onChange={() => setPermisos(actual => actual.includes(permiso.codigo) ? actual.filter(item => item !== permiso.codigo) : [...actual, permiso.codigo])} />{permiso.nombre}</label>)}</div></>}
      </section>;
    })}</div>
  </div>;
}