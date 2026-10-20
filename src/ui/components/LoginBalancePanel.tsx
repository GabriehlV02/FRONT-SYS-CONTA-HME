import { Brand } from './Brand';

export function LoginBalancePanel({ subtitle }: { subtitle: string }) {
  return <section className="login-balance-panel">
    <Brand name="Balance" subtitle={subtitle} logoSrc="/logo-hospital-contable-corporativo.png" />
    <div className="login-balance-copy">
      <span className="login-balance-kicker">Sistema administrativo</span>
      <h2>Gestión contable</h2>
      <p>Accede a la información de ventas, inventario y operaciones del Hospital María Esperanza desde un solo lugar.</p>
    </div>
    <p className="login-institution">Hospital María Esperanza · Administración y contabilidad</p>
  </section>;
}
