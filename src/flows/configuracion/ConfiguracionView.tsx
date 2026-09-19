import { useState } from 'react';
import Icon from '@ui/components/Icon';
import type { IconName } from '@ui/components/Icon';
import { BotonSubvista } from '@ui/components/BotonSubvista';
import { HorizontalSubvistaNav } from '@ui/components/HorizontalSubvistaNav';
import './ConfiguracionView.css';

type SubvistaConfiguracion = 'usuario' | 'sistema' | 'nuevos' | 'administracion';

const subvistas: {
  id: SubvistaConfiguracion;
  nombre: string;
  icono: IconName;
  descripcion: string;
}[] = [
  { id: 'usuario', nombre: 'Usuario', icono: 'users', descripcion: 'Preferencias de la cuenta y datos de acceso.' },
  { id: 'sistema', nombre: 'Sistema', icono: 'settings', descripcion: 'Parámetros generales del sistema.' },
  { id: 'nuevos', nombre: 'Nuevos', icono: 'plus', descripcion: 'Opciones para nuevos registros.' },
  { id: 'administracion', nombre: 'Administración', icono: 'building', descripcion: 'Ajustes administrativos del hospital.' },
];

export function ConfiguracionView() {
  const [subvista, setSubvista] = useState<SubvistaConfiguracion>('usuario');
  const [sucursales, setSucursales] = useState(['Hospital María Esperanza', 'Centro de Hemodialisis', 'Policonsultorio-Diabetes']);
  const [cajas, setCajas] = useState([{ id: 1, nombre: 'Caja 01 · Recepción', sucursal: 'Hospital María Esperanza', estado: 'Abierta' }, { id: 2, nombre: 'Caja 02 · Farmacia', sucursal: 'Hospital María Esperanza', estado: 'Cerrada' }]);
  const [nuevaSucursal, setNuevaSucursal] = useState('');
  const [nuevaCaja, setNuevaCaja] = useState('');
  const [sucursalCaja, setSucursalCaja] = useState(sucursales[0]);
  const crearSucursal = () => { const nombre = nuevaSucursal.trim(); if (!nombre || sucursales.some(item => item.toLowerCase() === nombre.toLowerCase())) return; setSucursales(actual => [...actual, nombre]); setSucursalCaja(nombre); setNuevaSucursal(''); };
  const crearCaja = () => { const nombre = nuevaCaja.trim(); if (!nombre || !sucursalCaja) return; setCajas(actual => [...actual, { id: Date.now(), nombre, sucursal: sucursalCaja, estado: 'Cerrada' }]); setNuevaCaja(''); };

  return (
    <section className="configuracion-vista">
      <HorizontalSubvistaNav className="configuracion-subvistas" ariaLabel="Opciones de configuración">
        {subvistas.map((item) => (
          <BotonSubvista
            key={item.id}
            nombre={item.nombre}
            icono={item.icono}
            activa={subvista === item.id}
            onSeleccionar={() => setSubvista(item.id)}
            claseIcono="configuracion-subvista-icono"
          />
        ))}
      </HorizontalSubvistaNav>
      {subvista === 'nuevos' ? <div className="configuracion-nuevos" aria-label="Nuevas sucursales y cajas">
        <header><div><p>CONFIGURACIÓN OPERATIVA</p><h2>Sucursales y cajas</h2><small>Las cajas se gestionan dentro de una sucursal para mantener el control de ventas y cierres.</small></div></header>
        <div className="configuracion-nuevos-grid">
          <section><div className="configuracion-nuevos-head"><span><Icon name="building" size={19}/></span><div><strong>Sucursales</strong><small>{sucursales.length} registradas</small></div></div><div className="configuracion-form-linea"><input value={nuevaSucursal} onChange={event => setNuevaSucursal(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') crearSucursal(); }} placeholder="Nombre de la nueva sucursal" /><button type="button" className="configuracion-primario" onClick={crearSucursal}><Icon name="plus" size={16}/> Crear</button></div><div className="configuracion-lista">{sucursales.map(sucursal => <article key={sucursal}><Icon name="building" size={17}/><strong>{sucursal}</strong><span>Activa</span></article>)}</div></section>
          <section><div className="configuracion-nuevos-head"><span><Icon name="cash" size={19}/></span><div><strong>Cajas</strong><small>{cajas.length} registradas</small></div></div><div className="configuracion-form-caja"><input value={nuevaCaja} onChange={event => setNuevaCaja(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') crearCaja(); }} placeholder="Ej. Caja 03 · Laboratorio" /><select value={sucursalCaja} onChange={event => setSucursalCaja(event.target.value)}>{sucursales.map(sucursal => <option key={sucursal}>{sucursal}</option>)}</select><button type="button" className="configuracion-primario" onClick={crearCaja}><Icon name="plus" size={16}/> Crear caja</button></div><div className="configuracion-lista">{cajas.map(caja => <article key={caja.id}><Icon name="cash" size={17}/><div><strong>{caja.nombre}</strong><small>{caja.sucursal}</small></div><button type="button" className={caja.estado === 'Abierta' ? 'caja-abierta' : ''} onClick={() => setCajas(actual => actual.map(item => item.id === caja.id ? { ...item, estado: item.estado === 'Abierta' ? 'Cerrada' : 'Abierta' } : item))}>{caja.estado === 'Abierta' ? 'Cerrar caja' : 'Abrir caja'}</button></article>)}</div></section>
        </div>
      </div> : <div className="configuracion-contenido vista-pendiente" aria-label={subvista}>
        <span className="vista-pendiente-icono"><Icon name={subvistas.find(item => item.id === subvista)!.icono} size={28} /></span>
        <p>CONFIGURACIÓN</p>
        <h2>{subvistas.find(item => item.id === subvista)!.nombre}</h2>
        <span>{subvistas.find(item => item.id === subvista)!.descripcion}</span>
        <small>Esta sección está en preparación.</small>
      </div>}
    </section>
  );
}

export function FacturacionSiatView() {
  return <section className="vista-pendiente" aria-label="Facturación SIAT">
    <span className="vista-pendiente-icono"><Icon name="fileText" size={28} /></span>
    <p>ADMINISTRACIÓN</p>
    <h2>Facturación SIAT</h2>
    <span>Parámetros fiscales y emisión electrónica.</span>
    <small>Esta sección está en preparación.</small>
  </section>;
}
