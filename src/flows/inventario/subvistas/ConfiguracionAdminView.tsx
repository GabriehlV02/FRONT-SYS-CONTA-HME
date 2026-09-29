import { useEffect, useState, type FormEvent } from 'react';
import type { OpcionesInventario } from '../datos/registroOpciones';

export function ConfiguracionAdminView() {
  const [opciones, setOpciones] = useState<OpcionesInventario | null>(null);
  const [campo, setCampo] = useState('unidades');
  const [categoria, setCategoria] = useState('');
  const [nombre, setNombre] = useState('');
  const [prefijo, setPrefijo] = useState('');
  const [base, setBase] = useState('PRODUCTO');
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);
  async function cargar() {
    try {
      const r = await fetch('/api/inventario/opciones');
      if (!r.ok) throw new Error('No se pudieron cargar las opciones.');
      const { data } = await r.json(); setOpciones(data); setCategoria(Object.keys(data.categorias)[0] || ''); setMensaje('');
    } catch (e) { setMensaje((e as Error).message); }
  }
  useEffect(() => { void cargar(); }, []);
  async function guardar(event: FormEvent) {
    event.preventDefault(); if (guardando) return;
    setGuardando(true); setMensaje('');
    try {
      const r = await fetch('/api/inventario/opciones', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('contable_token') || ''}` }, body: JSON.stringify({ campo, nombre, prefijo, categoria, base }) });
      const respuesta = await r.json(); if (!r.ok) throw new Error(respuesta.message || 'No se pudo guardar.');
      setOpciones(respuesta.data); setNombre(''); setPrefijo(''); setMensaje('Opción creada. Ya está disponible al registrar un ítem.');
    } catch (e) { setMensaje((e as Error).message); } finally { setGuardando(false); }
  }
  const titulos: Record<string, string> = { unidades: 'Unidades', tipos: 'Tipos', categorias: 'Categorías', subcategorias: 'Subcategorías', clasificaciones: 'Clasificaciones / familias' };
  const filas = !opciones ? [] : campo === 'unidades' ? opciones.unidades : campo === 'clasificaciones' ? opciones.clasificaciones : campo === 'tipos' ? Object.keys(opciones.tipos) : campo === 'categorias' ? Object.keys(opciones.categorias) : opciones.categorias[categoria]?.subcategorias || [];
  const filasPara = (id: string) => !opciones ? [] : id === 'unidades' ? opciones.unidades : id === 'clasificaciones' ? opciones.clasificaciones : id === 'tipos' ? Object.keys(opciones.tipos) : id === 'categorias' ? Object.keys(opciones.categorias) : Object.entries(opciones.categorias).flatMap(([nombreCategoria, valor]) => valor.subcategorias.map(subcategoria => `${nombreCategoria} · ${subcategoria}`));
  return <section className="inventario-admin">
    <header><h2>Configuración admin</h2><p>Opciones disponibles al registrar y editar ítems.</p></header>
    {mensaje && <p role="status">{mensaje}</p>}
    {!opciones ? <button type="button" onClick={cargar}>Cargar opciones</button> : <>
      <form onSubmit={guardar}><label>Agregar en<select value={campo} onChange={e => { setCampo(e.target.value); setNombre(''); setMensaje(''); }}>{Object.entries(titulos).map(([id, titulo]) => <option key={id} value={id}>{titulo}</option>)}</select></label>
        {campo === 'subcategorias' && <label>Categoría<select required value={categoria} onChange={e => setCategoria(e.target.value)}>{Object.keys(opciones.categorias).map(valor => <option key={valor}>{valor}</option>)}</select></label>}
        <label>Nombre de la nueva opción<input required minLength={2} maxLength={60} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Escribe el nombre" /></label>
        {campo === 'categorias' && <label>Prefijo del código<input required minLength={3} maxLength={3} pattern="[A-Za-z]{3}" value={prefijo} onChange={e => setPrefijo(e.target.value.toUpperCase())} placeholder="Ej. FAR" /></label>}
        {campo === 'tipos' && <label>Comportamiento<select value={base} onChange={e => setBase(e.target.value)}><option value="PRODUCTO">Producto · controla stock</option><option value="INSUMO">Insumo · controla stock</option><option value="SERVICIO">Servicio · sin stock</option></select></label>}
        <button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Agregar opción'}</button>
      </form>
      <div className="inventario-admin-paneles">{Object.entries(titulos).map(([id, titulo]) => { const valores = filasPara(id); return <section className="inventario-admin-tabla" key={id}><h3>{titulo}</h3><table><thead><tr><th>{titulo}</th>{['categorias', 'tipos'].includes(id) && <th>{id === 'categorias' ? 'Prefijo' : 'Comportamiento'}</th>}</tr></thead><tbody>{valores.map(valor => <tr key={valor}><td>{id === 'subcategorias' ? valor.split(' · ').at(-1) : valor}</td>{id === 'categorias' && <td>{opciones.categorias[valor].prefijo}</td>}{id === 'tipos' && <td>{opciones.tipos[valor]}</td>}</tr>)}</tbody></table>{!valores.length && <p>No hay opciones.</p>}</section>; })}</div>
    </>}
  </section>;
}
