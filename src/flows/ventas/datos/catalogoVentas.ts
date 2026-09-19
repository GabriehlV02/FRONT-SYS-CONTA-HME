export type TipoVenta = 'Producto' | 'Insumo' | 'Servicio';

export type ItemVenta = {
  id: string;
  nombre: string;
  tipo: TipoVenta;
  codigo: string;
  precio: number;
  stock?: number;
};

export const catalogoVentas: ItemVenta[] = [
  { id: 'consulta', nombre: 'Consulta médica general', tipo: 'Servicio', codigo: 'SRV-001', precio: 80 },
  { id: 'hemograma', nombre: 'Hemograma completo', tipo: 'Servicio', codigo: 'LAB-009', precio: 50 },
  { id: 'gasa', nombre: 'Gasa estéril 10 × 10 cm', tipo: 'Insumo', codigo: 'INS-021', precio: 12, stock: 84 },
  { id: 'venda', nombre: 'Venda elástica 10 cm', tipo: 'Insumo', codigo: 'INS-034', precio: 18, stock: 35 },
  { id: 'paracetamol', nombre: 'Paracetamol 500 mg', tipo: 'Producto', codigo: 'PRD-104', precio: 8, stock: 146 },
];
