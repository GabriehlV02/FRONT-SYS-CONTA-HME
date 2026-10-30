import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { apiFetch } from '@ui/auth';
import Icon from '@ui/components/Icon';
import PaginacionTabla from '@ui/components/PaginacionTabla';
import './MedicosProfesionalesView.css';

type Usuario = {id:string;nombres:string;apellidos:string|null;ci:string|null;usuario:string;estado:string};
type Profesional = {id:string;usuario_id:string|null;usuario?:Usuario|null;nombres:string;apellidos:string;ci:string|null;tipo:string;especialidades:string[];rol:string;matricula:string|null;telefono:string|null;activo:boolean};
const vacio = {usuario_id:'',tipo:'Médico/a',especialidad:'',rol:'',matricula:'',telefono:'',activo:true};
async function respuesta<T>(r:Response):Promise<T> {
  const d=await r.json();
  if(!r.ok) throw new Error(Object.values(d.errors || {}).flat().join(' ') || d.message || 'No se pudo completar la operación.');
  return d;
}

export function MedicosProfesionalesView({puedeGestionar=false}:{puedeGestionar?:boolean}) {
  const [profesionales,setProfesionales]=useState<Profesional[]>([]);
  const [usuarios,setUsuarios]=useState<Usuario[]>([]);
  const [formulario,setFormulario]=useState(vacio);
  const [buscarUsuario,setBuscarUsuario]=useState('');
  const [mostrandoUsuarios,setMostrandoUsuarios]=useState(false);
  const [opcionActiva,setOpcionActiva]=useState(-1);
  const [busqueda,setBusqueda]=useState('');
  const [tipoFiltro,setTipoFiltro]=useState('Todos');
  const [abierto,setAbierto]=useState(false);
  const [editando,setEditando]=useState<string|null>(null);
  const [guardando,setGuardando]=useState(false);
  const [cargando,setCargando]=useState(true);
  const [error,setError]=useState('');
  const [filas,setFilas]=useState(20);
  const [pagina,setPagina]=useState(1);

  const cargar=async()=>{
    setCargando(true);
    try {
      const datos=await respuesta<{data:Profesional[]}>(await apiFetch('/api/v1/inventario/profesionales'));
      setProfesionales(datos.data);setError('');
      if(puedeGestionar) {
        const opciones=await respuesta<{usuarios:Usuario[]}>(await apiFetch('/api/v1/inventario/profesionales/opciones'));
        setUsuarios(opciones.usuarios);
      }
    } catch(causa) {setError((causa as Error).message);}
    finally {setCargando(false);}
  };
  useEffect(()=>{void cargar();},[puedeGestionar]);

  const seleccionable=(u:Usuario)=>!profesionales.some(p=>p.usuario_id===u.id && p.id!==editando);
  const usuarioSeleccionado=usuarios.find(u=>u.id===formulario.usuario_id);
  const normalizar=(valor:string)=>valor.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim();
  const opciones=usuarios.filter(u=>seleccionable(u) && normalizar(`${u.nombres} ${u.apellidos || ''} ${u.ci || ''} ${u.usuario}`).includes(normalizar(buscarUsuario)));
  const listaAbierta=mostrandoUsuarios && buscarUsuario.trim().length>0;
  const visibles=useMemo(()=>profesionales.filter(p=>(tipoFiltro==='Todos' || p.tipo===tipoFiltro) && `${p.nombres} ${p.apellidos} ${p.ci || ''} ${p.especialidades.join(' ')} ${p.rol}`.toLocaleLowerCase().includes(busqueda.toLocaleLowerCase())),[profesionales,tipoFiltro,busqueda]);
  const paginas=Math.max(1,Math.ceil(visibles.length/filas)),actual=Math.min(pagina,paginas);

  function abrir(p?:Profesional) {
    const usuario=usuarios.find(u=>u.id===p?.usuario_id);
    setEditando(p?.id || null);setBuscarUsuario(usuario?`${usuario.nombres} ${usuario.apellidos || ''} · ${usuario.usuario}`:'');setError('');
    setMostrandoUsuarios(false);setOpcionActiva(-1);
    setFormulario(p?{usuario_id:p.usuario_id || '',tipo:p.tipo,especialidad:p.especialidades.join('\n'),rol:p.rol,matricula:p.matricula || '',telefono:p.telefono || '',activo:p.activo}:vacio);
    setAbierto(true);
  }
  function cerrar(){if(!guardando){setAbierto(false);setFormulario(vacio);setEditando(null);}}
  function seleccionarUsuario(usuario:Usuario) {
    setFormulario({...formulario,usuario_id:usuario.id});
    setBuscarUsuario(`${usuario.nombres} ${usuario.apellidos || ''} · ${usuario.usuario}`);
    setMostrandoUsuarios(false);setOpcionActiva(-1);
  }
  async function guardar(e:FormEvent) {
    e.preventDefault();if(guardando)return;setGuardando(true);setError('');
    try {
      await respuesta(await apiFetch('/api/v1/inventario/profesionales'+(editando?'/'+editando:''),{
        method:editando?'PUT':'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...formulario,matricula:formulario.matricula.trim() || null,especialidades:formulario.especialidad.split('\n').map(v=>v.trim()).filter(Boolean)}),
      }));
      setAbierto(false);setFormulario(vacio);setEditando(null);await cargar();
    } catch(causa){setError((causa as Error).message);}
    finally{setGuardando(false);}
  }

  return <section className="profesionales-vista">
    <div className="profesionales-barra">
      <label className="profesionales-buscador"><Icon name="search" size={17}/><input value={busqueda} onChange={e=>{setBusqueda(e.target.value);setPagina(1);}} placeholder="Buscar por nombre, CI o especialidad"/></label>
      <label className="profesionales-filtro"><span>Tipo</span><select value={tipoFiltro} onChange={e=>{setTipoFiltro(e.target.value);setPagina(1);}}><option>Todos</option><option>Médico/a</option><option>Enfermero/a</option><option>Otro profesional</option></select></label>
      <span className="profesionales-contador">{visibles.length} registros</span>
      {puedeGestionar && <button className="profesionales-nuevo" type="button" disabled={cargando} onClick={()=>abrir()}><Icon name="plus" size={17}/>Asignar profesional</button>}
    </div>
    {error && !abierto && <p role="alert">{error}</p>}{cargando && <p role="status">Cargando profesionales…</p>}
    <PaginacionTabla total={visibles.length} filas={filas} pagina={actual} totalPaginas={paginas} onFilas={n=>{setFilas(n);setPagina(1);}} onPagina={setPagina}/>
    <div className="profesionales-tabla">
      <div className="profesionales-head">{['N°','Nombre completo','Tipo','Especialidad','Función','CI','Matrícula','Contacto'].map(c=><span key={c}>{c}</span>)}</div>
      {visibles.slice((actual-1)*filas,actual*filas).map((p,i)=><article key={p.id}>
        <span>{(actual-1)*filas+i+1}</span><strong>{p.nombres} {p.apellidos}{!p.activo && <small> · Inactivo</small>}{puedeGestionar && <button type="button" aria-label={'Editar '+p.nombres} onClick={()=>abrir(p)}><Icon name="edit" size={14}/></button>}</strong>
        <span><i>{p.tipo}</i></span><span className="profesionales-especialidades">{p.especialidades.length?p.especialidades.map(e=><b key={e}>{e}</b>):'Sin especialidad'}</span><span>{p.rol}</span><span>{p.ci || '—'}</span><span>{p.matricula || '—'}</span><span>{p.telefono || '—'}</span>
      </article>)}
      {!cargando && !visibles.length && <div className="profesionales-vacio">No se encontraron profesionales. Selecciona un usuario registrado para asignarle su perfil.</div>}
    </div>
    {abierto && <div className="profesionales-fondo" onMouseDown={cerrar}>
      <form className="profesionales-modal" role="dialog" aria-modal="true" aria-labelledby="profesional-titulo" onSubmit={guardar} onMouseDown={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Escape')cerrar();}}>
        <header><div><p>PERFIL PROFESIONAL</p><h3 id="profesional-titulo">{editando?'Editar asignación':'Asignar usuario como profesional'}</h3></div><button type="button" aria-label="Cerrar" disabled={guardando} onClick={cerrar}><Icon name="close" size={18}/></button></header>
        <fieldset className="profesionales-campos" disabled={guardando} style={{border:0,margin:0,minWidth:0}}>
          <div className="profesionales-usuario-autocompletar">
            <label htmlFor="profesional-buscar-usuario">Buscar usuario *</label>
            <input id="profesional-buscar-usuario" autoFocus autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={listaAbierta} aria-controls="profesional-usuarios" aria-describedby="profesional-usuario-ayuda" aria-activedescendant={listaAbierta && opcionActiva>=0?`profesional-usuario-${opcionActiva}`:undefined}
              value={buscarUsuario} onChange={e=>{setBuscarUsuario(e.target.value);setFormulario({...formulario,usuario_id:''});setMostrandoUsuarios(true);setOpcionActiva(-1);}}
              onFocus={()=>{if(!formulario.usuario_id)setMostrandoUsuarios(true);}} onBlur={()=>setMostrandoUsuarios(false)}
              onKeyDown={e=>{
                if(e.key==='Escape' && listaAbierta){e.preventDefault();e.stopPropagation();setMostrandoUsuarios(false);return;}
                if(e.key==='ArrowDown' || e.key==='ArrowUp') {
                  e.preventDefault();setMostrandoUsuarios(true);
                  const siguiente=e.key==='ArrowDown'?Math.min(opcionActiva+1,opciones.length-1):Math.max(opcionActiva-1,0);
                  setOpcionActiva(siguiente);document.getElementById(`profesional-usuario-${siguiente}`)?.scrollIntoView({block:'nearest'});
                }
                if(e.key==='Enter' && listaAbierta){e.preventDefault();if(opcionActiva>=0 && opciones[opcionActiva])seleccionarUsuario(opciones[opcionActiva]);}
              }} placeholder="Escribe nombre, usuario o CI"/>
            {listaAbierta && <div className="profesionales-usuario-resultados" id="profesional-usuarios" role="listbox" aria-label="Usuarios registrados">
              {opciones.map((u,i)=><div key={u.id} id={`profesional-usuario-${i}`} role="option" aria-selected={opcionActiva===i} className="profesionales-usuario-opcion" onMouseDown={e=>e.preventDefault()} onClick={()=>seleccionarUsuario(u)}>
                <strong>{u.nombres} {u.apellidos}</strong><small>@{u.usuario} · CI: {u.ci || 'Sin CI'}{u.estado==='INACTIVO'?' · Cuenta inactiva':''}</small>
              </div>)}
              {!opciones.length && <p>No hay usuarios disponibles que coincidan.</p>}
            </div>}
            <small id="profesional-usuario-ayuda" role="status">{usuarioSeleccionado?'Usuario seleccionado. Sus datos se completaron automáticamente.':listaAbierta?`${opciones.length} coincidencias. Selecciona un usuario para continuar.`:'Escribe y selecciona un usuario de las coincidencias.'}</small>
          </div>
          <label>Nombre completo<input readOnly value={usuarioSeleccionado?[usuarioSeleccionado.nombres,usuarioSeleccionado.apellidos].filter(Boolean).join(' '):''}/></label><label>CI<input readOnly value={usuarioSeleccionado?.ci || ''} placeholder="Sin CI registrado"/></label>
          <label>Tipo de profesional *<select value={formulario.tipo} onChange={e=>setFormulario({...formulario,tipo:e.target.value})}><option>Médico/a</option><option>Enfermero/a</option><option>Otro profesional</option></select></label>
          <label>Estado del perfil<select value={formulario.activo?'1':'0'} onChange={e=>setFormulario({...formulario,activo:e.target.value==='1'})}><option value="1">Activo</option><option value="0">Inactivo</option></select></label>
          <label className="profesionales-especialidad-campo">Especialidades (opcional)<small>Una por línea, cuando corresponda.</small><textarea rows={3} value={formulario.especialidad} onChange={e=>setFormulario({...formulario,especialidad:e.target.value})}/></label>
          <label>Función en procedimientos (opcional)<input maxLength={100} value={formulario.rol} onChange={e=>setFormulario({...formulario,rol:e.target.value})} placeholder="Ej. Cirujano o instrumentista"/></label>
          <label>Matrícula profesional (opcional)<input maxLength={60} value={formulario.matricula} onChange={e=>setFormulario({...formulario,matricula:e.target.value})}/></label><label>Teléfono (opcional)<input maxLength={30} value={formulario.telefono} onChange={e=>setFormulario({...formulario,telefono:e.target.value})}/></label>
        </fieldset>
        {error && <p role="alert" style={{padding:'0 24px',color:'#b91c1c'}}>{error}</p>}
        <footer><button type="button" disabled={guardando} onClick={cerrar}>Cancelar</button><button type="submit" disabled={guardando || !formulario.usuario_id}>{guardando?'Guardando…':'Guardar asignación'}</button></footer>
      </form>
    </div>}
  </section>;
}
