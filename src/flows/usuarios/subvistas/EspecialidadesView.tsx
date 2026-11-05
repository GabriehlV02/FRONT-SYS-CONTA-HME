import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch } from '@ui/auth';
import Icon from '@ui/components/Icon';
import { leerRespuesta } from '../accesos';
import './EspecialidadesView.css';

type Especialidad = { id: number; nombre: string; activo: boolean };

export function EspecialidadesView({ puedeGestionar }: { puedeGestionar: boolean }) {
  const [datos, setDatos] = useState<Especialidad[]>([]);
  const [buscar, setBuscar] = useState('');
  const [nombre, setNombre] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const cargar = async () => {
    try { const respuesta = await leerRespuesta<{data: Especialidad[]}>(await apiFetch('/api/v1/especialidades')); setDatos(respuesta.data); setError(''); }
    catch (e) { setError((e as Error).message); }
    finally { setCargando(false); }
  };
  useEffect(() => { void cargar(); }, []);
  const visibles = datos.filter(item => item.nombre.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(buscar.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
  const guardar = async (event: FormEvent) => {
    event.preventDefault(); if (guardando) return; setGuardando(true); setError('');
    try { await leerRespuesta(await apiFetch('/api/v1/especialidades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre }) })); setNombre(''); setAbierto(false); await cargar(); }
    catch (e) { setError((e as Error).message); } finally { setGuardando(false); }
  };
  const cambiarEstado = async (item: Especialidad) => {
    if (guardando) return; setGuardando(true); setError('');
    try { await leerRespuesta(await apiFetch('/api/v1/especialidades/' + item.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activo: !item.activo }) })); await cargar(); }
    catch (e) { setError((e as Error).message); } finally { setGuardando(false); }
  };
  return <div className="usuarios-contenido especialidades-vista">
    <div className="especialidades-barra"><label><Icon name="search" size={17}/><input type="search" value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar especialidad" aria-label="Buscar especialidad"/></label><span className="usuarios-contador">{visibles.length} especialidades</span>{puedeGestionar && <button className="usuarios-accion" type="button" onClick={() => { setError(''); setAbierto(true); }}><Icon name="plus" size={17}/> Nueva especialidad</button>}</div>
    {error && <p role="alert" className="usuarios-modal-error">{error}</p>}
    {cargando ? <p role="status">Cargando especialidades…</p> : <div className="especialidades-tabla"><table><thead><tr><th>Especialidad</th><th>Estado</th>{puedeGestionar && <th>Acciones</th>}</tr></thead><tbody>{visibles.map(item => <tr key={item.id}><td>{item.nombre}</td><td><span className={item.activo ? 'especialidad-activa' : 'especialidad-inactiva'}>{item.activo ? 'Activa' : 'Inactiva'}</span></td>{puedeGestionar && <td><button type="button" disabled={guardando} onClick={() => void cambiarEstado(item)} aria-label={`${item.activo ? 'Desactivar' : 'Activar'} ${item.nombre}`}>{item.activo ? 'Desactivar' : 'Activar'}</button></td>}</tr>)}</tbody></table>{!visibles.length && <p>No se encontraron especialidades.</p>}</div>}
    {abierto && <div className="usuarios-modal-fondo" onMouseDown={() => !guardando && setAbierto(false)}><form className="usuarios-modal" role="dialog" aria-modal="true" aria-labelledby="especialidad-titulo" onSubmit={guardar} onMouseDown={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape' && !guardando) setAbierto(false); }}><header><h3 id="especialidad-titulo">Nueva especialidad</h3><button type="button" aria-label="Cerrar" onClick={() => setAbierto(false)}>×</button></header><div className="usuarios-modal-grid"><label>Nombre de la especialidad<input autoFocus required maxLength={120} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Cardiología"/></label></div><footer><button type="button" disabled={guardando} onClick={() => setAbierto(false)}>Cancelar</button><button type="submit" disabled={guardando || !nombre.trim()}>{guardando ? 'Guardando…' : 'Guardar especialidad'}</button></footer></form></div>}
  </div>;
}
