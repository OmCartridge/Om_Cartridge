import heroImg from '../assets/hero.png';

/**
 * OM Logo Component — uses the actual hero.png brand image
 * Variants: 'full' | 'compact' | 'sidebar' | 'invoice'
 */
const OMLogo = ({ variant = 'full', className = '' }) => {
  if (variant === 'sidebar' || variant === 'compact') {
    return (
      <div className={`om-logo-compact ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
        <img src={heroImg} alt="OM Cartridge" style={{ width: '36px', height: '36px', objectFit: 'contain', flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: '14px', color: '#15527A', lineHeight: 1, letterSpacing: '0.5px' }}>OM CARTRIDGE</div>
          <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px', letterSpacing: '0.5px' }}>Stock & Billing System</div>
        </div>
      </div>
    );
  }

  if (variant === 'invoice') {
    return (
      <img src={heroImg} alt="OM Cartridge" className={className} style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
    );
  }

  // 'full' variant — used on login page
  return (
    <div className={`om-logo-full ${className}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <img src={heroImg} alt="OM Cartridge" style={{ width: '90px', height: '90px', objectFit: 'contain' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: '22px', color: '#fff', letterSpacing: '3px', lineHeight: 1 }}>OM CARTRIDGE</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', letterSpacing: '1.5px', marginTop: '5px', fontWeight: 500 }}>
          STOCK &amp; BILLING MANAGEMENT
        </div>
      </div>
    </div>
  );
};

export default OMLogo;
