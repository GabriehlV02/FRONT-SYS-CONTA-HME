import { apiFetch } from '@ui/auth';
import type { ItemVenta } from './catalogoVentas';

export type AlmacenVenta = { id: number; nombre: string };

export async function cargarCatalogoAutorizado(): Promise<{ data: ItemVenta[]; almacenes: AlmacenVenta[] }> {
  const respuesta = await apiFetch('/api/v1/ventas/catalogo');
  if (!respuesta.ok) throw new Error('No se pudo cargar el catálogo de tus almacenes.');
  return respuesta.json();
}
