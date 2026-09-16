import { useMemo, useState } from 'react';
import Icon from '@ui/components/Icon';
import { productosDemo, serviciosDemo } from '../datos/catalogoDemo';

type ModoInventario = 'galeria' | 'listado';
type CampoOrden = 'codigo' | 'nombre' | 'categoria' | 'marca';
type TipoRegistro = 'Producto' | 'Insumo' | 'Servicio';
type TipoCatalogo = 'productos' | 'servicios' | 'todo';

const subcategoriasPorCategoria: Record<string, string[]> = {
  'Proteccion personal': ['Guantes', 'Mascarillas', 'Respiradores'],
  'Material descartable': ['Jeringas', 'Venoclisis', 'Cateteres'],
  'Curacion y heridas': ['Gasas', 'Vendas', 'Antisepticos'],
  Medicamentos: ['Analgesicos', 'Antibioticos', 'Inyectables'],
  Diagnostico: ['Laboratorio', 'Imagenologia', 'Consulta'],
  Procedimientos: ['Ambulatorios', 'Quirofano', 'Terapias'],
};

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

export function CatalogoView({ tipo }: { tipo: TipoCatalogo }) {
  const subvista = tipo;
  const [modo, setModo] = useState<ModoInventario>('listado');
  const [porPagina, setPorPagina] = useState(10);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [direccion, setDireccion] = useState<'asc' | 'desc'>('asc');
  const [campoOrden, setCampoOrden] = useState<CampoOrden>('codigo');
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);
  const [tipoRegistro, setTipoRegistro] = useState<TipoRegistro>(
    tipo === 'servicios' ? 'Servicio' : 'Producto',
  );
  const [categoriaRegistro, setCategoriaRegistro] = useState('');
  const [subcategoriaRegistro, setSubcategoriaRegistro] = useState('');
  const [serieHabilitada, setSerieHabilitada] = useState(false);
  const titulo =
    subvista === 'servicios'
      ? 'Servicios'
      : subvista === 'todo'
        ? 'Vista general'
        : 'Productos e insumos';
  const esServicio = subvista === 'servicios';
  const esVistaGeneral = subvista === 'todo';
  const elementosDemo = useMemo(
    () =>
      esVistaGeneral
        ? [...productosDemo, ...serviciosDemo]
        : esServicio
          ? serviciosDemo
          : productosDemo,
    [esServicio, esVistaGeneral],
  );
  const nombreElemento = esServicio
    ? 'servicio'
    : esVistaGeneral
      ? 'registro'
      : 'producto';
  const nombreElementos = esServicio
    ? 'servicios'
    : esVistaGeneral
      ? 'registros'
      : 'productos';
  const categorias = useMemo(
    () =>
      [...new Set(elementosDemo.map((producto) => producto.categoria))].sort(),
    [elementosDemo],
  );
  const subcategoriasDisponibles = useMemo(() => {
    const existentes = categoriaRegistro
      ? subcategoriasPorCategoria[categoriaRegistro] ?? []
      : [];
    return existentes.length > 0 ? existentes : ['General'];
  }, [categoriaRegistro]);
  const codigoRegistro = useMemo(() => {
    const categoriaBase = categoriaRegistro || categorias[0] || 'Catalogo';
    const subcategoriaBase = subcategoriaRegistro || subcategoriasDisponibles[0];
    const prefijoCategoria = crearPrefijoCodigo(categoriaBase) || 'CAT';
    const prefijoSubcategoria = crearPrefijoCodigo(subcategoriaBase) || 'GEN';
    const correlativo = String(elementosDemo.length + 1).padStart(4, '0');
    return `${prefijoCategoria}-${prefijoSubcategoria}-${correlativo}`;
  }, [
    categoriaRegistro,
    categorias,
    elementosDemo.length,
    subcategoriaRegistro,
    subcategoriasDisponibles,
  ]);
  const obtenerDatosTabla = (producto: (typeof elementosDemo)[number]) => {
    const categoriaProducto = producto.categoria;
    const subcategorias = subcategoriasPorCategoria[categoriaProducto] ?? [
      'General',
    ];
    const subcategoria =
      subcategorias.find((item) =>
        normalizarBusqueda(producto.nombre).includes(
          normalizarBusqueda(item.slice(0, 5)),
        ),
      ) ?? subcategorias[0];
    const codigo = `${crearPrefijoCodigo(categoriaProducto) || 'CAT'}-${
      crearPrefijoCodigo(subcategoria) || 'GEN'
    }-${String(elementosDemo.indexOf(producto) + 1).padStart(4, '0')}`;
    const esServicioTabla = serviciosDemo.some(
      (servicio) => servicio.nombre === producto.nombre,
    );
    const tipoProducto: TipoRegistro = esServicioTabla
      ? 'Servicio'
      : producto.categoria === 'Medicamentos'
        ? 'Insumo'
        : 'Producto';
    const unidad = esServicioTabla
      ? 'Servicio'
      : producto.presentacion.split(' x ')[0] || 'Unidad';
    const precio = esServicioTabla
      ? 80 + (elementosDemo.indexOf(producto) % 8) * 25
      : 12 + producto.disponible * 7 + (elementosDemo.indexOf(producto) % 5) * 4;
    const serie =
      !esServicioTabla && producto.disponible > 1
        ? codigo.replaceAll('-', '')
        : 'Sin serie';
    const stock = esServicioTabla ? producto.disponible : producto.disponible * 12;

    return {
      codigo,
      estado: 'Activo',
      precio: `Bs ${precio.toFixed(2)}`,
      serie,
      stock,
      subcategoria,
      tipoProducto,
      unidad,
    };
  };
  const productosFiltrados = useMemo(() => {
    const termino = normalizarBusqueda(busqueda.trim());
    const factor = direccion === 'asc' ? 1 : -1;
    return elementosDemo
      .filter(
        (producto) => categoria === 'todas' || producto.categoria === categoria,
      )
      .filter(
        (producto) =>
          !termino ||
          [
            producto.nombre,
            producto.categoria,
            producto.marca,
            producto.presentacion,
            producto.origen,
          ].some((valor) => normalizarBusqueda(valor).includes(termino)),
      )
      .sort((a, b) => {
        const valorA =
          campoOrden === 'codigo'
            ? obtenerDatosTabla(a).codigo
            : a[campoOrden];
        const valorB =
          campoOrden === 'codigo'
            ? obtenerDatosTabla(b).codigo
            : b[campoOrden];
        return (
          valorA.localeCompare(valorB, 'es', {
            numeric: true,
            sensitivity: 'base',
          }) * factor
        );
      });
  }, [busqueda, campoOrden, categoria, direccion, elementosDemo]);
  const totalPaginas = Math.max(
    1,
    Math.ceil(productosFiltrados.length / porPagina),
  );
  const paginaActual = Math.min(pagina, totalPaginas);
  const desde = (paginaActual - 1) * porPagina;
  const productosPagina = useMemo(
    () => productosFiltrados.slice(desde, desde + porPagina),
    [desde, productosFiltrados, porPagina],
  );

  function actualizarFiltro(actualizar: () => void) {
    actualizar();
    setPagina(1);
  }

  function cambiarPorPagina(valor: number) {
    setPorPagina(valor);
    setPagina(1);
  }

  function cambiarModo(siguiente: ModoInventario) {
    setModo(siguiente);
    setPagina(1);
    setPorPagina(siguiente === 'galeria' ? 5 : 10);
  }

  const controlesSuperiores = (
    <div className="inventario-paginacion inventario-paginacion-superior">
      <span className="inventario-contador">
        {productosFiltrados.length} {nombreElementos}
      </span>
      <span>
        {productosFiltrados.length === 0 ? 0 : desde + 1}-
        {Math.min(desde + porPagina, productosFiltrados.length)} de{' '}
        {productosFiltrados.length}
      </span>
      <label>
        Mostrar
        <select
          value={porPagina}
          onChange={(event) => cambiarPorPagina(Number(event.target.value))}
          aria-label="Productos por pagina"
        >
          {(modo === 'galeria' ? [5, 8, 10, 15] : [10, 15, 20, 30]).map(
            (cantidad) => (
              <option key={cantidad} value={cantidad}>
                {cantidad}
              </option>
            ),
          )}
        </select>
        {nombreElementos}
      </label>
      <div className="inventario-paginas">
        <button
          disabled={paginaActual === 1}
          onClick={() => setPagina(1)}
          aria-label="Primera pagina"
        >
          {'<<'}
        </button>
        <button
          disabled={paginaActual === 1}
          onClick={() => setPagina(paginaActual - 1)}
          aria-label="Pagina anterior"
        >
          {'<'}
        </button>
        <strong>
          Pagina {paginaActual} de {totalPaginas}
        </strong>
        <button
          disabled={paginaActual === totalPaginas}
          onClick={() => setPagina(paginaActual + 1)}
          aria-label="Pagina siguiente"
        >
          {'>'}
        </button>
        <button
          disabled={paginaActual === totalPaginas}
          onClick={() => setPagina(totalPaginas)}
          aria-label="Ultima pagina"
        >
          {'>>'}
        </button>
      </div>
    </div>
  );

  const controles = (
    <div className="inventario-paginacion">
      <span>
        {productosFiltrados.length === 0 ? 0 : desde + 1}-
        {Math.min(desde + porPagina, productosFiltrados.length)} de{' '}
        {productosFiltrados.length}
      </span>
      <label>
        Mostrar
        <select
          value={porPagina}
          onChange={(event) => cambiarPorPagina(Number(event.target.value))}
          aria-label="Productos por pagina"
        >
          {(modo === 'galeria' ? [5, 8, 10, 15] : [10, 15, 20, 30]).map(
            (cantidad) => (
              <option key={cantidad} value={cantidad}>
                {cantidad}
              </option>
            ),
          )}
        </select>
        {nombreElementos}
      </label>
      <div className="inventario-paginas">
        <button
          disabled={paginaActual === 1}
          onClick={() => setPagina(1)}
          aria-label="Primera pagina"
        >
          {'<<'}
        </button>
        <button
          disabled={paginaActual === 1}
          onClick={() => setPagina(paginaActual - 1)}
          aria-label="Pagina anterior"
        >
          {'<'}
        </button>
        <strong>
          Pagina {paginaActual} de {totalPaginas}
        </strong>
        <button
          disabled={paginaActual === totalPaginas}
          onClick={() => setPagina(paginaActual + 1)}
          aria-label="Pagina siguiente"
        >
          {'>'}
        </button>
        <button
          disabled={paginaActual === totalPaginas}
          onClick={() => setPagina(totalPaginas)}
          aria-label="Ultima pagina"
        >
          {'>>'}
        </button>
      </div>
    </div>
  );

  return (
    <section className="inventario-catalogo">
      <div className="inventario-contenido">
        <div className="inventario-controles-principales">
          <div className="inventario-filtros inventario-filtros-productos">
            <label>
              <Icon name="search" size={17} />
              <input
                value={busqueda}
                onChange={(event) =>
                  actualizarFiltro(() => setBusqueda(event.target.value))
                }
                placeholder={`Buscar ${
                  esServicio
                    ? 'servicio'
                    : esVistaGeneral
                      ? 'producto, insumo o servicio'
                      : 'producto o insumo'
                }`}
                aria-label={`Buscar ${nombreElemento}`}
              />
            </label>
            <select
              value={direccion}
              onChange={(event) =>
                actualizarFiltro(() =>
                  setDireccion(event.target.value as 'asc' | 'desc'),
                )
              }
              aria-label="Direccion de orden"
            >
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>
            <select
              value={categoria}
              onChange={(event) =>
                actualizarFiltro(() => setCategoria(event.target.value))
              }
              aria-label="Filtrar por categoria"
            >
              <option value="todas">Todas las categorias</option>
              {categorias.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <label className="inventario-orden">
              Ordenar por
              <select
                value={campoOrden}
                onChange={(event) =>
                  actualizarFiltro(() =>
                    setCampoOrden(event.target.value as CampoOrden),
                  )
                }
                aria-label="Campo para ordenar"
              >
                <option value="codigo">Codigo</option>
                <option value="nombre">Nombre del {nombreElemento}</option>
                <option value="categoria">Categoria</option>
                <option value="marca">Otro: marca</option>
              </select>
            </label>
          </div>
          <div className="inventario-toolbar">
            <div
              className="inventario-modo"
              role="group"
              aria-label="Modo de visualizacion"
            >
              <button
                className={modo === 'galeria' ? 'activo' : ''}
                onClick={() => cambiarModo('galeria')}
              >
                <Icon name="package" size={16} /> Galeria
              </button>
              <button
                className={modo === 'listado' ? 'activo' : ''}
                onClick={() => cambiarModo('listado')}
              >
                <Icon name="menu" size={16} /> Listado
              </button>
            </div>
              <button
                className="inventario-nuevo"
                type="button"
                onClick={() => setModalRegistroAbierto(true)}
              >
                <Icon name="plus" size={17} /> Registro
              </button>
          </div>
        </div>
        {controlesSuperiores}
        {productosFiltrados.length === 0 && (
          <p role="status">
            No se encontraron {nombreElementos} con estos filtros.
          </p>
        )}
        {modo === 'listado' ? (
          <div
            className="inventario-tabla inventario-tabla-productos"
            role="table"
            aria-label={titulo}
          >
            <div className="inventario-tabla-head" role="row">
              <span role="columnheader">Codigo</span>
              <span role="columnheader">Nombre o identificacion</span>
              <span role="columnheader">Tipo</span>
              <span role="columnheader">Categoria</span>
              <span role="columnheader">Sub categoria</span>
              <span role="columnheader">Unidad</span>
              <span role="columnheader">Stock</span>
              <span role="columnheader">Precio venta</span>
              <span role="columnheader">Estado</span>
              <span role="columnheader">Serie / barras</span>
              <span role="columnheader">Acciones</span>
            </div>
            {productosPagina.map((producto) => {
              const datosTabla = obtenerDatosTabla(producto);
              return (
                <article
                  className="inventario-row"
                  role="row"
                  key={producto.nombre}
                >
                  <span className="inventario-codigo">{datosTabla.codigo}</span>
                  <div className="inventario-producto-cell">
                    <strong>{producto.nombre}</strong>
                  </div>
                  <span className="inventario-chip">{datosTabla.tipoProducto}</span>
                  <span className="inventario-chip">{producto.categoria}</span>
                  <span>{datosTabla.subcategoria}</span>
                  <span>{datosTabla.unidad}</span>
                  <span className="inventario-stock">{datosTabla.stock}</span>
                  <span className="inventario-precio">{datosTabla.precio}</span>
                  <span className="inventario-disponible">
                    <i /> {datosTabla.estado}
                  </span>
                  <span className="inventario-serie">{datosTabla.serie}</span>
                  <div className="inventario-acciones">
                    <button aria-label={`Ver ${producto.nombre}`}>
                      <Icon name="eye" size={15} />
                    </button>
                    <button>Editar</button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="inventario-galeria" aria-label={titulo}>
            {productosPagina.map((producto) => (
              <article className="inventario-card" key={producto.nombre}>
                <div className="inventario-card-imagen">
                  <span>{producto.categoria}</span>
                  <strong>
                    <i /> {esServicio ? 'Activo' : 'Disponible'}
                  </strong>
                </div>
                <div className="inventario-card-cuerpo">
                  <small>{producto.marca}</small>
                  <h3>{producto.nombre}</h3>
                  <p>{producto.presentacion}</p>
                  <footer>
                    <span>
                      <Icon name="building" size={15} /> {producto.proveedores}{' '}
                      proveedores
                    </span>
                    <span>{producto.origen}</span>
                  </footer>
                </div>
                <div className="inventario-card-actions">
                  <button>
                    <Icon name="eye" size={15} /> Ver {nombreElemento}
                  </button>
                  <button>Editar</button>
                </div>
              </article>
            ))}
          </div>
        )}
        {controles}
      </div>
      {modalRegistroAbierto && (
        <div
          className="inventario-modal-fondo"
          role="presentation"
          onMouseDown={() => setModalRegistroAbierto(false)}
        >
          <section
            className="inventario-modal inventario-modal-registro"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventario-modal-registro-titulo"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>Nuevo registro</span>
                <h3 id="inventario-modal-registro-titulo">
                  Registrar inventario
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalRegistroAbierto(false)}
                aria-label="Cerrar"
              >
                <Icon name="close" size={18} />
              </button>
            </header>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setModalRegistroAbierto(false);
              }}
            >
              <div className="inventario-modal-cuerpo inventario-modal-registro-grid">
                <label>
                  <span>Codigo</span>
                  <input value={codigoRegistro} disabled readOnly />
                </label>
                <label>
                  <span>Nombre o identificacion</span>
                  <input required placeholder="Ej. Jeringa descartable 10 ml" />
                </label>
                <label className="inventario-campo-completo">
                  <span>Descripcion</span>
                  <textarea
                    required
                    rows={3}
                    placeholder="Detalle breve del producto, insumo o servicio"
                  />
                </label>
                <label>
                  <span>Unidad de medida</span>
                  <select required defaultValue="">
                    <option value="" disabled>
                      Seleccionar
                    </option>
                    <option>Unidad</option>
                    <option>Caja</option>
                    <option>Paquete</option>
                    <option>Frasco</option>
                    <option>Servicio</option>
                  </select>
                </label>
                <label>
                  <span>Tipo</span>
                  <select
                    value={tipoRegistro}
                    onChange={(event) =>
                      setTipoRegistro(event.target.value as TipoRegistro)
                    }
                    required
                  >
                    <option>Producto</option>
                    <option>Insumo</option>
                    <option>Servicio</option>
                  </select>
                </label>
                <label>
                  <span>Categoria</span>
                  <select
                    value={categoriaRegistro}
                    onChange={(event) => {
                      setCategoriaRegistro(event.target.value);
                      setSubcategoriaRegistro('');
                    }}
                    required
                  >
                    <option value="" disabled>
                      Seleccionar
                    </option>
                    {categorias.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Sub categoria</span>
                  <select
                    value={subcategoriaRegistro}
                    onChange={(event) => setSubcategoriaRegistro(event.target.value)}
                    required
                    disabled={!categoriaRegistro}
                  >
                    <option value="" disabled>
                      Seleccionar
                    </option>
                    {subcategoriasDisponibles.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Precio de venta</span>
                  <input required min="0" step="0.01" type="number" placeholder="0.00" />
                </label>
                <label>
                  <span>Estado</span>
                  <select required defaultValue="activo">
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </label>
                <label className="inventario-campo-serie">
                  <span>Numero de serie</span>
                  <input
                    disabled={!serieHabilitada}
                    placeholder="Codigo de barras"
                  />
                </label>
                <label className="inventario-serie-toggle">
                  <input
                    type="checkbox"
                    checked={serieHabilitada}
                    onChange={(event) => setSerieHabilitada(event.target.checked)}
                  />
                  <span>Usar numero de serie</span>
                </label>
              </div>
              <footer>
                <button
                  className="inventario-secundario"
                  type="button"
                  onClick={() => setModalRegistroAbierto(false)}
                >
                  Cancelar
                </button>
                <button className="inventario-primario" type="submit">
                  Guardar registro
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
