import { useMemo, useState } from 'react';
import Icon from '@ui/components/Icon';
import { productosDemo, serviciosDemo } from '../datos/catalogoDemo';

type ItemStock = (typeof productosDemo)[number] & {
  codigo: string;
  tipo: 'Producto' | 'Insumo' | 'Servicio';
  stockTotal: number;
  precio: number;
};

const almacenesStock = [
  'Farmacia',
  'Almacen de hemodialisis',
  'Farmacia del hospital',
  'Internaciones',
  'Quirofano',
  'Sucursal norte',
];

const normalizarBusqueda = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');

const crearPrefijoCodigo = (valor: string) =>
  normalizarBusqueda(valor)
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((parte) => parte.slice(0, 2).toUpperCase())
    .join('')
    .slice(0, 6);

const subcategoriaDe = (item: (typeof productosDemo)[number]) => {
  const nombre = normalizarBusqueda(item.nombre);
  if (nombre.includes('guante')) return 'Guantes';
  if (nombre.includes('jeringa')) return 'Jeringas';
  if (nombre.includes('gasa') || nombre.includes('campo')) return 'Gasas';
  if (nombre.includes('consulta')) return 'Consulta';
  if (nombre.includes('laboratorio')) return 'Laboratorio';
  return 'General';
};

const crearItemsStock = (): ItemStock[] =>
  [...productosDemo, ...serviciosDemo].map((item, indice) => {
    const esServicio = serviciosDemo.some((servicio) => servicio.nombre === item.nombre);
    const subcategoria = subcategoriaDe(item);
    const codigo = `${crearPrefijoCodigo(item.categoria) || 'CAT'}-${
      crearPrefijoCodigo(subcategoria) || 'GEN'
    }-${String(indice + 1).padStart(4, '0')}`;
    return {
      ...item,
      codigo,
      precio: esServicio ? 80 + (indice % 8) * 25 : 12 + item.disponible * 7,
      stockTotal: esServicio ? item.disponible : item.disponible * 24 + indice * 3,
      tipo: esServicio
        ? 'Servicio'
        : item.categoria === 'Medicamentos'
          ? 'Insumo'
          : 'Producto',
    };
  });

const stockPorAlmacen = (item: ItemStock) =>
  almacenesStock.map((almacen, indice) => {
    const base =
      item.tipo === 'Servicio'
        ? indice === 0
          ? item.stockTotal
          : 0
        : Math.max(0, Math.floor(item.stockTotal / (indice + 2)) - indice * 3);
    return {
      almacen,
      comprometido: item.tipo === 'Servicio' ? 0 : indice % 3,
      disponible: base,
    };
  });

export function StockView() {
  const [busqueda, setBusqueda] = useState('');
  const [direccion, setDireccion] = useState<'asc' | 'desc'>('asc');
  const [categoria, setCategoria] = useState('todas');
  const [orden, setOrden] = useState<'codigo' | 'nombre' | 'categoria' | 'stockTotal'>(
    'codigo',
  );
  const [seleccionado, setSeleccionado] = useState<ItemStock | null>(null);
  const items = useMemo(() => crearItemsStock(), []);
  const categorias = useMemo(
    () => [...new Set(items.map((item) => item.categoria))].sort(),
    [items],
  );

  const filtrados = useMemo(() => {
    const termino = normalizarBusqueda(busqueda.trim());
    const factor = direccion === 'asc' ? 1 : -1;
    return items
      .filter((item) => categoria === 'todas' || item.categoria === categoria)
      .filter(
        (item) =>
          !termino ||
          [item.codigo, item.nombre, item.categoria, item.marca, item.presentacion].some(
            (valor) => normalizarBusqueda(valor).includes(termino),
          ),
      )
      .sort((a, b) => {
        const valorA = orden === 'stockTotal' ? a.stockTotal : a[orden];
        const valorB = orden === 'stockTotal' ? b.stockTotal : b[orden];
        return (
          String(valorA).localeCompare(String(valorB), 'es', {
            numeric: true,
            sensitivity: 'base',
          }) * factor
        );
      });
  }, [busqueda, categoria, direccion, items, orden]);

  const totalStock = filtrados.reduce((total, item) => total + item.stockTotal, 0);

  return (
    <div className="inventario-contenido stock-general-contenido">
      <div className="inventario-controles-principales stock-general-controles">
        <div className="inventario-filtros inventario-filtros-productos">
          <label>
            <Icon name="search" size={17} />
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar producto, insumo o servicio"
              aria-label="Buscar stock"
            />
          </label>
          <select
            value={direccion}
            onChange={(event) => setDireccion(event.target.value as 'asc' | 'desc')}
            aria-label="Direccion de orden"
          >
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
          <select
            value={categoria}
            onChange={(event) => setCategoria(event.target.value)}
            aria-label="Filtrar por categoria"
          >
            <option value="todas">Todas las categorias</option>
            {categorias.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <div className="inventario-orden">
            <span>Ordenar por</span>
            <select
              value={orden}
              onChange={(event) =>
                setOrden(event.target.value as 'codigo' | 'nombre' | 'categoria' | 'stockTotal')
              }
              aria-label="Campo para ordenar"
            >
              <option value="codigo">Código</option>
              <option value="nombre">Nombre</option>
              <option value="categoria">Categoría</option>
              <option value="stockTotal">Stock</option>
            </select>
          </div>
        </div>
        <div className="stock-general-resumen">
          <span>{filtrados.length} registros</span>
          <strong>{totalStock} stock total</strong>
        </div>
      </div>

      <div className="inventario-tabla inventario-tabla-productos stock-general-tabla" role="table" aria-label="Stock general">
        <div className="inventario-tabla-head" role="row">
          <span role="columnheader">Codigo</span>
          <span role="columnheader">Nombre o identificacion</span>
          <span role="columnheader">Tipo</span>
          <span role="columnheader">Categoria</span>
          <span role="columnheader">Unidad</span>
          <span role="columnheader">Stock</span>
          <span role="columnheader">Precio / costo</span>
          <span role="columnheader">Estado</span>
          <span role="columnheader">Acciones</span>
        </div>
        {filtrados.map((item) => (
          <article className="inventario-row stock-general-row" role="row" key={item.codigo}>
            <span className="inventario-codigo">{item.codigo}</span>
            <div className="inventario-producto-cell">
              <strong>{item.nombre}</strong>
            </div>
            <span className="inventario-chip">{item.tipo}</span>
            <span className="inventario-chip">{item.categoria}</span>
            <span>{item.tipo === 'Servicio' ? 'Servicio' : item.presentacion.split(' x ')[0]}</span>
            <span className="inventario-stock">{item.stockTotal}</span>
            <span className="inventario-precio">Bs {item.precio.toFixed(2)}</span>
            <span className="inventario-disponible">
              <i /> Activo
            </span>
            <div className="inventario-acciones">
              <button aria-label={`Ver stock de ${item.nombre}`} onClick={() => setSeleccionado(item)}>
                <Icon name="eye" size={15} />
              </button>
              <button onClick={() => setSeleccionado(item)}>Ver stock</button>
            </div>
          </article>
        ))}
      </div>

      {seleccionado && (
        <div
          className="inventario-modal-fondo"
          role="presentation"
          onMouseDown={() => setSeleccionado(null)}
        >
          <section
            className="inventario-modal stock-detalle-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-detalle-titulo"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>{seleccionado.codigo}</span>
                <h3 id="stock-detalle-titulo">{seleccionado.nombre}</h3>
              </div>
              <button type="button" onClick={() => setSeleccionado(null)} aria-label="Cerrar">
                <Icon name="close" size={18} />
              </button>
            </header>
            <div className="stock-detalle-resumen">
              <span>
                <strong>{seleccionado.stockTotal}</strong>
                stock total
              </span>
              <span>
                <strong>{seleccionado.categoria}</strong>
                categoria
              </span>
              <span>
                <strong>{seleccionado.tipo}</strong>
                tipo
              </span>
            </div>
            <div className="stock-detalle-tabla">
              <div className="stock-detalle-head">
                <span>Almacen / sucursal</span>
                <span>Disponible</span>
                <span>Comprometido</span>
                <span>Estado</span>
              </div>
              {stockPorAlmacen(seleccionado).map((item) => (
                <article className="stock-detalle-row" key={item.almacen}>
                  <strong>{item.almacen}</strong>
                  <span>{item.disponible}</span>
                  <span>{item.comprometido}</span>
                  <span className={item.disponible > 0 ? 'stock-ok' : 'stock-cero'}>
                    {item.disponible > 0 ? 'Con stock' : 'Sin stock'}
                  </span>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
