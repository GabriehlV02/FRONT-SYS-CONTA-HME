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
      <div className="configuracion-contenido vista-pendiente" aria-label={subvista}>
        <span className="vista-pendiente-icono"><Icon name={subvistas.find(item => item.id === subvista)!.icono} size={28} /></span>
        <p>CONFIGURACIÓN</p>
        <h2>{subvistas.find(item => item.id === subvista)!.nombre}</h2>
        <span>{subvistas.find(item => item.id === subvista)!.descripcion}</span>
        <small>Esta sección está en preparación.</small>
      </div>
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
