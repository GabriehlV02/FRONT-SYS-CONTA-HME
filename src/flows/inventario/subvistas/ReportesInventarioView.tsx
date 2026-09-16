import Icon from '@ui/components/Icon';

export function ReportesInventarioView() {
  return (
    <div className="inventario-contenido">
      <div className="inventario-filtros">
        <label>
          <Icon name="search" size={17} />
          <input
            placeholder="Buscar reporte"
            aria-label="Buscar en inventario"
          />
        </label>
        <select aria-label="Direccion de orden">
          <option>Ascendente</option>
          <option>Descendente</option>
        </select>
        <select aria-label="Filtrar por categoria">
          <option>Categoria</option>
        </select>
        <select aria-label="Campo para ordenar">
          <option>Ordenar por: nombre</option>
          <option>Codigo</option>
          <option>Categoria</option>
          <option>Otro</option>
        </select>
        <span className="inventario-contador">0 registros</span>
      </div>

      <div className="inventario-tabla" role="table" aria-label="Reportes">
        <div className="inventario-tabla-head" role="row">
          <span role="columnheader">Nombre</span>
          <span role="columnheader">Categoria</span>
          <span role="columnheader">Precio / costo</span>
          <span role="columnheader">Estado</span>
          <span role="columnheader">Acciones</span>
        </div>
      </div>
    </div>
  );
}
