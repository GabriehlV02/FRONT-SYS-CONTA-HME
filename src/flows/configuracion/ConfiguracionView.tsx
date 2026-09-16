import { useState } from 'react';
import Icon from '@ui/components/Icon';
import type { IconName } from '@ui/components/Icon';
import './ConfiguracionView.css';

type SubvistaConfiguracion = 'usuario' | 'sistema' | 'nuevos' | 'administracion';

const subvistas: {
  id: SubvistaConfiguracion;
  nombre: string;
  icono: IconName;
}[] = [
  { id: 'usuario', nombre: 'Usuario', icono: 'users' },
  { id: 'sistema', nombre: 'Sistema', icono: 'settings' },
  { id: 'nuevos', nombre: 'Nuevos', icono: 'plus' },
  { id: 'administracion', nombre: 'Administracion', icono: 'building' },
];

export function ConfiguracionView() {
  const [subvista, setSubvista] = useState<SubvistaConfiguracion>('usuario');

  return (
    <section className="configuracion-vista">
      <nav className="configuracion-subvistas" aria-label="Subvistas de configuracion">
        {subvistas.map((item) => (
          <button
            key={item.id}
            type="button"
            className={subvista === item.id ? 'activo' : undefined}
            onClick={() => setSubvista(item.id)}
          >
            <span className="configuracion-subvista-icono">
              <Icon name={item.icono} size={18} />
            </span>
            <span>{item.nombre}</span>
          </button>
        ))}
      </nav>
      <div className="configuracion-contenido" aria-label={subvista} />
    </section>
  );
}

export function FacturacionSiatView() {
  return null;
}
