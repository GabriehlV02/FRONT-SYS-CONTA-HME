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
  const logoLoginContable = '/logo-hospital-yo-te-cuido-transparente.png?v=transparente-20261115';
  const logoCompleto = logoLoginContable;
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
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            filter: sidebar
              ? 'brightness(0) saturate(100%) invert(18%) sepia(28%) saturate(1464%) hue-rotate(163deg) brightness(93%) contrast(95%)'
              : undefined,
          }}
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
