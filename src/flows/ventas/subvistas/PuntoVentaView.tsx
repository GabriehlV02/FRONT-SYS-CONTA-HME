import { useMemo, useState } from 'react';
import Icon from '@ui/components/Icon';
import { SelectMenu } from '@ui/components/SelectMenu';
import {
  catalogoVentas,
  type ItemVenta,
  type TipoVenta,
} from '../datos/catalogoVentas';

type Linea = ItemVenta & { cantidad: number };
type Pago = { id: number; metodo: string; monto: string };
type Cliente = {
  nombre: string;
  documento: string;
  correo: string;
  celular: string;
  direccion: string;
};
const money = (value: number) => `Bs ${value.toFixed(2)}`;
const nuevoPago = (id: number): Pago => ({ id, metodo: 'Efectivo', monto: '' });

export function PuntoVentaView() {
  const [sucursal, setSucursal] = useState('Hospital María Esperanza');
  const [caja, setCaja] = useState('Caja 01 · Recepción');
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState<'Todos' | TipoVenta>('Todos');
  const [modoVista, setModoVista] = useState<'galeria' | 'listado'>('galeria');
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [cliente, setCliente] = useState<Cliente>({
    nombre: '',
    documento: '',
    correo: '',
    celular: '',
    direccion: '',
  });
  const [clienteModo, setClienteModo] = useState<
    'inicio' | 'buscar' | 'registrar'
  >('inicio');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(false);
  const [clienteExpandido, setClienteExpandido] = useState(false);
  const [descuento, setDescuento] = useState('');
  const [pagos, setPagos] = useState<Pago[]>([nuevoPago(1)]);
  const [mensaje, setMensaje] = useState('');
  const resultados = useMemo(
    () =>
      catalogoVentas.filter(
        (item) =>
          (tipo === 'Todos' || item.tipo === tipo) &&
          `${item.nombre} ${item.codigo} ${item.tipo}`
            .toLowerCase()
            .includes(busqueda.toLowerCase()),
      ),
    [busqueda, tipo],
  );
  const subtotal = lineas.reduce(
    (total, linea) => total + linea.precio * linea.cantidad,
    0,
  );
  const descuentoAplicado = Math.min(
    Math.max(Number(descuento) || 0, 0),
    subtotal,
  );
  const total = subtotal - descuentoAplicado;
  const pagado = pagos.reduce(
    (totalPago, pago) => totalPago + Math.max(Number(pago.monto) || 0, 0),
    0,
  );
  const pendiente = Math.max(total - pagado, 0);
  const cambio = Math.max(pagado - total, 0);
  const agregar = (item: ItemVenta) => {
    setLineas((actual) =>
      actual.some((linea) => linea.id === item.id)
        ? actual.map((linea) =>
            linea.id === item.id
              ? { ...linea, cantidad: linea.cantidad + 1 }
              : linea,
          )
        : [...actual, { ...item, cantidad: 1 }],
    );
    setMensaje(`${item.nombre} agregado al carrito.`);
  };
  const cantidad = (id: string, delta: number) =>
    setLineas((actual) =>
      actual
        .map((linea) =>
          linea.id === id
            ? { ...linea, cantidad: Math.max(0, linea.cantidad + delta) }
            : linea,
        )
        .filter((linea) => linea.cantidad),
    );
  const quitar = (id: string) =>
    setLineas((actual) => actual.filter((linea) => linea.id !== id));
  const cambiarPago = (id: number, campo: 'metodo' | 'monto', valor: string) =>
    setPagos((actual) =>
      actual.map((pago) =>
        pago.id === id ? { ...pago, [campo]: valor } : pago,
      ),
    );
  const actualizarCliente = (campo: keyof Cliente, valor: string) =>
    setCliente((actual) => ({ ...actual, [campo]: valor }));
  const seleccionarCliente = () => {
    setCliente({
      nombre: 'Cliente mostrador',
      documento: '0',
      correo: '',
      celular: '',
      direccion: '',
    });
    setClienteSeleccionado(true);
    setClienteModo('inicio');
    setClienteExpandido(false);
  };
  const guardarCliente = () => {
    if (!cliente.nombre.trim() || !cliente.documento.trim()) return;
    setClienteSeleccionado(true);
    setClienteModo('inicio');
    setClienteExpandido(false);
  };
  const cobrar = () => {
    if (!lineas.length || pendiente > 0) return;
    setMensaje('Venta registrada correctamente. Lista para imprimir factura.');
    setLineas([]);
    setPagos([nuevoPago(Date.now())]);
    setDescuento('');
  };

  return (
    <section className="punto-venta punto-pos">
      <header className="punto-pos-cabecera punto-pos-contexto">
        <div className="punto-contexto">
          <label>
            Sucursal
            <SelectMenu
              ariaLabel="Seleccionar sucursal"
              value={sucursal}
              onChange={setSucursal}
              options={[
                'Hospital María Esperanza',
                'Centro de Hemodialisis',
                'Policonsultorio-Diabetes',
              ]}
            />
          </label>
          <label>
            Caja
            <SelectMenu
              ariaLabel="Seleccionar caja"
              value={caja}
              onChange={setCaja}
              options={['Caja 01 · Recepción', 'Caja 02 · Farmacia']}
            />
          </label>
        </div>
      </header>
      <div className="punto-pos-layout">
        <section className="punto-catalogo">
          <div className="punto-busquedas">
            <label>
              <Icon name="search" size={17} />
              <input
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar producto por nombre, código de barras o categoría…"
              />
            </label>
          </div>
          <div className="punto-catalogo-filtros">
            <div className="punto-categorias">
              {(['Todos', 'Producto', 'Insumo', 'Servicio'] as const).map(
                (opcion) => (
                  <button
                    type="button"
                    className={tipo === opcion ? 'activo' : ''}
                    key={opcion}
                    onClick={() => setTipo(opcion)}
                  >
                    {opcion}
                  </button>
                ),
              )}
            </div>
            <div className="punto-modo-vista" role="group" aria-label="Tipo de vista">
              <button
                type="button"
                className={modoVista === 'listado' ? 'activo' : ''}
                aria-pressed={modoVista === 'listado'}
                onClick={() => setModoVista('listado')}
              >
                <Icon name="menu" size={16} /> Listado
              </button>
              <button
                type="button"
                className={modoVista === 'galeria' ? 'activo' : ''}
                aria-pressed={modoVista === 'galeria'}
                onClick={() => setModoVista('galeria')}
              >
                <Icon name="image" size={16} /> Galería
              </button>
            </div>
          </div>
          {mensaje && (
            <p
              className={`punto-aviso ${mensaje.includes('agregado') ? 'exito' : ''}`}
            >
              {mensaje}
            </p>
          )}
          {modoVista === 'galeria' ? (
            <div className="punto-tarjetas">
              {resultados.map((item) => (
              <article key={item.id}>
                <div className="punto-tarjeta-avatar">
                  <span>
                    {item.nombre
                      .split(' ')
                      .slice(0, 2)
                      .map((palabra) => palabra[0])
                      .join('')}
                  </span>
                </div>
                <div className="punto-tarjeta-info">
                  <small>{item.codigo}</small>
                  <strong>{item.nombre}</strong>
                  <span>
                    {item.tipo}
                    {item.stock !== undefined ? ` · Stock ${item.stock}` : ''}
                  </span>
                </div>
                <footer>
                  <div>
                    <b>{money(item.precio)}</b>
                    <small>{item.tipo}</small>
                  </div>
                  <button type="button" onClick={() => agregar(item)}>
                    <Icon name="plus" size={16} /> Agregar
                  </button>
                </footer>
              </article>
              ))}
            </div>
          ) : (
            <div className="punto-listado" role="list" aria-label="Listado de productos">
              {resultados.map((item) => (
                <article key={item.id} role="listitem">
                  <div className="punto-listado-avatar">
                    {item.nombre.split(' ').slice(0, 2).map((palabra) => palabra[0]).join('')}
                  </div>
                  <div className="punto-listado-info">
                    <strong>{item.nombre}</strong>
                    <span>{item.codigo} · {item.tipo}{item.stock !== undefined ? ` · Stock ${item.stock}` : ''}</span>
                  </div>
                  <b>{money(item.precio)}</b>
                  <button type="button" onClick={() => agregar(item)}>
                    <Icon name="plus" size={16} /> Agregar
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
        <aside className="punto-carrito">
          <header>
            <div>
              <p>CARRITO DE VENTA</p>
              <strong>
                {lineas.reduce(
                  (totalLineas, linea) => totalLineas + linea.cantidad,
                  0,
                )}{' '}
                productos
              </strong>
            </div>
            <Icon name="cart" size={24} />
          </header>
          <section
            className={`punto-cliente ${clienteSeleccionado ? 'cliente-seleccionado' : ''}`}
          >
            <header>
              <strong>Cliente</strong>
              {clienteSeleccionado && (
                <button
                  className="cliente-cambiar"
                  type="button"
                  onClick={() => {
                    setClienteSeleccionado(false);
                    setClienteModo('inicio');
                  }}
                >
                  Cambiar
                </button>
              )}
            </header>
            {!clienteSeleccionado && clienteModo === 'inicio' && (
              <div className="cliente-acciones">
                <button type="button" onClick={() => setClienteModo('buscar')}>
                  <Icon name="search" size={15} /> Buscar cliente
                </button>
                <button
                  type="button"
                  onClick={() => setClienteModo('registrar')}
                >
                  <Icon name="plus" size={15} /> Registrar cliente
                </button>
              </div>
            )}
            {!clienteSeleccionado && clienteModo === 'buscar' && (
              <div className="cliente-busqueda">
                <label>
                  <Icon name="search" size={16} />
                  <input placeholder="Buscar por nombre, NIT o CI" />
                </label>
                <button type="button" onClick={seleccionarCliente}>
                  Seleccionar cliente
                </button>
                <button
                  className="cliente-secundario"
                  type="button"
                  onClick={() => setClienteModo('inicio')}
                >
                  Cancelar
                </button>
              </div>
            )}
            {!clienteSeleccionado && clienteModo === 'registrar' && (
              <div className="cliente-formulario">
                <input
                  value={cliente.nombre}
                  onChange={(event) =>
                    actualizarCliente('nombre', event.target.value)
                  }
                  placeholder="Nombre o razón social *"
                />
                <input
                  value={cliente.documento}
                  onChange={(event) =>
                    actualizarCliente('documento', event.target.value)
                  }
                  placeholder="NIT / CI *"
                />
                <input
                  value={cliente.correo}
                  onChange={(event) =>
                    actualizarCliente('correo', event.target.value)
                  }
                  placeholder="Correo electrónico"
                />
                <input
                  value={cliente.celular}
                  onChange={(event) =>
                    actualizarCliente('celular', event.target.value)
                  }
                  placeholder="Número de celular"
                />
                <input
                  value={cliente.direccion}
                  onChange={(event) =>
                    actualizarCliente('direccion', event.target.value)
                  }
                  placeholder="Dirección fiscal"
                />
                <div>
                  <button type="button" onClick={guardarCliente}>
                    Guardar cliente
                  </button>
                  <button
                    className="cliente-secundario"
                    type="button"
                    onClick={() => setClienteModo('inicio')}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            {clienteSeleccionado && (
              <>
                <button
                  className="cliente-resumen"
                  type="button"
                  onClick={() => setClienteExpandido((actual) => !actual)}
                  aria-expanded={clienteExpandido}
                >
                  <span>
                    <small>Nombre o razón social</small>
                    <b>{cliente.nombre}</b>
                  </span>
                  <span>
                    <small>NIT / CI</small>
                    <b>{cliente.documento}</b>
                  </span>
                  <Icon name="chevronDown" size={18} />
                </button>
                {clienteExpandido && (
                  <div className="cliente-formulario cliente-detalle">
                    <input
                      value={cliente.correo}
                      onChange={(event) =>
                        actualizarCliente('correo', event.target.value)
                      }
                      placeholder="Correo electrónico"
                    />
                    <input
                      value={cliente.celular}
                      onChange={(event) =>
                        actualizarCliente('celular', event.target.value)
                      }
                      placeholder="Número de celular"
                    />
                    <input
                      value={cliente.direccion}
                      onChange={(event) =>
                        actualizarCliente('direccion', event.target.value)
                      }
                      placeholder="Dirección fiscal"
                    />
                    <small>Datos complementarios para la factura.</small>
                  </div>
                )}
              </>
            )}
          </section>
          <div className="punto-carrito-lineas">
            {lineas.length ? (
              lineas.map((linea) => (
                <article key={linea.id}>
                  <strong>{linea.nombre}</strong>
                  <small>{money(linea.precio)} c/u</small>
                  <div>
                    <button
                      type="button"
                      onClick={() => cantidad(linea.id, -1)}
                    >
                      −
                    </button>
                    <b>{linea.cantidad}</b>
                    <button type="button" onClick={() => cantidad(linea.id, 1)}>
                      +
                    </button>
                    <span>{money(linea.precio * linea.cantidad)}</span>
                    <button
                      className="punto-quitar"
                      type="button"
                      aria-label={`Eliminar ${linea.nombre} de la cuenta`}
                      title="Eliminar producto"
                      onClick={() => quitar(linea.id)}
                    >
                      ×
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p>No hay productos en el carrito.</p>
            )}
          </div>
          <section className="punto-resumen">
            <div>
              <span>Subtotal</span>
              <b>{money(subtotal)}</b>
            </div>
            <label>
              Descuento
              <input
                type="number"
                min="0"
                value={descuento}
                onChange={(event) => setDescuento(event.target.value)}
                placeholder="0.00"
              />
            </label>
            <div className="punto-total">
              <span>Total</span>
              <b>{money(total)}</b>
            </div>
          </section>
          <section className="punto-pago-mixto">
            <header>
              <div>
                <strong>Pago mixto</strong>
                <small>Agrega métodos hasta completar el total</small>
              </div>
              <Icon name="cash" size={20} />
            </header>
            {pagos.map((pago) => (
              <div className="punto-pago-fila" key={pago.id}>
                <select
                  value={pago.metodo}
                  onChange={(event) =>
                    cambiarPago(pago.id, 'metodo', event.target.value)
                  }
                >
                  <option>Efectivo</option>
                  <option>QR</option>
                  <option>Tarjeta</option>
                  <option>Transferencia</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={pago.monto}
                  onChange={(event) =>
                    cambiarPago(pago.id, 'monto', event.target.value)
                  }
                  placeholder="Monto"
                />
                {pagos.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setPagos((actual) =>
                        actual.filter((item) => item.id !== pago.id),
                      )
                    }
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              className="punto-agregar-pago"
              type="button"
              onClick={() =>
                setPagos((actual) => [...actual, nuevoPago(Date.now())])
              }
            >
              <Icon name="plus" size={15} /> Agregar método de pago
            </button>
            <div className="punto-pago-totales">
              <span>
                Total pagado <b>{money(pagado)}</b>
              </span>
              <span>
                Saldo pendiente <b>{money(pendiente)}</b>
              </span>
              {cambio > 0 && (
                <span>
                  Cambio <b>{money(cambio)}</b>
                </span>
              )}
            </div>
          </section>
          <button
            className="punto-cobrar"
            type="button"
            disabled={!lineas.length || pendiente > 0}
            onClick={cobrar}
          >
            <Icon name="cash" size={17} /> Cobrar e imprimir factura
          </button>
        </aside>
      </div>
    </section>
  );
}
