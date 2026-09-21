import Icon from '@ui/components/Icon';

const avisos = [
  { id: 1, titulo: 'Usuario registrado', detalle: 'Operador contable fue creado correctamente.', destino: 'usuarios', icono: 'users' as const },
  { id: 2, titulo: 'Producto actualizado', detalle: 'Se actualizó el stock de insumos clínicos.', destino: 'inventario', icono: 'package' as const },
  { id: 3, titulo: 'Venta registrada', detalle: 'Una nueva venta fue guardada en caja.', destino: 'ventas', icono: 'cart' as const },
];

export function NotificacionesView({ onSelect }: { onSelect: (id: string) => void }) {
  return <section style={{ padding: 20, border: '1px solid #ded1ff', borderRadius: 14, background: '#fff' }}><header style={{ marginBottom: 18 }}><p style={{ margin: 0, color: '#7c3aed', fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>CENTRO DE ACTIVIDAD</p><h2 style={{ margin: '5px 0', color: '#35156b' }}>Notificaciones</h2><small style={{ color: '#6b5b88' }}>Revisa las novedades del sistema. Selecciona una para ir al cambio realizado.</small></header><div style={{ display: 'grid', gap: 10 }}>{avisos.map((aviso) => <button key={aviso.id} type="button" onClick={() => onSelect(aviso.destino)} style={{ display: 'grid', gridTemplateColumns: '42px 1fr auto', alignItems: 'center', gap: 12, padding: 14, border: '2px solid #d8ccf5', borderRadius: 11, color: '#35156b', background: '#faf8ff', textAlign: 'left' }}><span style={{ display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: 9, color: '#fff', background: '#7c3aed' }}><Icon name={aviso.icono} size={18}/></span><span><strong style={{ display: 'block', fontSize: 14 }}>{aviso.titulo}</strong><small style={{ color: '#6b5b88' }}>{aviso.detalle}</small></span><Icon name="chevronRight" size={18}/></button>)}</div></section>;
}
