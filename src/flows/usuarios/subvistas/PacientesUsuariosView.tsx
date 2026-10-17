import { useEffect, useRef, useState, type FormEvent } from 'react';
import Icon from '@ui/components/Icon';
import PaginacionTabla from '@ui/components/PaginacionTabla';
import { apiFetch } from '@ui/auth';
import { leerRespuesta } from '../accesos';

type UsuarioPaciente = { id: string; nombres: string; apellidos: string | null; usuario: string; ci: string; estado: 'ACTIVO' | 'INACTIVO' };
type Pagina = { data: UsuarioPaciente[]; total: number; last_page: number };
const formularioInicial = { nombre: '', ci: '', usuario: '', password: '', password_confirmation: '' };

export function PacientesUsuariosView({ puedeCrear = true }: { puedeCrear?: boolean }) {
  const [buscar, setBuscar] = useState('');
  const [estado, setEstado] = useState('');
  const [usuarios, setUsuarios] = useState<UsuarioPaciente[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [seleccionado, setSeleccionado] = useState<UsuarioPaciente | null>(null);
  const [form, setForm] = useState(formularioInicial);
  const [error, setError] = useState('');
  const [errorFormulario, setErrorFormulario] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [filas, setFilas] = useState(20);
  const [total, setTotal] = useState(0);
  const [paginas, setPaginas] = useState(1);
  const [recarga, setRecarga] = useState(0);
  const nombreInput = useRef<HTMLInputElement>(null);
  const ultimoBoton = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true); setError('');
    const params = new URLSearchParams({ buscar, page: String(pagina), por_pagina: String(filas) });
    if (estado) params.set('estado', estado);
    const timer = window.setTimeout(async () => {
      try {
        const datos = await leerRespuesta<Pagina>(await apiFetch('/api/v1/pacientes-usuarios?' + params, { signal: controller.signal }));
        if (!controller.signal.aborted) { setUsuarios(datos.data); setTotal(datos.total); setPaginas(datos.last_page); }
      } catch (error) {
        if (!controller.signal.aborted) { setUsuarios([]); setError(error instanceof Error ? error.message : 'No se pudieron cargar las cuentas de pacientes.'); }
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    }, 200);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [buscar, estado, pagina, filas, recarga]);

  useEffect(() => { if (abierto && !seleccionado) nombreInput.current?.focus(); }, [abierto, seleccionado]);

  function abrir(boton: HTMLButtonElement, paciente: UsuarioPaciente | null = null) {
    ultimoBoton.current = boton;
    setSeleccionado(paciente);
    setForm(paciente ? { ...formularioInicial, nombre: [paciente.nombres, paciente.apellidos].filter(Boolean).join(' '), ci: paciente.ci || '', usuario: paciente.usuario } : formularioInicial);
    setErrorFormulario(''); setMensaje(''); setAbierto(true);
  }
  function cerrar() {
    if (guardando) return;
    setAbierto(false); setSeleccionado(null); setForm(formularioInicial); setErrorFormulario('');
    requestAnimationFrame(() => ultimoBoton.current?.focus());
  }
  function actualizar(campo: keyof typeof form, valor: string) {
    setForm(actual => ({ ...actual, [campo]: valor })); setErrorFormulario('');
  }
  async function registrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (guardando || seleccionado) return;
    setGuardando(true); setErrorFormulario('');
    try {
      await leerRespuesta(await apiFetch('/api/v1/pacientes-usuarios', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, nombre: form.nombre.trim(), ci: form.ci.trim(), usuario: form.usuario.trim() }),
      }));
      setAbierto(false); setForm(formularioInicial);
      setBuscar(''); setEstado(''); setPagina(1); setRecarga(valor => valor + 1);
      setMensaje('La cuenta del paciente se registró correctamente.');
      requestAnimationFrame(() => ultimoBoton.current?.focus());
    } catch (error) {
      setErrorFormulario(error instanceof Error ? error.message : 'No se pudo registrar la cuenta del paciente.');
    } finally {
      setGuardando(false);
    }
  }
  return <div className="usuarios-contenido">
    <div className="usuarios-filtros">
      <label className="usuarios-buscador-ventas"><Icon name="search" size={17} /><input type="search" maxLength={100} value={buscar} onChange={event => { setBuscar(event.target.value); setPagina(1); }} placeholder="Buscar paciente, CI o usuario" aria-label="Buscar paciente, CI o usuario" /></label>
      <select value={estado} aria-label="Filtrar pacientes por estado" onChange={event => { setEstado(event.target.value); setPagina(1); }}><option value="">Todos los estados</option><option value="ACTIVO">Activos</option><option value="INACTIVO">Inactivos</option></select>
      <span className="usuarios-contador">{total} registros</span>
      {puedeCrear && <button className="usuarios-accion" onClick={event => abrir(event.currentTarget)}><Icon name="plus" size={17} />Registrar usuario</button>}
    </div>
    {error && <p className="usuarios-modal-error" role="alert">{error}</p>}
    {mensaje && <p className="pacientes-registro-exito" role="status">{mensaje}</p>}
    {total > 20 && <PaginacionTabla total={total} filas={filas} pagina={pagina} totalPaginas={paginas} onFilas={cantidad => { setFilas(cantidad); setPagina(1); }} onPagina={setPagina} />}
    <div className="usuarios-tabla pacientes-usuarios-tabla" role="table" aria-label="Pacientes con usuario" aria-busy={cargando}>
      <div className="usuarios-tabla-head" role="row">{['N°', 'Paciente', 'CI', 'Usuario', 'Estado', 'Acciones'].map(columna => <span key={columna} role="columnheader">{columna}</span>)}</div>
      {!cargando && usuarios.map((paciente, indice) => <div className="usuarios-tabla-fila" key={paciente.id} role="row">
        <span role="cell">{(pagina - 1) * filas + indice + 1}</span><strong role="cell">{[paciente.nombres, paciente.apellidos].filter(Boolean).join(' ')}</strong><span role="cell">{paciente.ci || '—'}</span><span role="cell">{paciente.usuario}</span><span role="cell" className="estado-activo">{paciente.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}</span>
        <div role="cell" className="usuarios-acciones"><button type="button" aria-label={'Ver paciente ' + paciente.nombres} onClick={event => abrir(event.currentTarget, paciente)}><Icon name="eye" size={16} /></button></div>
      </div>)}
      {cargando && <div className="usuarios-vacio" role="status">Cargando cuentas de pacientes…</div>}
      {!cargando && !usuarios.length && !error && <div className="usuarios-vacio"><Icon name="users" size={25} /><strong>{buscar || estado ? 'No hay pacientes que coincidan con los filtros' : 'No hay pacientes con usuario'}</strong><small>Registra el acceso de un paciente al portal de estudios.</small></div>}
    </div>
    {abierto && <div className="usuarios-modal-fondo" onMouseDown={cerrar}>
      <form className="usuarios-modal" role="dialog" aria-modal="true" aria-labelledby="paciente-modal-titulo" onSubmit={registrar} onMouseDown={event => event.stopPropagation()} onKeyDown={event => {
        if (event.key === 'Escape') cerrar();
        if (event.key === 'Tab') {
          const elementos = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled)'));
          const primero = elementos[0], ultimo = elementos[elementos.length - 1];
          if (event.shiftKey && document.activeElement === primero) { event.preventDefault(); ultimo?.focus(); }
          else if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primero?.focus(); }
        }
      }}>
        <header><div><p>USUARIO PACIENTE</p><h3 id="paciente-modal-titulo">{seleccionado ? 'Detalle del paciente' : 'Registrar acceso'}</h3></div><button type="button" disabled={guardando} aria-label="Cerrar registro de paciente" autoFocus={!!seleccionado} onClick={cerrar}><Icon name="close" size={18} /></button></header>
        <div className="usuarios-modal-grid">
          <label>Nombre completo<input ref={nombreInput} required maxLength={100} autoComplete="name" value={form.nombre} disabled={!!seleccionado || guardando} onChange={event => actualizar('nombre', event.target.value)} /></label>
          <label>CI<input required maxLength={25} value={form.ci} disabled={!!seleccionado || guardando} onChange={event => actualizar('ci', event.target.value)} /></label>
          <label>Usuario<input required maxLength={60} autoComplete="username" value={form.usuario} disabled={!!seleccionado || guardando} onChange={event => actualizar('usuario', event.target.value)} /></label>
          {!seleccionado && <><label>Contraseña<input required type="password" minLength={8} maxLength={255} autoComplete="new-password" value={form.password} disabled={guardando} onChange={event => actualizar('password', event.target.value)} /></label><label>Confirmar contraseña<input required type="password" minLength={8} maxLength={255} autoComplete="new-password" value={form.password_confirmation} disabled={guardando} onChange={event => actualizar('password_confirmation', event.target.value)} /></label></>}
          {seleccionado && <label>Estado<input disabled value={seleccionado.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'} /></label>}
        </div>
        {errorFormulario && <p className="usuarios-modal-error" role="alert">{errorFormulario}</p>}
        <footer><button type="button" disabled={guardando} onClick={cerrar}>{seleccionado ? 'Cerrar' : 'Cancelar'}</button>{!seleccionado && <button type="submit" disabled={guardando}>{guardando ? 'Registrando…' : 'Registrar usuario'}</button>}</footer>
      </form>
    </div>}
  </div>;
}