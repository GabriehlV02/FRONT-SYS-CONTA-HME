import { useMemo, useState } from 'react';
import Icon from '@ui/components/Icon';

type UsuarioPaciente = { nombre: string; usuario: string; ci: string; estado: 'ACTIVO' | 'INACTIVO' };

export function PacientesUsuariosView() {
  const [buscar, setBuscar] = useState('');
  const [estado, setEstado] = useState('TODOS');
  const [usuarios, setUsuarios] = useState<UsuarioPaciente[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState({ nombre: '', ci: '', usuario: '' });
  const visibles = useMemo(() => usuarios.filter((u) => (`${u.nombre} ${u.usuario} ${u.ci}`).toLowerCase().includes(buscar.toLowerCase()) && (estado === 'TODOS' || u.estado === estado)), [usuarios, buscar, estado]);
  const registrar = (e: React.FormEvent) => { e.preventDefault(); if (!form.nombre || !form.usuario) return; setUsuarios((v) => [...v, { ...form, estado: 'ACTIVO' }]); setForm({ nombre: '', ci: '', usuario: '' }); setAbierto(false); };
  return <div className="usuarios-contenido"><div className="usuarios-filtros"><label><Icon name="search" size={17}/><input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar paciente, CI o usuario" /></label><select value={estado} onChange={(e) => setEstado(e.target.value)}><option value="TODOS">Todos los estados</option><option value="ACTIVO">Activos</option><option value="INACTIVO">Inactivos</option></select><span className="usuarios-contador">{visibles.length} registros</span><button className="usuarios-accion" onClick={() => setAbierto(true)}><Icon name="plus" size={17}/>Registrar usuario</button></div><div className="usuarios-tabla"><div className="usuarios-tabla-head"><span>N°</span><span>Paciente</span><span>CI</span><span>Usuario</span><span>Estado</span><span>Acciones</span></div>{visibles.map((u, i) => <div className="usuarios-tabla-fila" key={u.usuario}><span>{i + 1}</span><strong>{u.nombre}</strong><span>{u.ci || '—'}</span><span>{u.usuario}</span><span className="estado-activo">{u.estado}</span><span>—</span></div>)}{!visibles.length && <div className="usuarios-vacio"><Icon name="users" size={25}/><strong>No hay pacientes con usuario</strong><small>Registra el acceso de un paciente al portal de estudios.</small></div>}</div>{abierto && <div className="usuarios-modal-fondo"><form className="usuarios-modal" onSubmit={registrar}><header><div><p>USUARIO PACIENTE</p><h3>Registrar acceso</h3></div><button type="button" onClick={() => setAbierto(false)}><Icon name="close" size={18}/></button></header><div className="usuarios-modal-grid">{([['nombre','Nombre completo'],['ci','CI'],['usuario','Usuario']] as const).map(([k,l]) => <label key={k}>{l}<input value={form[k]} onChange={(e) => setForm({...form,[k]:e.target.value})}/></label>)}</div><footer><button type="button" onClick={() => setAbierto(false)}>Cancelar</button><button type="submit">Registrar usuario</button></footer></form></div>}</div>;
}
