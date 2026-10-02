import { useEffect, useMemo, useState } from 'react';
import Icon from '@ui/components/Icon';
import '../InventarioView.css';


type Registro = Record<string, string | number>;
type Columna = { id: string; etiqueta: string };

const columnas: Columna[] = [
  { id: 'codigo', etiqueta: 'Código' }, { id: 'nombre', etiqueta: 'Nombre o identificación' },
  { id: 'tipo', etiqueta: 'Tipo' }, { id: 'categoria', etiqueta: 'Categoría' },
  { id: 'grupo', etiqueta: 'Subcategoría' }, { id: 'unidadMedida', etiqueta: 'Unidad' },
  { id: 'stock', etiqueta: 'Stock' }, { id: 'precioVenta', etiqueta: 'Precio venta' },
  { id: 'estado', etiqueta: 'Estado' }, { id: 'numeroSerie', etiqueta: 'Serie / barras' },
];
const columnasIniciales = columnas.map((columna) => columna.id);

const descargar = (contenido: BlobPart, tipo: string, nombre: string) => {
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  enlace.download = nombre;
  enlace.click();
  window.setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
};

const crearPdf = (lineas: string[], horizontal: boolean) => {
  const ancho = horizontal ? 842 : 595;
  const alto = horizontal ? 595 : 842;
  const texto = lineas.flatMap((linea) => {
    const limpio = linea.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '');
    return limpio.match(/.{1,110}(?:\s|$)/g) || [''];
  }).slice(0, horizontal ? 43 : 64);
  const contenido = `BT /F1 9 Tf 35 ${alto - 40} Td 11 TL ${texto.map((linea, indice) => `${indice ? 'T* ' : ''}(${linea.replace(/([\\()])/g, '\\$1')}) Tj`).join(' ')} ET`;
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ancho} ${alto}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objetos.forEach((objeto, indice) => { offsets.push(pdf.length); pdf += `${indice + 1} 0 obj\n${objeto}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer << /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
};

export function ReportesInventarioView({ onVolver }: { onVolver?: () => void }) {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [seleccionadas, setSeleccionadas] = useState(columnasIniciales);
  const [sucursal, setSucursal] = useState('');
  const [almacen, setAlmacen] = useState('');
  const [lotes, setLotes] = useState<{ codigo: string; almacen: string; sucursal?: string; disponible: number; vence?: string }[]>([]);
  const [error, setError] = useState('');
  const sucursalLote = (lote: { almacen: string; sucursal?: string }) => lote.sucursal || (lote.almacen.includes(' - ') ? lote.almacen.split(' - ')[0].trim() : 'Sin sucursal asignada');
  const sucursales = [...new Set(lotes.map(sucursalLote))].sort();
  const almacenes = [...new Set(lotes.filter(lote => !sucursal || sucursalLote(lote) === sucursal).map(lote => lote.almacen))].sort();
  const [tipo, setTipo] = useState('Todos');
  const [estado, setEstado] = useState('Todos');
  const [titulo, setTitulo] = useState('Reporte general de inventario');
  const [orientacion, setOrientacion] = useState<'vertical' | 'horizontal'>('horizontal');
  const [incluirFecha, setIncluirFecha] = useState(true);

  useEffect(() => {
    let vigente = true;
    Promise.all(['/api/inventario', '/api/stock/lotes'].map(async url => {
      const respuesta = await fetch(url); if (!respuesta.ok) throw new Error();
      const { data } = await respuesta.json(); if (!Array.isArray(data)) throw new Error(); return data;
    })).then(([items, stock]) => { if (vigente) { setRegistros(items); setLotes(stock); } })
      .catch(() => { if (vigente) setError('No se pudieron cargar el inventario y sus almacenes. Vuelve a abrir Reportes.'); });
    return () => { vigente = false; };
  }, []);
  const visibles = useMemo(() => {
    const hoy = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/La_Paz' }).format(new Date());
    const ubicados = lotes.filter(lote => (!sucursal || sucursalLote(lote) === sucursal) && (!almacen || lote.almacen === almacen));
    const codigos = new Set(ubicados.map(lote => lote.codigo));
    const stock = new Map<string, number>();
    ubicados.forEach(lote => { if (lote.disponible > 0 && (!lote.vence || lote.vence >= hoy)) stock.set(lote.codigo, (stock.get(lote.codigo) || 0) + lote.disponible); });
    return registros.filter(registro => (!(sucursal || almacen) || codigos.has(String(registro.codigo))) && (tipo === 'Todos' || String(registro.tipo).toUpperCase() === tipo.toUpperCase()) && (estado === 'Todos' || String(registro.estado).toUpperCase() === estado.toUpperCase()))
      .map(registro => sucursal || almacen ? { ...registro, stock: stock.get(String(registro.codigo)) || 0 } : registro);
  }, [sucursal, almacen, lotes, estado, registros, tipo]);
  const columnasVisibles = columnas.filter((columna) => seleccionadas.includes(columna.id));
  const fecha = new Intl.DateTimeFormat('es-BO', { dateStyle: 'long' }).format(new Date());
  const filasTexto = [titulo, ...(incluirFecha ? [`Generado: ${fecha}`] : []), columnasVisibles.map((c) => c.etiqueta).join(' | '), ...visibles.map((registro) => columnasVisibles.map((c) => String(registro[c.id] ?? '—')).join(' | '))];
  const tablaHtml = `<html><head><meta charset="utf-8"><style>body{font-family:Arial}h1{color:#087f87}table{border-collapse:collapse;width:100%}th,td{border:1px solid #b8cdd2;padding:7px;text-align:left}th{background:#dce9eb}</style></head><body><h1>${titulo}</h1>${incluirFecha ? `<p>${fecha}</p>` : ''}<table><thead><tr>${columnasVisibles.map((c) => `<th>${c.etiqueta}</th>`).join('')}</tr></thead><tbody>${visibles.map((r) => `<tr>${columnasVisibles.map((c) => `<td>${String(r[c.id] ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;

  const alternar = (id: string) => setSeleccionadas((actual) => actual.includes(id) ? (actual.length > 1 ? actual.filter((item) => item !== id) : actual) : [...actual, id]);
  return <section className="reporte-inventario">
    <header className="reporte-inventario-cabecera"><div>{onVolver && <button type="button" onClick={onVolver}><Icon name="chevronLeft" size={17} /> Volver</button>}<span>INFORMES Y EXPORTACIÓN</span><h2>Reportes de inventario</h2><p>Configura el contenido y descarga la información en el formato que necesites.</p></div><b>{visibles.length} registros</b></header>
    {error && <p role="alert">{error}</p>}
    <div className="reporte-inventario-layout">
      <aside className="reporte-configuracion">
        <section><h3>Contenido del reporte</h3><label>Título<input value={titulo} onChange={(event) => setTitulo(event.target.value)} /></label><div className="reporte-filtros"><label>Tipo<select value={tipo} onChange={(event) => setTipo(event.target.value)}><option>Todos</option><option>Producto</option><option>Insumo</option><option>Servicio</option></select></label><label>Estado<select value={estado} onChange={(event) => setEstado(event.target.value)}><option>Todos</option><option>ACTIVO</option><option>INACTIVO</option></select></label></div><label>Sucursal<select value={sucursal} onChange={event => { setSucursal(event.target.value); setAlmacen(''); }}><option value="">Todas</option>{sucursales.map(valor => <option key={valor} value={valor}>{valor}</option>)}</select></label><label>Almacenes<select value={almacen} onChange={event => setAlmacen(event.target.value)}><option value="">Todos</option>{almacenes.map(valor => <option key={valor} value={valor}>{valor}</option>)}</select></label></section>
        <section><div className="reporte-seccion-titulo"><h3>Columnas visibles</h3><button type="button" onClick={() => setSeleccionadas(columnasIniciales)}>Seleccionar todas</button></div><div className="reporte-columnas">{columnas.map((columna) => <label key={columna.id}><input type="checkbox" checked={seleccionadas.includes(columna.id)} onChange={() => alternar(columna.id)} /><span>{columna.etiqueta}</span></label>)}</div></section>
        <section><h3>Presentación</h3><div className="reporte-orientacion"><button type="button" className={orientacion === 'vertical' ? 'activo' : ''} onClick={() => setOrientacion('vertical')}>Vertical</button><button type="button" className={orientacion === 'horizontal' ? 'activo' : ''} onClick={() => setOrientacion('horizontal')}>Horizontal</button></div><label className="reporte-check"><input type="checkbox" checked={incluirFecha} onChange={(event) => setIncluirFecha(event.target.checked)} /> Incluir fecha de generación</label></section>
        <section className="reporte-descargas"><h3>Descargar reporte</h3><div className="reporte-exportaciones"><button className="exportar-pdf" aria-label="Descargar PDF" type="button" onClick={() => descargar(crearPdf(filasTexto, orientacion === 'horizontal'), 'application/pdf', 'inventario.pdf')}><b>PDF</b><span>Descargar PDF</span></button><button className="exportar-word" aria-label="Descargar Word" type="button" onClick={() => descargar(`\ufeff${tablaHtml}`, 'application/msword', 'inventario.doc')}><b>Word</b><span>Descargar Word</span></button><button className="exportar-excel" aria-label="Descargar Excel" type="button" onClick={() => descargar(`\ufeff${tablaHtml}`, 'application/vnd.ms-excel', 'inventario.xls')}><b>Excel</b><span>Descargar Excel</span></button></div></section>
      </aside>
      <main className="reporte-vista-previa"><header><div><span>VISTA PREVIA</span><h3>{titulo || 'Reporte sin título'}</h3>{incluirFecha && <small>{fecha}</small>}</div></header><div className={`reporte-hoja ${orientacion}`}><table><thead><tr>{columnasVisibles.map((columna) => <th key={columna.id}>{columna.etiqueta}</th>)}</tr></thead><tbody>{visibles.map((registro, indice) => <tr key={`${registro.codigo}-${indice}`}>{columnasVisibles.map((columna) => <td key={columna.id}>{String(registro[columna.id] ?? '—')}</td>)}</tr>)}</tbody></table>{!visibles.length && <p className="reporte-vacio">No hay registros con los filtros seleccionados.</p>}</div></main>
    </div>
  </section>;
}
