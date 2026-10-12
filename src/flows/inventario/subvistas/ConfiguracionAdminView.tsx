import { useState } from 'react';

type RecuadroProps = { titulo: string };

const tiposIniciales = [
  { nombre: 'Producto', descripcion: 'Artículos destinados a la venta o distribución.', estado: 'Activo', cantidad: 0 },
  { nombre: 'Insumo', descripcion: 'Materiales utilizados en la operación del hospital.', estado: 'Activo', cantidad: 0 },
  { nombre: 'Servicio', descripcion: 'Prestaciones y servicios ofrecidos por el hospital.', estado: 'Activo', cantidad: 0 },
];

function RecuadroConfiguracion({ titulo }: RecuadroProps) {
  const [busqueda, setBusqueda] = useState('');
  const [tipos, setTipos] = useState(tiposIniciales);
  const [tipoPendiente, setTipoPendiente] = useState<string | null>(null);
  const esTipo = titulo === 'Tipo';
  const tiposFiltrados = tipos.filter((tipo) =>
    `${tipo.nombre} ${tipo.descripcion} ${tipo.estado}`.toLowerCase().includes(busqueda.toLowerCase()),
  );
  function confirmarCambio() {
    if (!tipoPendiente) return;
    setTipos((actuales) => actuales.map((tipo) => tipo.nombre === tipoPendiente
      ? { ...tipo, estado: tipo.estado === 'Activo' ? 'Inactivo' : 'Activo' }
      : tipo));
    setTipoPendiente(null);
  }

  return (
    <section className="inventario-admin-recuadro">
      <h2>{titulo}</h2>
      <div className="inventario-admin-controles">
        <label>
          <span>Buscar</span>
          <input
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder={`Buscar ${titulo.toLowerCase()}`}
          />
        </label>
        <button
          type="button"
          className="inventario-admin-registrar"
          style={{ backgroundColor: '#0284c7', borderColor: '#0369a1', color: '#fff' }}
        >
          Registrar nuevo
        </button>
      </div>
      <div className="inventario-admin-tabla-contenedor">
        <table className="inventario-admin-tabla-configuracion">
          <thead>
            <tr>
              {esTipo ? <>
                <th>Nombre del tipo</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Cantidad</th>
              </> : <>
                <th>Nombre</th>
                <th>Estado</th>
              </>}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {esTipo ? tiposFiltrados.map((tipo) => <tr key={tipo.nombre}>
              <td>{tipo.nombre}</td><td>{tipo.descripcion}</td><td>{tipo.estado}</td><td>{tipo.cantidad}</td>
              <td><div className={`inventario-admin-switch ${tipo.estado === 'Activo' ? 'activo' : ''}`} role="switch" tabIndex={0} aria-label={`Cambiar ${tipo.nombre} a ${tipo.estado === 'Activo' ? 'inactivo' : 'activo'}`} aria-checked={tipo.estado === 'Activo'} onClick={() => setTipoPendiente(tipo.nombre)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setTipoPendiente(tipo.nombre); } }}><span /></div></td>
            </tr>) : <tr><td colSpan={3}>{busqueda ? 'No hay resultados para esta búsqueda.' : 'No hay registros.'}</td></tr>}
            {esTipo && !tiposFiltrados.length && <tr><td colSpan={5}>No hay resultados para esta búsqueda.</td></tr>}
          </tbody>
        </table>
      </div>
      {tipoPendiente && <div className="inventario-admin-modal-fondo" role="presentation" onClick={() => setTipoPendiente(null)}>
        <div className="inventario-admin-modal" role="dialog" aria-modal="true" aria-labelledby="confirmar-cambio-titulo" onClick={(event) => event.stopPropagation()}>
          <h3 id="confirmar-cambio-titulo">Confirmar cambio</h3>
          <p>¿Estás seguro de que quieres cambiar <strong>{tipoPendiente}</strong> de {tipos.find((tipo) => tipo.nombre === tipoPendiente)?.estado.toLowerCase()} a {tipos.find((tipo) => tipo.nombre === tipoPendiente)?.estado === 'Activo' ? 'inactivo' : 'activo'}?</p>
          <div className="inventario-admin-modal-acciones"><button type="button" onClick={confirmarCambio}>Sí</button><button type="button" onClick={() => setTipoPendiente(null)}>No</button><button type="button" onClick={() => setTipoPendiente(null)}>Cancelar</button></div>
        </div>
      </div>}
    </section>
  );
}

export function ConfiguracionAdminView() {
  const recuadros = [
    'Tipo',
    'Unidad de medida',
    'Categoría',
    'Subcategoría',
    'Clasificación / familia',
  ];

  return (
    <section className="inventario-admin" aria-label="Configuración admin">
      <div className="inventario-admin-recuadros">
        {recuadros.map((titulo) => <RecuadroConfiguracion key={titulo} titulo={titulo} />)}
      </div>
    </section>
  );
}
