import { Brand } from './Brand';

export function LoginBalancePanel({ subtitle }: { subtitle: string }) {
  return <section className="login-balance-panel">
    <Brand name="Balance" subtitle={subtitle} logoSrc="/logo-hospital-contable-corporativo.png" />
    <img className="login-contable-ilustracion" src="/login-contable-ilustracion.svg" alt="" aria-hidden="true" />
    <div className="login-balance-copy">
      <span className="login-balance-kicker">SISTEMA ADMINISTRATIVO</span>
      <h2>Control claro.<br /><strong>Decisiones seguras.</strong></h2>
      <p>La operación financiera del hospital, conectada en un solo espacio.</p>
    </div>
    <div className="login-capacidades" aria-label="Áreas del sistema">
      <span><i aria-hidden="true">01</i> Ventas y caja</span>
      <span><i aria-hidden="true">02</i> Inventario</span>
      <span><i aria-hidden="true">03</i> Gestión contable</span>
    </div>
    <p className="login-institution">Hospital María Esperanza <span aria-hidden="true">·</span> Administración</p>
  </section>;
}
