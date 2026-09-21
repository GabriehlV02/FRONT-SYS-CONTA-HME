import { SystemApp } from '@ui/SystemApp';
import type { SystemConfig } from '@ui/types';
import type { IconName } from '@ui/components/Icon';
import { lazy, Suspense, type ReactNode } from 'react';

const InventarioView = lazy(() => import('./flows/inventario/InventarioView').then((module) => ({ default: module.InventarioView })));
const MovimientosView = lazy(() => import('./flows/movimientos/MovimientosView').then((module) => ({ default: module.MovimientosView })));
const UsuariosView = lazy(() => import('./flows/usuarios/UsuariosView').then((module) => ({ default: module.UsuariosView })));
const VentasView = lazy(() => import('./flows/ventas/VentasView').then((module) => ({ default: module.VentasView })));
const AlmacenesView = lazy(() => import('./flows/almacenes/AlmacenesView').then((module) => ({ default: module.AlmacenesView })));
const DashboardContable = lazy(() => import('./flows/resumen/DashboardContable').then((module) => ({ default: module.DashboardContable })));
const NotificacionesView = lazy(() => import('./flows/notificaciones/NotificacionesView').then((module) => ({ default: module.NotificacionesView })));
const ConfiguracionView = lazy(() => import('./flows/configuracion/ConfiguracionView').then((module) => ({ default: module.ConfiguracionView })));

function VistaDiferida({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="carga-modulo" role="status" aria-label="Cargando módulo" />}>{children}</Suspense>;
}

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
      <VistaDiferida><DashboardContable onSelect={select} /></VistaDiferida>
    ) : id === 'notificaciones' ? (
      <VistaDiferida><NotificacionesView onSelect={select} /></VistaDiferida>
    ) : id === 'ventas' ? (
      <VistaDiferida><VentasView activeId={activeId} /></VistaDiferida>
    ) : id === 'inventario' ? (
      <VistaDiferida><InventarioView activeId={activeId} /></VistaDiferida>
    ) : id === 'almacenes' ? (
      <VistaDiferida><AlmacenesView activeId={activeId} /></VistaDiferida>
    ) : id === 'adquisiciones' ? (
      <VistaDiferida><MovimientosView activeId={activeId} tipo="adquisiciones" /></VistaDiferida>
    ) : id === 'traspasos' ? (
      <VistaDiferida><MovimientosView activeId={activeId} tipo="traspasos" /></VistaDiferida>
    ) : id === 'usuarios' ? (
      <VistaDiferida><UsuariosView /></VistaDiferida>
    ) : id === 'sucursales-cajas' ? (
      <VistaDiferida><ConfiguracionView inicial="sucursales-almacenes" /></VistaDiferida>
    ) : id === 'configuracion' ? (
      <VistaDiferida><ConfiguracionView vacia /></VistaDiferida>
    ) : undefined,
};

export function App() {
  return <SystemApp config={config} />;
}
