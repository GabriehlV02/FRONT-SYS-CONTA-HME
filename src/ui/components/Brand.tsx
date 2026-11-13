export function Brand({
  sidebar = false,
  subtitle,
  name,
  logoSrc,
}: {
  sidebar?: boolean;
  subtitle: string;
  name: string;
  logoSrc?: string;
}) {
  const logoCompleto = '/logo-hospital-contable-celeste.png';
  const logoLoginContable = '/logo-hospital-contable-final.svg?v=login-corporativo-20261113';
  const logoCompacto = '/brand.svg?v=corporativo-0066ad';

  return (
    <div className={sidebar ? 'sistema-marca' : 'login-brand'}>
      <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="logo-azul-corporativo" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0.15 0 0 0 0  0 0.35 0 0 0  0 0 0.55 0 0  0 0 0 1 0" />
        </filter>
      </svg>
      <span className="marca-icono marca-logo-completo" aria-hidden="true">
        <img
          src={logoSrc ?? (sidebar ? logoCompleto : logoLoginContable)}
          alt=""
          onError={(event) => {
            event.currentTarget.parentElement?.classList.add('logo-no-disponible');
          }}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </span>
      {sidebar && (
        <span className="marca-icono marca-logo-compacto" aria-hidden="true">
          <img
            src={logoCompacto}
            alt=""
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </span>
      )}
      <span className="marca-texto">
        <strong>{name}</strong>
        <small>{subtitle}</small>
      </span>
    </div>
  );
}
