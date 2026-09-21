import { Brand } from './Brand';

export function LoginBalancePanel({ subtitle }: { subtitle: string }) {
  return <section className="login-balance-panel">
    <Brand name="Balance" subtitle={subtitle} logoSrc="/logo-hospital-contable-lila.png" />
    <div className="login-balance-copy">
      <span className="login-balance-kicker">SISTEMA ADMINISTRATIVO</span>
      <h2>Gestión <strong>contable</strong></h2>
      <p>Accede a la información de ventas, inventario y operaciones del Hospital María Esperanza desde un solo lugar.</p>
    </div>
    <p className="login-institution">Hospital María Esperanza · Administración y contabilidad</p>
  </section>;
}
