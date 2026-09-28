import { useState } from 'react';
import Icon from '@ui/components/Icon';

type EstadoFactura = 'Emitida' | 'Anulada';
type Factura = { numero: string; cliente: string; nit: string; cufd: string; codigoSiat: string; fecha: string; total: string; consumo: string; pagado: string; cambio: string; metodoPago: string; estado: EstadoFactura };

const facturasIniciales: Factura[] = [
  { numero: 'F-000124', cliente: 'Clinica San Gabriel', nit: '1023456789', cufd: 'A1B2-C3D4-E5F6', codigoSiat: 'SIAT-784521', fecha: '28 sep. 2026', total: 'Bs 1.250,00', consumo: 'Bs 1.250,00', pagado: 'Bs 1.300,00', cambio: 'Bs 50,00', metodoPago: 'Efectivo', estado: 'Emitida' },
  { numero: 'F-000123', cliente: 'Maria Fernanda Rojas', nit: '6543210', cufd: 'A1B2-C3D4-E5F6', codigoSiat: 'SIAT-784520', fecha: '28 sep. 2026', total: 'Bs 480,00', consumo: 'Bs 480,00', pagado: 'Bs 480,00', cambio: 'Bs 0,00', metodoPago: 'QR', estado: 'Emitida' },
  { numero: 'F-000122', cliente: 'Laboratorio Central', nit: '3076543218', cufd: '9F8E-7D6C-5B4A', codigoSiat: 'SIAT-784519', fecha: '27 sep. 2026', total: 'Bs 890,00', consumo: 'Bs 890,00', pagado: 'Bs 1.000,00', cambio: 'Bs 110,00', metodoPago: 'Efectivo', estado: 'Emitida' },
];

export function FacturasView() {
  const [facturas, setFacturas] = useState(facturasIniciales);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const anular = (numero: string) => { setFacturas(actuales => actuales.map(factura => factura.numero === numero ? { ...factura, estado: 'Anulada' } : factura)); setFacturaSeleccionada(null); };

  return <section className="facturas-vista" aria-label="Facturas emitidas">
    <div className="ventas-kpis facturas-kpis">
      <article className="ventas-kpi"><span><Icon name="fileText" size={17} /></span><div><strong>24</strong><small>Emitidas hoy</small></div></article>
      <article className="ventas-kpi tono-warn"><span><Icon name="trash" size={17} /></span><div><strong>0</strong><small>Anuladas hoy</small></div></article>
      <article className="ventas-kpi tono-ok"><span><Icon name="cash" size={17} /></span><div><strong>Bs 8.540</strong><small>Facturado hoy</small></div></article>
    </div>
    <section className="ventas-panel facturas-listado">
      <div className="ventas-panel-head"><div><h3>Facturas emitidas</h3><small>Listado de todas las facturas generadas a partir de las ventas.</small></div><button type="button" className="secundario"><Icon name="search" size={15} /> Buscar factura</button></div>
      <div className="facturas-tabla" role="table"><div className="facturas-fila facturas-encabezado" role="row"><span>Numero</span><span>Cliente</span><span>NIT / CI</span><span>CUFD</span><span>Codigo SIAT</span><span>Fecha de emision</span><span>Total</span><span>Estado</span><span>Acciones</span></div>{facturas.map(factura => <div className="facturas-fila" role="row" key={factura.numero}><strong>{factura.numero}</strong><span>{factura.cliente}</span><span>{factura.nit}</span><span>{factura.cufd}</span><span>{factura.codigoSiat}</span><span>{factura.fecha}</span><strong>{factura.total}</strong><span><i className={factura.estado === 'Emitida' ? 'emitida' : 'anulada'}>{factura.estado}</i></span><span className="factura-acciones"><button type="button" onClick={() => setFacturaSeleccionada(factura)} aria-label={`Inspeccionar ${factura.numero}`} title="Inspeccionar factura"><Icon name="eye" size={16} /></button></span></div>)}</div>
    </section>
    {facturaSeleccionada && <div className="factura-modal-fondo" onMouseDown={() => setFacturaSeleccionada(null)}><section className="factura-modal" role="dialog" aria-modal="true" aria-labelledby="factura-detalle-titulo" onMouseDown={event => event.stopPropagation()}><header><div><p>FACTURA EMITIDA</p><h3 id="factura-detalle-titulo">{facturaSeleccionada.numero}</h3></div><button type="button" onClick={() => setFacturaSeleccionada(null)} aria-label="Cerrar"><Icon name="close" size={18} /></button></header><dl><div><dt>Cliente</dt><dd>{facturaSeleccionada.cliente}</dd></div><div><dt>NIT / CI</dt><dd>{facturaSeleccionada.nit}</dd></div><div><dt>CUFD</dt><dd>{facturaSeleccionada.cufd}</dd></div><div><dt>Codigo SIAT</dt><dd>{facturaSeleccionada.codigoSiat}</dd></div><div><dt>Fecha de emision</dt><dd>{facturaSeleccionada.fecha}</dd></div><div><dt>Consumo</dt><dd>{facturaSeleccionada.consumo}</dd></div><div><dt>Pago realizado</dt><dd>{facturaSeleccionada.pagado} · {facturaSeleccionada.metodoPago}</dd></div><div><dt>Cambio</dt><dd>{facturaSeleccionada.cambio}</dd></div><div><dt>Total facturado</dt><dd>{facturaSeleccionada.total}</dd></div><div><dt>Estado</dt><dd>{facturaSeleccionada.estado}</dd></div></dl><footer><button type="button" onClick={() => setFacturaSeleccionada(null)}>Cerrar</button>{facturaSeleccionada.estado === 'Emitida' && <button type="button" className="factura-anular" onClick={() => anular(facturaSeleccionada.numero)}><Icon name="trash" size={15} /> Anular factura</button>}</footer></section></div>}
  </section>;
}
