import { useEffect, useState } from 'react';
import {
  InventarioNavegacion,
  type SubvistaInventario,
} from './componentes/InventarioNavegacion';
import { ProductosInsumosView } from './subvistas/ProductosInsumosView';
import { ServiciosView } from './subvistas/ServiciosView';
import { ReportesInventarioView } from './subvistas/ReportesInventarioView';
import { ItemsGeneralView } from './subvistas/ItemsGeneralView';
import { MedicosProfesionalesView } from './subvistas/MedicosProfesionalesView';
import { ConfiguracionAdminView } from './subvistas/ConfiguracionAdminView';
import './InventarioView.css';
import { EncabezadoVista } from '@ui/components/EncabezadoVista';

export function InventarioView({ activeId, permisos = [], administraCatalogo = false }: { activeId?: string; permisos?: string[]; administraCatalogo?: boolean }) {
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
      {subvista === 'servicios' && <EncabezadoVista titulo="Servicios" descripcion="Administra las prestaciones del hospital, sus tarifas y clasificación." icono="asset" />}
      {subvista === 'medicos' && <EncabezadoVista titulo="Médicos y profesionales" descripcion="Consulta los profesionales, sus especialidades y datos de contacto." icono="users" />}
      {subvista === 'admin' && <EncabezadoVista titulo="Configuración de inventario" descripcion="Organiza los tipos, unidades de medida, categorías y familias del catálogo." icono="settings" />}
      {subvista === 'productos' && <ProductosInsumosView puedeGestionar={administraCatalogo && permisos.includes('INVENTARIO_GESTIONAR')} />}
      {subvista === 'servicios' && <ServiciosView puedeGestionar={administraCatalogo && permisos.includes('INVENTARIO_GESTIONAR')} />}
      {subvista === 'medicos' && <MedicosProfesionalesView />}
      {subvista === 'todo' && <ItemsGeneralView puedeGestionar={administraCatalogo && permisos.includes('INVENTARIO_GESTIONAR')} onReportes={() => setSubvista('reportes')} />}
      {subvista === 'reportes' && <ReportesInventarioView onVolver={() => setSubvista('todo')} />}
      {subvista === 'admin' && <ConfiguracionAdminView puedeGestionar={administraCatalogo && permisos.includes('INVENTARIO_GESTIONAR')} />}
    </section>
  );
}
