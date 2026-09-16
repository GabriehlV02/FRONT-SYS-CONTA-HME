import { useEffect, useState } from 'react';
import Icon from '@ui/components/Icon';
import {
  TraspasosNavegacion,
  type SubvistaTraspasos,
} from '../componentes/MovimientosNavegacion';

const titulos: Record<SubvistaTraspasos, string> = {
  'notas-envio': 'notas de envio',
  recepcion: 'recepciones',
  devoluciones: 'devoluciones',
  historial: 'historial',
  gestion: 'gestion',
};

export function TraspasosView({ activeId }: { activeId?: string }) {
  const resolveSubvista = (id?: string): SubvistaTraspasos => {
    if (id === 'traspasos-recepcion') return 'recepcion';
    if (id === 'traspasos-devoluciones') return 'devoluciones';
    if (id === 'traspasos-historial') return 'historial';
    if (id === 'traspasos-gestion') return 'gestion';
    return 'notas-envio';
  };
  const [subvista, setSubvista] = useState<SubvistaTraspasos>(() =>
    resolveSubvista(activeId),
  );
  useEffect(() => setSubvista(resolveSubvista(activeId)), [activeId]);

  return (
    <>
      <TraspasosNavegacion activa={subvista} onSeleccionar={setSubvista} />
      <div className="movimientos-contenido">
        <div className="movimientos-filtros">
          <label>
            <Icon name="search" size={17} />
            <input
              placeholder={`Buscar en ${titulos[subvista]}`}
              aria-label="Buscar en movimientos"
            />
          </label>
          <select aria-label="Filtrar por tipo">
            <option>Tipo</option>
          </select>
          <select aria-label="Filtrar por estado">
            <option>Todos</option>
            <option>Activos</option>
            <option>Inactivos</option>
          </select>
          <select aria-label="Filtrar por fecha">
            <option>Fecha</option>
          </select>
          <span className="movimientos-contador">0 registros</span>
        </div>

        <div
          className="movimientos-tabla"
          role="table"
          aria-label={`Traspasos - ${titulos[subvista]}`}
        >
          <div className="movimientos-tabla-head" role="row">
            <span role="columnheader">Fecha</span>
            <span role="columnheader">
              {subvista === 'gestion' ? 'Gestion' : 'Detalle'}
            </span>
            <span role="columnheader">Origen</span>
            <span role="columnheader">Destino</span>
            <span role="columnheader">Estado</span>
            <span role="columnheader">Acciones</span>
          </div>
        </div>
      </div>
    </>
  );
}
