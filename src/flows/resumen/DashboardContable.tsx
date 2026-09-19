import Icon from '@ui/components/Icon';

type Props = { onSelect: (id: string) => void };

const metricas = [
  { label: 'Productos', value: '5', note: 'Ítems disponibles', icon: 'package' as const },
  { label: 'Ventas', value: '0', note: 'Sin ventas hoy', icon: 'fileText' as const },
  { label: 'Ingresos del mes', value: 'Bs 0.00', note: 'Promedio diario Bs 0.00', icon: 'cash' as const },
  { label: 'Stock bajo', value: '0', note: 'Revisar reposición', icon: 'audit' as const },
];

export function DashboardContable({ onSelect }: Props) {
  const accesos = [
    ['ventas', 'cart', 'Nueva venta'], ['inventario', 'plus', 'Crear producto'], ['inventario', 'package', 'Inventario'], ['ventas', 'fileText', 'Gestión ventas'], ['usuarios', 'users', 'Usuarios'],
  ] as const;
  return <section className="dashboard-contable">
    <header className="dashboard-hero"><div><p>PANEL PRINCIPAL</p><h2>Resumen del negocio</h2><span>Control rápido de inventario, ventas, productos con bajo stock e ingresos.</span></div><button type="button" onClick={() => onSelect('ventas')}><Icon name="cart" size={18}/> Ir a Ventas</button></header>
    <section className="dashboard-metricas">{metricas.map(item => <article key={item.label}><div><span>{item.label}</span><Icon name={item.icon} size={25}/></div><strong>{item.value}</strong><small>{item.note}</small></article>)}</section>
    <nav className="dashboard-accesos" aria-label="Accesos rápidos">{accesos.map(([id, icon, label]) => <button key={label} type="button" onClick={() => onSelect(id)}><Icon name={icon} size={19}/><strong>{label}</strong></button>)}</nav>
    <div className="dashboard-detalle">
      <section className="dashboard-panel dashboard-indice"><header><div><h3>Índice de ventas</h3><p>Ingresos de los últimos 7 días</p></div><Icon name="audit" size={22}/></header><div className="dashboard-barras">{['sáb', 'dom', 'lun', 'mar', 'mié', 'jue', 'vie'].map(dia => <div key={dia}><i><b/></i><strong>{dia}</strong><small>Bs 0</small></div>)}</div></section>
      <section className="dashboard-panel"><header><div><h3>Servicios y productos más vendidos</h3><p>Ranking por cantidad vendida</p></div></header><div className="dashboard-ranking">{['Consulta médica general', 'Hemograma completo', 'Gasa estéril 10 × 10 cm'].map((producto, index) => <article key={producto}><b>{index + 1}</b><div><strong>{producto}</strong><small>0 unidades · Bs 0.00</small></div></article>)}</div></section>
      <section className="dashboard-panel dashboard-estado"><h3>Stock para revisar</h3><p>Productos en mínimo o agotados</p><span>El inventario está en buen estado.</span></section>
      <section className="dashboard-panel dashboard-ventas-recientes"><h3>Ventas recientes</h3><p>Últimos movimientos de caja</p><article><div><strong>Sin ventas registradas</strong><small>Las nuevas ventas aparecerán aquí.</small></div><b>Bs 0.00</b></article></section>
    </div>
  </section>;
}
