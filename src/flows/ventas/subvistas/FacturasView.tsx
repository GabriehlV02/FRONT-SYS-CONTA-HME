import { useState } from 'react';
import Icon from '@ui/components/Icon';
type EstadoFactura = 'Emitida' | 'Anulada';
type Factura = { numero: string; cliente: string; nit: string; cufd: string; codigoSiat: string; fecha: string; total: string; consumo: string; pagado: string; cambio: string; metodoPago: string; estado: EstadoFactura };



export function FacturasView() {
  const facturas: Factura[] = [];
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const visibles = facturas.filter(factura => `${factura.numero} ${factura.cliente} ${factura.nit} ${factura.codigoSiat}`.toLocaleLowerCase().includes(busqueda.trim().toLocaleLowerCase()));
  const emitidas = visibles.filter(factura => factura.estado === 'Emitida').length;
  const anuladas = visibles.length - emitidas;
  const totalFacturado = visibles.filter(factura => factura.estado === 'Emitida').reduce((suma, factura) => suma + Number(factura.total.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')), 0);
  const moneda = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return <section className="facturas-vista" aria-label="Facturas emitidas">
    <div className="ventas-kpis facturas-kpis">
      <article className="ventas-kpi"><span><Icon name="fileText" size={17} /></span><div><strong>{emitidas}</strong><small>Emitidas en resultados</small></div></article>
      <article className="ventas-kpi tono-warn"><span><Icon name="trash" size={17} /></span><div><strong>{anuladas}</strong><small>Anuladas en resultados</small></div></article>
      <article className="ventas-kpi tono-ok"><span><Icon name="cash" size={17} /></span><div><strong>Bs {moneda.format(totalFacturado)}</strong><small>Total emitido en resultados</small></div></article>
    </div>
    <section className="ventas-panel facturas-listado">
      <div className="ventas-panel-head"><div><h3>Facturas emitidas</h3><small>Consulta de facturas emitidas. La conexión con el servicio SIAT aún no está disponible.</small></div><label className="facturas-busqueda"><Icon name="search" size={15} /><input type="search" value={busqueda} onChange={evento => setBusqueda(evento.target.value)} placeholder="Buscar por número, cliente o NIT" aria-label="Buscar factura" /></label></div>
      <div className="facturas-tabla" role="table"><div className="facturas-fila facturas-encabezado" role="row"><span>Número</span><span>Cliente</span><span>NIT / CI</span><span>CUFD</span><span>Código SIAT</span><span>Fecha de emisión</span><span>Total</span><span>Estado</span><span>Acciones</span></div>{visibles.map(factura => <div className="facturas-fila" role="row" key={factura.numero}><strong>{factura.numero}</strong><span>{factura.cliente}</span><span>{factura.nit}</span><span>{factura.cufd}</span><span>{factura.codigoSiat}</span><span>{factura.fecha}</span><strong>{factura.total}</strong><span><i className={factura.estado === 'Emitida' ? 'emitida' : 'anulada'}>{factura.estado}</i></span><span className="factura-acciones">—</span></div>)}{!visibles.length && <p className="facturas-vacio" role="status">{busqueda ? 'No se encontraron facturas que coincidan con la búsqueda.' : 'No hay registros de facturas disponibles desde el servidor.'}</p>}</div>
    </section>
  </section>;
}


