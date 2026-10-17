import { useEffect, useState } from 'react';
import {
  InventarioNavegacion,
  type SubvistaInventario,
} from './componentes/InventarioNavegacion';
import { ProductosInsumosView } from './subvistas/ProductosInsumosView';
import { ServiciosView } from './subvistas/ServiciosView';
import { ReportesInventarioView } from './subvistas/ReportesInventarioView';
import { CatalogoView } from './componentes/CatalogoView';
import { MedicosProfesionalesView } from './subvistas/MedicosProfesionalesView';
import { ConfiguracionAdminView } from './subvistas/ConfiguracionAdminView';
import './InventarioView.css';

export function InventarioView({ activeId, permisos = [] }: { activeId?: string; permisos?: string[] }) {
  const resolveSubvista = (id?: string): SubvistaInventario =>
    id === 'inventario-admin' ? 'admin' : id === 'inventario-servicios'
      ? 'servicios'
      : id === 'inventario-todo'
        ? 'todo'
        : id === 'inventario-reportes'
          ? 'reportes'
          : 'todo';
  const [subvista, setSubvista] = useState<SubvistaInventario>(() =>
    resolveSubvista(activeId),
  );
  useEffect(() => setSubvista(resolveSubvista(activeId)), [activeId]);

  return (
    <section className="inventario-vista">
      <InventarioNavegacion activa={subvista} onSeleccionar={setSubvista} />
      {subvista === 'productos' && <ProductosInsumosView puedeGestionar={permisos.includes('INVENTARIO_GESTIONAR')} />}
      {subvista === 'servicios' && <ServiciosView />}
      {subvista === 'medicos' && <MedicosProfesionalesView />}
      {subvista === 'todo' && <CatalogoView tipo="todo" onReportes={() => setSubvista('reportes')} />}
      {subvista === 'reportes' && <ReportesInventarioView onVolver={() => setSubvista('todo')} />}
      {subvista === 'admin' && <ConfiguracionAdminView puedeGestionar={permisos.includes('INVENTARIO_GESTIONAR')} />}
    </section>
  );
}
