import { useState, type FormEvent } from 'react';
import { productosDemo, serviciosDemo } from '../../inventario/datos/catalogoDemo';

export type Cargo = { concepto: string; cantidad: number; monto: number; fecha: string };
type Pago = { id: string; monto: number; nombre: string; documento: string; telefono: string; relacion: string; metodo: string; fecha: string };
export type Movimientos = { cargos: Cargo[]; pagos: Pago[] };
export function leerMovimientos(id: string): Movimientos {
  try { const datos = JSON.parse(localStorage.getItem(`contable-cuenta-${id}`) || 'null'); if (Array.isArray(datos?.cargos) && Array.isArray(datos?.pagos)) return datos; } catch { /* Sin datos locales válidos. */ }
  return { cargos: [], pagos: [] };
}
const catalogo = [...productosDemo.map((item, i) => ({ nombre: item.nombre, categoria: item.categoria, precio: 15 + (i % 10) * 12 })), ...serviciosDemo.map((item, i) => ({ nombre: item.nombre, categoria: item.categoria, precio: 50 + (i % 12) * 25 }))];
const bs = (valor: number) => `Bs ${valor.toFixed(2)}`;
const fecha = (valor: string) => new Date(valor).toLocaleString('es-BO');
const inicial = { nombre: '', documento: '', telefono: '', relacion: '', metodo: 'Efectivo', monto: '' };

export function OperacionCuenta({ id, modo, saldo, movimientos, onGuardar }: { id: string; modo: 'cargar' | 'cobrar'; saldo: number; movimientos: Movimientos; onGuardar: (datos: Movimientos) => void }) {
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState<(typeof catalogo[number] & { cantidad: number })[]>([]);
  const [formulario, setFormulario] = useState(inicial);
  const [mensaje, setMensaje] = useState('');
  const total = carrito.reduce((suma, item) => suma + item.precio * item.cantidad, 0);
  function guardar(datos: Movimientos) {
    try { localStorage.setItem(`contable-cuenta-${id}`, JSON.stringify(datos)); onGuardar(datos); return true; }
    catch { setMensaje('No se pudo guardar. Revisa el almacenamiento del navegador.'); return false; }
  }
  function cargar() {
    if (!carrito.length) return;
    const instante = new Date().toISOString();
    if (guardar({ ...movimientos, cargos: [...movimientos.cargos, ...carrito.map(item => ({ concepto: item.nombre, cantidad: item.cantidad, monto: Math.round(item.precio * item.cantidad * 100) / 100, fecha: instante }))] })) { setCarrito([]); setBusqueda(''); setMensaje('Consumos cargados a la cuenta.'); }
  }
  function cobrar(event: FormEvent) {
    event.preventDefault();
    const monto = Number(formulario.monto);
    if (!Number.isFinite(monto) || monto <= 0 || !formulario.nombre.trim() || !formulario.documento.trim()) return;
    const pago: Pago = { ...formulario, nombre: formulario.nombre.trim(), documento: formulario.documento.trim(), monto: Math.round(monto * 100) / 100, fecha: new Date().toISOString(), id: crypto.randomUUID() };
    if (guardar({ ...movimientos, pagos: [...movimientos.pagos, pago] })) { setFormulario(inicial); setMensaje('Pago a cuenta registrado.'); }
  }
  return <div className="cuenta-operacion-form">
    <small>Demostración local · Guardado en este navegador</small>
    {modo === 'cargar' ? <>
      <label>Buscar producto, insumo o servicio<input type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Nombre o categoría" /></label>
      {busqueda.trim() && <div className="cuenta-resultados">{catalogo.filter(item => `${item.nombre} ${item.categoria}`.toLocaleLowerCase().includes(busqueda.trim().toLocaleLowerCase())).map(item => <button type="button" key={item.nombre} onClick={() => { setMensaje(''); setCarrito(actual => actual.some(linea => linea.nombre === item.nombre) ? actual.map(linea => linea.nombre === item.nombre ? { ...linea, cantidad: linea.cantidad + 1 } : linea) : [...actual, { ...item, cantidad: 1 }]); setBusqueda(''); }}><span>{item.nombre}</span><b>{bs(item.precio)}</b></button>)}</div>}
      <section className="cuenta-carrito"><header><strong>Consumos por cargar</strong><span>{carrito.length} {carrito.length === 1 ? 'ítem' : 'ítems'}</span></header>
      {!carrito.length && <small>Selecciona elementos del buscador.</small>}
      {carrito.map(item => <article className="cuenta-carrito-linea" key={item.nombre}><div><strong>{item.nombre}</strong><small>{bs(item.precio)} unitario</small></div><div className="cuenta-cantidad"><button type="button" onClick={() => setCarrito(actual => actual.map(linea => linea.nombre === item.nombre ? { ...linea, cantidad: linea.cantidad - 1 } : linea).filter(linea => linea.cantidad > 0))} aria-label={`Quitar una unidad de ${item.nombre}`}>−</button><span>{item.cantidad}</span><button type="button" onClick={() => setCarrito(actual => actual.map(linea => linea.nombre === item.nombre ? { ...linea, cantidad: Math.min(linea.cantidad + 1, 9999) } : linea))} aria-label={`Agregar una unidad de ${item.nombre}`}>+</button></div><b>{bs(item.precio * item.cantidad)}</b></article>)}</section>
      <strong>Total por cargar: {bs(total)}</strong>
      <div className="cuenta-form-acciones"><button type="button" className="cuenta-confirmar" disabled={!carrito.length} onClick={cargar}>Cargar</button><button type="button" className="cuenta-cancelar" onClick={() => { setCarrito([]); setBusqueda(''); setMensaje(''); }}>Cancelar</button></div>
    </> : <form onSubmit={cobrar}>
      <strong>{saldo < 0 ? 'Saldo a favor' : 'Saldo pendiente'}: {bs(Math.abs(saldo))}</strong>
      <label>Monto del pago (Bs)<input required type="number" min="0.01" step="0.01" value={formulario.monto} onChange={e => setFormulario({ ...formulario, monto: e.target.value })} /></label>
      {(['nombre', 'documento', 'telefono', 'relacion'] as const).map(campo => <label key={campo}>{({ nombre: 'Nombre completo del pagador', documento: 'CI / documento del pagador', telefono: 'Teléfono (opcional)', relacion: 'Relación con el paciente (opcional)' })[campo]}<input required={campo === 'nombre' || campo === 'documento'} value={formulario[campo]} onChange={e => setFormulario({ ...formulario, [campo]: e.target.value })} /></label>)}
      <label>Método de pago<select value={formulario.metodo} onChange={e => setFormulario({ ...formulario, metodo: e.target.value })}>{['Efectivo', 'QR', 'Transferencia', 'Tarjeta'].map(item => <option key={item}>{item}</option>)}</select></label>
      <small>La fecha y hora se registran automáticamente. Los excedentes quedan a favor del paciente.</small>
      <div className="cuenta-form-acciones"><button type="submit" className="cuenta-confirmar">Registrar pago</button><button type="button" className="cuenta-cancelar" onClick={() => { setFormulario(inicial); setMensaje(''); }}>Cancelar</button></div>
    </form>}
    {mensaje && <p role="status">{mensaje}</p>}
    <section className="cuenta-historial-pagos"><h4>Historial de pagos</h4>{!movimientos.pagos.length && <small>Sin pagos registrados en esta demostración.</small>}{[...movimientos.pagos].reverse().map(pago => <article key={pago.id}><strong>{bs(pago.monto)} · {pago.metodo}</strong><time dateTime={pago.fecha}>{fecha(pago.fecha)}</time><span>{pago.nombre} · {pago.documento}</span>{pago.telefono && <span>Tel. {pago.telefono}</span>}{pago.relacion && <span>{pago.relacion}</span>}</article>)}</section>
  </div>;
}
