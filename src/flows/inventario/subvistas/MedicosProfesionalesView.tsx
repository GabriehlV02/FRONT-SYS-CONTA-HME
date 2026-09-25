import { useMemo, useState, type FormEvent } from 'react';
import Icon from '@ui/components/Icon';
import PaginacionTabla from '@ui/components/PaginacionTabla';

type Profesional = { id: number; nombres: string; apellidos: string; ci: string; tipo: string; especialidad: string; rol: string; matricula: string; telefono: string };

const iniciales: Profesional[] = [
  { id: 1, nombres: 'María Elena', apellidos: 'Rojas', ci: '5684123', tipo: 'Médico/a', especialidad: 'Cirugía general', rol: 'Cirujano/a', matricula: 'MED-2841', telefono: '70000001' },
  { id: 2, nombres: 'Carla', apellidos: 'Vargas', ci: '6239145', tipo: 'Enfermero/a', especialidad: 'Quirófano', rol: 'Instrumentista', matricula: 'ENF-1948', telefono: '70000002' },
];
const vacio = { nombres: '', apellidos: '', ci: '', tipo: 'Médico/a', especialidad: '', rol: '', matricula: '', telefono: '' };

export function MedicosProfesionalesView() {
  const [profesionales, setProfesionales] = useState(iniciales);
  const [formulario, setFormulario] = useState(vacio);
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('Todos');
  const [abierto, setAbierto] = useState(false);
  const [filasTabla, setFilasTabla] = useState(20);
  const [paginaTabla, setPaginaTabla] = useState(1);
  const visibles = useMemo(() => profesionales.filter((item) => {
    const texto = `${item.nombres} ${item.apellidos} ${item.ci} ${item.especialidad} ${item.rol}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase()) && (tipoFiltro === 'Todos' || item.tipo === tipoFiltro);
  }), [profesionales, busqueda, tipoFiltro]);
  const registrar = (event: FormEvent) => {
    event.preventDefault();
    if (Object.values(formulario).some((valor) => !valor.trim())) return;
    setProfesionales((actual) => [...actual, { ...formulario, id: Date.now() }]);
    setFormulario(vacio); setAbierto(false);
  };
  const totalPaginasTabla = Math.max(1, Math.ceil(visibles.length / filasTabla));
  const paginaTablaActual = Math.min(paginaTabla, totalPaginasTabla);
  const profesionalesPagina = visibles.slice((paginaTablaActual - 1) * filasTabla, paginaTablaActual * filasTabla);

  return <section className="profesionales-vista">
    <div className="profesionales-barra">
      <label className="profesionales-buscador"><Icon name="search" size={17} /><input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar por nombre, CI o especialidad" /></label>
      <label className="profesionales-filtro"><span>Tipo</span><select value={tipoFiltro} onChange={(event) => setTipoFiltro(event.target.value)}><option>Todos</option><option>Médico/a</option><option>Enfermero/a</option><option>Otro profesional</option></select></label>
      <span className="profesionales-contador">{visibles.length} registros</span>
      <button className="profesionales-nuevo" type="button" onClick={() => setAbierto(true)}><Icon name="plus" size={17} /> Registrar profesional</button>
    </div>
    <PaginacionTabla total={visibles.length} filas={filasTabla} pagina={paginaTablaActual} totalPaginas={totalPaginasTabla} onFilas={(cantidad) => { setFilasTabla(cantidad); setPaginaTabla(1); }} onPagina={setPaginaTabla} />
    <div className="profesionales-tabla">
      <div className="profesionales-head"><span>N°</span><span>Nombre completo</span><span>Tipo</span><span>Especialidad</span><span>Rol</span><span>CI</span><span>Matrícula</span><span>Contacto</span></div>
      {visibles.length ? profesionalesPagina.map((item, indice) => <article key={item.id}><span>{(paginaTablaActual - 1) * filasTabla + indice + 1}</span><strong>{item.nombres} {item.apellidos}</strong><span><i>{item.tipo}</i></span><span className="profesionales-especialidades">{item.especialidad.split('\n').filter(Boolean).map((especialidad) => <b key={especialidad}>{especialidad}</b>)}</span><span>{item.rol}</span><span>{item.ci}</span><span>{item.matricula}</span><span>{item.telefono}</span></article>) : <div className="profesionales-vacio">No se encontraron profesionales con esos filtros.</div>}
    </div>
    {abierto && <div className="profesionales-fondo" onMouseDown={() => setAbierto(false)}><form className="profesionales-modal" onSubmit={registrar} onMouseDown={(event) => event.stopPropagation()}>
      <header><div><p>REGISTRO PROFESIONAL</p><h3>Nuevo profesional</h3></div><button aria-label="Cerrar" type="button" onClick={() => setAbierto(false)}><Icon name="close" size={18} /></button></header>
      <div className="profesionales-campos">
        <label>Nombres<input required value={formulario.nombres} onChange={(event) => setFormulario({ ...formulario, nombres: event.target.value })} /></label><label>Apellidos<input required value={formulario.apellidos} onChange={(event) => setFormulario({ ...formulario, apellidos: event.target.value })} /></label>
        <label>CI<input required value={formulario.ci} onChange={(event) => setFormulario({ ...formulario, ci: event.target.value })} /></label><label>Tipo de profesional<select value={formulario.tipo} onChange={(event) => setFormulario({ ...formulario, tipo: event.target.value })}><option>Médico/a</option><option>Enfermero/a</option><option>Otro profesional</option></select></label>
        <label className="profesionales-especialidad-campo">Especialidades <small>Registra una especialidad por línea.</small><textarea required rows={3} value={formulario.especialidad} onChange={(event) => setFormulario({ ...formulario, especialidad: event.target.value })} /></label><label>Rol en procedimientos<input required value={formulario.rol} onChange={(event) => setFormulario({ ...formulario, rol: event.target.value })} /></label>
        <label>Matrícula profesional<input required value={formulario.matricula} onChange={(event) => setFormulario({ ...formulario, matricula: event.target.value })} /></label><label>Teléfono<input required value={formulario.telefono} onChange={(event) => setFormulario({ ...formulario, telefono: event.target.value })} /></label>
      </div>
      <footer><button type="button" onClick={() => setAbierto(false)}>Cancelar</button><button type="submit">Guardar profesional</button></footer>
    </form></div>}
  </section>;
}
