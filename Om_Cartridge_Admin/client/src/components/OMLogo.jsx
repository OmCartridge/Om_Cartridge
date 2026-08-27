/**
 * OM Logo Component - SVG based brand mark
 * Variants: 'full' | 'compact' | 'invoice'
 */
const OMLogo = ({ variant = 'full', className = '' }) => {
  if (variant === 'compact') {
    return (
      <div className={`om-logo-compact ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="36" height="36" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="22" r="12" fill="#15527A" />
          <circle cx="14" cy="22" r="7" fill="#fff" />
          <circle cx="14" cy="22" r="3.5" fill="#ED3838" />
          <rect x="28" y="10" width="14" height="24" rx="3" fill="#15527A" />
          <rect x="30" y="14" width="10" height="3" rx="1" fill="#fff" />
          <rect x="30" y="20" width="10" height="3" rx="1" fill="#fff" />
          <rect x="30" y="26" width="10" height="3" rx="1" fill="#fff" />
        </svg>
        <div>
          <div style={{ fontWeight: 800, fontSize: '15px', color: '#15527A', lineHeight: 1 }}>OM CARTRIDGE</div>
        </div>
      </div>
    );
  }

  if (variant === 'invoice') {
    return (
      <div className={`om-logo-invoice ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <svg width="30" height="30" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="22" r="12" fill="#15527A" />
          <circle cx="14" cy="22" r="7" fill="#fff" />
          <circle cx="14" cy="22" r="3.5" fill="#ED3838" />
          <rect x="28" y="10" width="14" height="24" rx="3" fill="#15527A" />
          <rect x="30" y="14" width="10" height="3" rx="1" fill="#fff" />
          <rect x="30" y="20" width="10" height="3" rx="1" fill="#fff" />
          <rect x="30" y="26" width="10" height="3" rx="1" fill="#fff" />
        </svg>
      </div>
    );
  }

  // 'full' variant
  return (
    <div className={`om-logo-full ${className}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <svg width="80" height="80" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* O - left circle */}
        <circle cx="28" cy="44" r="24" fill="#15527A" />
        <circle cx="28" cy="44" r="14" fill="#fff" />
        <circle cx="28" cy="44" r="7" fill="#ED3838" />
        {/* Red accent arc */}
        <path d="M28 20 A24 24 0 0 1 52 44" stroke="#ED3838" strokeWidth="3" fill="none" />
        {/* M - right block */}
        <rect x="56" y="20" width="28" height="48" rx="4" fill="#15527A" />
        <rect x="59" y="25" width="8" height="5" rx="1.5" fill="#fff" />
        <rect x="59" y="35" width="8" height="5" rx="1.5" fill="#fff" />
        <rect x="59" y="45" width="8" height="5" rx="1.5" fill="#fff" />
        <rect x="59" y="55" width="8" height="5" rx="1.5" fill="#fff" />
        <rect x="71" y="25" width="8" height="5" rx="1.5" fill="#fff" />
        <rect x="71" y="35" width="8" height="5" rx="1.5" fill="#fff" />
        <rect x="71" y="45" width="8" height="5" rx="1.5" fill="#fff" />
        <rect x="71" y="55" width="8" height="5" rx="1.5" fill="#fff" />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: '22px', color: '#15527A', letterSpacing: '3px', lineHeight: 1 }}>OM CARTRIDGE</div>
        <div style={{ fontSize: '11px', color: '#ED3838', letterSpacing: '1px', marginTop: '4px', fontWeight: 500 }}>
          Printer &amp; Xerox Cartridge Management
        </div>
      </div>
    </div>
  );
};

export default OMLogo;
