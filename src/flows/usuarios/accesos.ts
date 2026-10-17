export type Rol = { id: string; codigo: string; nombre: string; descripcion: string | null; activo: boolean; sistemas: string[]; permisos: string[] };
export type Sistema = { codigo: string; nombre: string; permisos: { codigo: string; nombre: string }[] };
export type CatalogoRoles = { data: Rol[]; sistemas: Sistema[] };

export async function leerRespuesta<T>(response: Response): Promise<T> {
  const datos = await response.json().catch(() => null);
  if (!response.ok) {
    const errores = datos?.errors as Record<string, string[]> | undefined;
    throw new Error(errores ? Object.values(errores).flat().join(' ') : datos?.message || 'No se pudo completar la operación.');
  }
  if (!datos) throw new Error('El servidor devolvió una respuesta inválida.');
  return datos as T;
}