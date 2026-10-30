import { useEffect, useState } from 'react';
import Icon from '@ui/components/Icon';
import PaginacionTabla from '@ui/components/PaginacionTabla';
import { apiFetch } from '@ui/auth';
import { leerRespuesta } from '../accesos';
import ModalRegistroPaciente, { type PacienteRegistrado } from './ModalRegistroPaciente';

type Pagina = { data: PacienteRegistrado[]; total: number; last_page: number };
const nombreCompleto = (p: PacienteRegistrado) => [p.nombres, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(' ');

export function PacientesUsuariosView({ puedeCrear = true }: { puedeCrear?: boolean }) {
  const [buscar, setBuscar] = useState('');
  const [pacientes, setPacientes] = useState<PacienteRegistrado[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [seleccionado, setSeleccionado] = useState<PacienteRegistrado | null>(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [filas, setFilas] = useState(20);
  const [total, setTotal] = useState(0);
  const [paginas, setPaginas] = useState(1);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true); setError('');
    const params = new URLSearchParams({ buscar, page: String(pagina), por_pagina: String(filas) });
    const timer = window.setTimeout(async () => {
      try {
        const datos = await leerRespuesta<Pagina>(await apiFetch('/api/v1/pacientes?' + params, { signal: controller.signal }));
        if (!controller.signal.aborted) { setPacientes(datos.data); setTotal(datos.total); setPaginas(datos.last_page); }
      } catch (causa) {
        if (!controller.signal.aborted) { setPacientes([]); setTotal(0); setError(causa instanceof Error ? causa.message : 'No se pudieron cargar los pacientes.'); }
      } finally { if (!controller.signal.aborted) setCargando(false); }
    }, 200);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [buscar, pagina, filas, recarga]);

  return <div className="usuarios-contenido">
    <div className="usuarios-filtros">
      <label className="usuarios-buscador-ventas"><Icon name="search" size={17} /><input type="search" maxLength={100} value={buscar} onChange={event => { setBuscar(event.target.value); setPagina(1); }} placeholder="Buscar paciente por nombre, apellido o CI" aria-label="Buscar paciente" /></label>
      <span className="usuarios-contador">{total} pacientes</span>
      <button type="button" onClick={() => setRecarga(valor => valor + 1)}>Actualizar</button>
      {puedeCrear && <button className="usuarios-accion" onClick={() => { setMensaje(''); setAbierto(true); }}><Icon name="plus" size={17} />Registrar paciente</button>}
    </div>
    {error && <p className="usuarios-modal-error" role="alert">{error}</p>}
    {mensaje && <p className="pacientes-registro-exito" role="status">{mensaje}</p>}
    <PaginacionTabla total={total} filas={filas} pagina={pagina} totalPaginas={paginas} onFilas={cantidad => { setFilas(cantidad); setPagina(1); }} onPagina={setPagina} />
    <div className="usuarios-tabla pacientes-usuarios-tabla" role="table" aria-label="Pacientes registrados" aria-busy={cargando}>
      <div className="usuarios-tabla-head" role="row">{['N°', 'Paciente', 'CI', 'Nacimiento', 'Género', 'Acciones'].map(columna => <span key={columna} role="columnheader">{columna}</span>)}</div>
      {!cargando && pacientes.map((paciente, indice) => <div className="usuarios-tabla-fila" key={paciente.id} role="row">
        <span role="cell">{(pagina - 1) * filas + indice + 1}</span><strong role="cell">{nombreCompleto(paciente)}</strong><span role="cell">{paciente.ci}</span><span role="cell">{paciente.fecha_nacimiento.slice(0, 10).split('-').reverse().join('/')}</span><span role="cell">{paciente.genero}</span>
        <div role="cell" className="usuarios-acciones"><button type="button" aria-label={'Ver paciente ' + nombreCompleto(paciente)} onClick={() => setSeleccionado(paciente)}><Icon name="eye" size={16} /></button></div>
      </div>)}
      {cargando && <div className="usuarios-vacio" role="status">Cargando pacientes…</div>}
      {!cargando && !pacientes.length && !error && <div className="usuarios-vacio"><Icon name="users" size={25} /><strong>{buscar ? 'No hay pacientes que coincidan con la búsqueda' : 'No hay pacientes registrados'}</strong><small>Los registros se comparten con el sistema clínico.</small></div>}
    </div>
    {abierto && <ModalRegistroPaciente onCerrar={() => setAbierto(false)} onRegistrado={paciente => {
      setBuscar(''); setPagina(1); setRecarga(valor => valor + 1);
      setMensaje(`${nombreCompleto(paciente)} se registró correctamente y está disponible en ambos sistemas.`);
    }} />}
    {seleccionado && <div className="usuarios-modal-fondo" onMouseDown={event => { if (event.target === event.currentTarget) setSeleccionado(null); }}>
      <section className="usuarios-modal" role="dialog" aria-modal="true" aria-labelledby="detalle-paciente-titulo" onKeyDown={event => { if (event.key === 'Escape') setSeleccionado(null); }}>
        <header><h3 id="detalle-paciente-titulo">{nombreCompleto(seleccionado)}</h3><button autoFocus type="button" aria-label="Cerrar detalle" onClick={() => setSeleccionado(null)}><Icon name="close" size={18} /></button></header>
        <dl className="usuarios-modal-grid">{[['CI', seleccionado.ci], ['Fecha de nacimiento', seleccionado.fecha_nacimiento.slice(0, 10)], ['Género', seleccionado.genero], ['Teléfono', seleccionado.telefono], ['Ciudad', seleccionado.ciudad], ['Dirección', seleccionado.direccion_domicilio]].map(([campo, valor]) => <div key={campo}><dt>{campo}</dt><dd>{valor || 'Sin registrar'}</dd></div>)}</dl>
        <footer><button type="button" onClick={() => setSeleccionado(null)}>Cerrar</button></footer>
      </section>
    </div>}
  </div>;
}
