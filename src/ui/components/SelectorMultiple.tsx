import { useId, useRef, useState } from 'react';
import Icon from './Icon';
import './SelectorMultiple.css';

export type OpcionMultiple = { id: number; nombre: string; detalle?: string; inactiva?: boolean };

type Props = { etiqueta: string; opciones: OpcionMultiple[]; seleccionados: number[]; onChange: (ids: number[]) => void; disabled?: boolean; placeholder?: string; vacio?: string };

export default function SelectorMultiple({ etiqueta, opciones, seleccionados, onChange, disabled = false, placeholder = 'Buscar por nombre o código…', vacio = 'No hay opciones disponibles.' }: Props) {
  const id = useId();
  const contenedor = useRef<HTMLDivElement>(null);
  const [buscar, setBuscar] = useState('');
  const [abierto, setAbierto] = useState(false);
  const visibles = opciones.filter(o => !o.inactiva && `${o.nombre} ${o.detalle || ''}`.toLocaleLowerCase().includes(buscar.toLocaleLowerCase()));
  const cambiar = (valor: number) => onChange(seleccionados.includes(valor) ? seleccionados.filter(i => i !== valor) : [...seleccionados, valor]);
  return <div className="selector-multiple" ref={contenedor} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setAbierto(false); }} onKeyDown={event => {
    if (event.key === 'Escape' && abierto) { event.stopPropagation(); setAbierto(false); }
  }}>
    <label htmlFor={id}>{etiqueta}</label>
    <div className="selector-multiple-control">
      <Icon name="search" size={16} />
      <input id={id} type="search" disabled={disabled} autoComplete="off" placeholder={placeholder} value={buscar} aria-expanded={abierto && !disabled} aria-controls={`${id}-opciones`} onFocus={() => setAbierto(true)} onChange={event => { setBuscar(event.target.value); setAbierto(true); }} onKeyDown={event => {
        if (event.key === 'Enter') { event.preventDefault(); if (abierto && visibles[0]) cambiar(visibles[0].id); }
        if (event.key === 'ArrowDown') { event.preventDefault(); setAbierto(true); requestAnimationFrame(() => contenedor.current?.querySelector<HTMLInputElement>('input[type="checkbox"]')?.focus()); }
      }} />
      <button type="button" disabled={disabled} aria-label={`Mostrar opciones de ${etiqueta.toLowerCase()}`} aria-expanded={abierto && !disabled} onClick={() => setAbierto(valor => !valor)}><span aria-hidden="true">▾</span></button>
    </div>
    <div className="selector-multiple-elegidos" aria-label={`${etiqueta} seleccionados`}>
      {seleccionados.map(valor => <span key={valor}>{opciones.find(o => o.id === valor)?.nombre || `Registro ${valor}`}{!disabled && <button type="button" aria-label={`Quitar ${opciones.find(o => o.id === valor)?.nombre || valor}`} onClick={() => cambiar(valor)}>×</button>}</span>)}
    </div>
    {abierto && !disabled && <div id={`${id}-opciones`} className="selector-multiple-opciones" role="group" aria-label={`Opciones de ${etiqueta.toLowerCase()}`}>
      {visibles.map(opcion => <label key={opcion.id}><input type="checkbox" checked={seleccionados.includes(opcion.id)} onChange={() => cambiar(opcion.id)} /><span>{opcion.nombre}{opcion.detalle && <small>{opcion.detalle}</small>}</span></label>)}
      {!visibles.length && <p>{buscar ? 'No hay coincidencias.' : vacio}</p>}
    </div>}
    {!seleccionados.length && <small className="selector-multiple-ayuda">{disabled ? 'Sin asignaciones' : 'Puedes seleccionar uno o varios.'}</small>}
  </div>;
}
