export type OpcionesInventario = { unidades: string[]; tipos: Record<string, string>; categorias: Record<string, { prefijo: string; subcategorias: string[] }>; clasificaciones: string[] };
export const categoriasRegistro: Record<string, { prefijo: string; subcategorias: string[] }> = {
  FARMACO: { prefijo: 'FAR', subcategorias: ['INYECTABLE', 'TABLETA', 'AMPOLLA'] },
  INSUMO: { prefijo: 'INS', subcategorias: ['DESCARTABLE', 'CURACION', 'PROTECCION PERSONAL'] },
  LABORATORIO: { prefijo: 'LAB', subcategorias: ['QUIMICA SANGUINEA', 'HEMATOLOGIA', 'SEROLOGIA', 'GASOMETRIA'] },
  MEDICO: { prefijo: 'MED', subcategorias: ['CONSULTA GENERAL', 'CONSULTA ESPECIALIZADA', 'INTERCONSULTA'] },
  PROCEDIMIENTO: { prefijo: 'PRO', subcategorias: ['AMBULATORIO', 'QUIRURGICO', 'TERAPEUTICO'] },
  IMAGENOLOGIA: { prefijo: 'IMA', subcategorias: ['RADIOGRAFIA', 'ECOGRAFIA', 'TOMOGRAFIA'] },
  HOSPEDAJE: { prefijo: 'HOS', subcategorias: ['HABITACION INDIVIDUAL', 'HABITACION COMPARTIDA', 'CUIDADOS INTENSIVOS'] },
};
export const unidadesRegistro = ['UNITARIO', 'PAQUETE', 'VOLUMEN', 'TIEMPO'];
export const clasificacionesRegistro = ['SIN CLASIFICAR', 'NO APLICA', 'PENICILINAS', 'CEFALOSPORINAS', 'MACROLIDOS', 'SULFONAMIDAS', 'AINE', 'LATEX'];
