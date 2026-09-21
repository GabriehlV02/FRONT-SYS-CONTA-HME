import { SystemApp } from '@ui/SystemApp';
import type { SystemConfig } from '@ui/types';
import type { IconName } from '@ui/components/Icon';
import { InventarioView } from './flows/inventario/InventarioView';
import { MovimientosView } from './flows/movimientos/MovimientosView';
import { UsuariosView } from './flows/usuarios/UsuariosView';
import { VentasView } from './flows/ventas/VentasView';
import { AlmacenesView } from './flows/almacenes/AlmacenesView';
import { DashboardContable } from './flows/resumen/DashboardContable';
import { NotificacionesView } from './flows/notificaciones/NotificacionesView';
import { ConfiguracionView } from './flows/configuracion/ConfiguracionView';

export const modules: {
  id: string;
  name: string;
  icon: IconName;
  group: string;
  description: string;
}[] = [
  {
    id: 'resumen',
    name: 'Resumen',
    icon: 'home',
    group: 'GENERAL',
    description: 'Panorama de la actividad administrativa del hospital.',
  },
  { id: 'notificaciones', name: 'Notificaciones', icon: 'bell', group: 'GENERAL', description: 'Consulta los avisos y cambios recientes.' },
  {
    id: 'ventas',
    name: 'Ventas',
    icon: 'cart',
    group: 'VENTAS',
    description: 'Caja, cuentas de pacientes y facturacion SIAT.',
  },
  {
    id: 'inventario',
    name: 'Items/Productos',
    icon: 'package',
    group: 'ALMACENES',
    description: 'Consulta los insumos y sus existencias.',
  },
  {
    id: 'almacenes',
    name: 'Inventarios y Almacenes',
    icon: 'building',
    group: 'ALMACENES',
    description: 'Organiza los almacenes y sus ubicaciones.',
  },
  {
    id: 'adquisiciones',
    name: 'Adquisiciones',
    icon: 'fileText',
    group: 'MOVIMIENTOS',
    description: 'Gestiona compras y comprobantes.',
  },
  {
    id: 'traspasos',
    name: 'Traspasos',
    icon: 'arrowRight',
    group: 'MOVIMIENTOS',
    description: 'Controla envios, recepciones y devoluciones.',
  },
  {
    id: 'usuarios',
    name: 'Usuarios',
    icon: 'users',
    group: 'ADMINISTRACION',
    description: 'Usuarios, roles y permisos del sistema.',
  },
  {
    id: 'sucursales-cajas',
    name: 'Cajas y almacenes',
    icon: 'building',
    group: 'ADMINISTRACION',
    description: 'Administra las sucursales y cajas operativas.',
  },
  {
    id: 'configuracion',
    name: 'Configuracion',
    icon: 'settings',
    group: 'ADMINISTRACION',
    description: 'Configura las opciones generales del sistema.',
  },
];

const config: SystemConfig = {
  id: 'contable',
  name: 'Hospital Maria Esperanza',
  subtitle: 'Administracion y contabilidad',
  loginTitle: 'ACCESO AL SISTEMA CONTABLE',
  role: 'Administracion',
  tagline: 'Tus cuentas, tu clinica. Todo en un solo lugar.',
  category: 'ADMINISTRACION Y FINANZAS',
  dashboardTitle: 'Resumen contable',
  welcomeTitle: 'Ventas y caja de tu clinica.',
  welcomeDescription:
    'Administra ventas, cuentas de pacientes, pagos y facturacion desde un solo lugar.',
  actionId: 'ventas',
  actionLabel: 'Abrir ventas',
  quickIds: ['ventas', 'inventario', 'movimientos', 'usuarios'],
  metrics: [
    {
      title: 'Ingresos del mes',
      icon: 'building',
      value: 'Bs 0,00',
      note: 'Sin movimientos registrados',
    },
    {
      title: 'Egresos del mes',
      icon: 'asset',
      value: 'Bs 0,00',
      note: 'Sin movimientos registrados',
    },
    {
      title: 'Por cobrar',
      icon: 'fileText',
      value: 'Bs 0,00',
      note: 'Sin movimientos registrados',
    },
  ],
  modules,
  sidebarGroups: ['GENERAL', 'VENTAS', 'ALMACENES', 'MOVIMIENTOS', 'ADMINISTRACION'],
  renderModule: (id, select, activeId) =>
    id === 'resumen' ? (
      <DashboardContable onSelect={select} />
    ) : id === 'notificaciones' ? (
      <NotificacionesView onSelect={select} />
    ) : id === 'ventas' ? (
      <VentasView activeId={activeId} />
    ) : id === 'inventario' ? (
      <InventarioView activeId={activeId} />
    ) : id === 'almacenes' ? (
      <AlmacenesView activeId={activeId} />
    ) : id === 'adquisiciones' ? (
      <MovimientosView activeId={activeId} tipo="adquisiciones" />
    ) : id === 'traspasos' ? (
      <MovimientosView activeId={activeId} tipo="traspasos" />
    ) : id === 'usuarios' ? (
      <UsuariosView />
    ) : id === 'sucursales-cajas' ? (
      <ConfiguracionView inicial="sucursales-almacenes" />
    ) : id === 'configuracion' ? (
      <ConfiguracionView />
    ) : undefined,
};

export function App() {
  return <SystemApp config={config} />;
}
