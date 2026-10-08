import { useMemo, useState } from 'react';
import Icon from '@ui/components/Icon';

type Sistema = { id: string; nombre: string; permisos: string[] };
const sistemas: Sistema[] = [
  { id: 'clinico', nombre: 'Sistema clínico', permisos: ['Ver pacientes', 'Registrar pacientes', 'Atender consultas', 'Gestionar internación', 'Gestionar quirófano', 'Gestionar farmacia', 'Gestionar cocina'] },
  { id: 'contable', nombre: 'Sistema contable', permisos: ['Ver ventas', 'Registrar ventas', 'Ver inventario', 'Gestionar inventario', 'Gestionar movimientos', 'Ver usuarios', 'Registrar usuarios', 'Gestionar roles y permisos'] },
  { id: 'estudios', nombre: 'Sistema de estudios', permisos: ['Ver imagenología', 'Informar imagenología', 'Ver laboratorio', 'Informar laboratorio', 'Publicar estudios', 'Consultar estudios propios'] },
  { id: 'hemodialisis', nombre: 'Sistema de hemodiálisis', permisos: ['Ver hemodiálisis', 'Registrar sesión', 'Ver seguimiento', 'Registrar informe'] },
];
const todos = sistemas.flatMap((s) => s.permisos);

export function RolesPermisosView() {
  const [editando, setEditando] = useState<string | null>(null);
  const roles = [{ nombre: 'Administrador', descripcion: 'Acceso completo a todos los sistemas.', permisos: todos.length, estado: 'Activo' }, { nombre: 'Operador', descripcion: 'Acceso operativo configurable.', permisos: 0, estado: 'Activo' }];
  if (editando) return <EditorRol nombre={editando} onBack={() => setEditando(null)} />;
  return <div className="usuarios-contenido"><div className="usuarios-filtros roles-filtros"><span className="usuarios-contador">{roles.length} roles</span><button className="usuarios-accion" onClick={() => setEditando('Nuevo rol')}><Icon name="plus" size={17} /> Nuevo rol</button></div><div className="usuarios-tabla"><div className="usuarios-tabla-head"><span>Nombre</span><span>Permisos</span><span>Estado</span><span>Acciones</span></div>{roles.map((rol) => <div className="usuarios-tabla-fila roles-fila" key={rol.nombre}><div><strong>{rol.nombre}</strong><small>{rol.descripcion}</small></div><span className="permisos-contador">{rol.permisos} permisos</span><span className="estado-activo">{rol.estado}</span><button onClick={() => setEditando(rol.nombre)}><Icon name="edit" size={16} /></button></div>)}</div></div>;
}

function EditorRol({ nombre, onBack }: { nombre: string; onBack: () => void }) {
  const admin = nombre === 'Administrador';
  const [nombreRol, setNombreRol] = useState(admin ? 'Administrador' : '');
  const [descripcion, setDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [habilitados, setHabilitados] = useState<string[]>(admin ? sistemas.map((s) => s.id) : []);
  const [permisos, setPermisos] = useState<string[]>(admin ? todos : []);
  const alternarSistema = (sistema: Sistema) => { const activo = habilitados.includes(sistema.id); setHabilitados((v) => activo ? v.filter((id) => id !== sistema.id) : [...v, sistema.id]); if (activo) setPermisos((v) => v.filter((p) => !sistema.permisos.includes(p))); };
  const alternarTodo = (sistema: Sistema) => { const completos = sistema.permisos.every((p) => permisos.includes(p)); setPermisos((v) => completos ? v.filter((p) => !sistema.permisos.includes(p)) : [...new Set([...v, ...sistema.permisos])]); };
  const alternarPermiso = (permiso: string) => setPermisos((v) => v.includes(permiso) ? v.filter((p) => p !== permiso) : [...v, permiso]);
  const cantidad = useMemo(() => permisos.length, [permisos]);
  const guardar = async () => { if (admin || !nombreRol || !habilitados.length) return; setGuardando(true); try { const r = await fetch('/api/v1/roles',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nombre:nombreRol,descripcion,sistemas:habilitados.map((id)=>id.toUpperCase()),permisos})}); if (!r.ok) throw new Error(); onBack(); } finally { setGuardando(false); } };
  return <div className="rol-editor"><button className="usuarios-volver" onClick={onBack}><Icon name="chevronLeft" size={16} /> Volver a roles</button><header className="usuarios-vista-cabecera"><div><p>CONFIGURACIÓN DEL ROL</p><h2>{nombreRol || 'Nuevo rol'}</h2><small>Selecciona sistemas y permisos para este rol.</small></div><button className="usuarios-accion" type="button" disabled={guardando} onClick={() => void guardar()}>{guardando ? 'Guardando...' : 'Guardar rol'}</button></header><section className="rol-datos"><label>Nombre del rol<input value={nombreRol} disabled={admin} onChange={(e) => setNombreRol(e.target.value)} placeholder="Ej. Recepción" /></label><label>Descripción<textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Describe el alcance de este rol" rows={3} /></label></section><div className="permisos-encabezado"><div><h3>Sistemas y permisos</h3><small>Activa un sistema y configura sus permisos.</small></div><span>{cantidad} permisos</span></div><div className="sistemas-permisos">{sistemas.map((sistema) => { const activo = habilitados.includes(sistema.id); const completo = sistema.permisos.every((p) => permisos.includes(p)); return <section className="sistema-permisos" key={sistema.id}><label className="sistema-permisos-titulo"><input type="checkbox" checked={activo} onChange={() => alternarSistema(sistema)} /><strong>{sistema.nombre}</strong></label>{activo && <><label className="seleccionar-todo"><input type="checkbox" checked={completo} onChange={() => alternarTodo(sistema)} /> Seleccionar todo el módulo</label><div className="sistema-permisos-lista">{sistema.permisos.map((permiso) => <label key={permiso}><input type="checkbox" checked={permisos.includes(permiso)} onChange={() => alternarPermiso(permiso)} />{permiso}</label>)}</div></>}</section>; })}</div></div>;
}
