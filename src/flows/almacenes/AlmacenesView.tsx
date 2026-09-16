import { useEffect, useState } from 'react';
import {
  AlmacenesNavegacion,
  type SubvistaAlmacenes,
} from './AlmacenesNavegacion';
import { AlmacenesView as AlmacenesListadoView } from '../inventario/subvistas/AlmacenesView';
import { ReportesInventarioView } from '../inventario/subvistas/ReportesInventarioView';
import { StockView } from '../inventario/subvistas/StockView';

export function AlmacenesView({ activeId }: { activeId?: string }) {
  const resolveSubvista = (id?: string): SubvistaAlmacenes =>
    id === 'almacenes-almacenes'
      ? 'almacenes'
      : id === 'almacenes-reportes'
        ? 'reportes'
        : 'stock';
  const [subvista, setSubvista] = useState<SubvistaAlmacenes>(() =>
    resolveSubvista(activeId),
  );
  useEffect(() => setSubvista(resolveSubvista(activeId)), [activeId]);

  return (
    <section className="inventario-vista">
      <AlmacenesNavegacion activa={subvista} onSeleccionar={setSubvista} />
      {subvista === 'stock' && <StockView />}
      {subvista === 'almacenes' && <AlmacenesListadoView />}
      {subvista === 'reportes' && <ReportesInventarioView />}
    </section>
  );
}
