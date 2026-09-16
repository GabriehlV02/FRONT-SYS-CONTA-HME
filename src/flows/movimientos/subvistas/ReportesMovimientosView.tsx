import Icon from '@ui/components/Icon';

export function ReportesMovimientosView() {
  return (
    <div className="movimientos-contenido">
      <div className="movimientos-filtros">
        <label>
          <Icon name="search" size={17} />
          <input
            placeholder={`Buscar en ${'reportes'}`}
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

      <div className="movimientos-tabla" role="table" aria-label="Reportes">
        <div className="movimientos-tabla-head" role="row">
          <span role="columnheader">Fecha</span>
          <span role="columnheader">Detalle</span>
          <span role="columnheader">Origen</span>
          <span role="columnheader">Destino</span>
          <span role="columnheader">Estado</span>
          <span role="columnheader">Acciones</span>
        </div>
      </div>
    </div>
  );
}
