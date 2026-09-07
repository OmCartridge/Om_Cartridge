import heroImg from '../assets/hero.png';

/**
 * OM Logo Component — uses the actual hero.png brand image
 * Variants: 'full' | 'compact' | 'sidebar' | 'invoice'
 */
const OMLogo = ({ variant = 'full', className = '' }) => {
  if (variant === 'sidebar' || variant === 'compact') {
    return (
      <div className={`om-logo-compact flex items-center gap-2.5 select-none ${className}`}>
        <img src={heroImg} alt="OM Cartridge" className="w-9 h-9 object-contain flex-shrink-0" />
        <div>
          <div className="font-extrabold text-sm text-navy leading-none tracking-[0.5px]">OM CARTRIDGE</div>
          <div className="text-[9px] text-gray-400 mt-0.5 tracking-[0.5px]">Stock & Billing System</div>
        </div>
      </div>
    );
  }

  if (variant === 'invoice') {
    return (
      <img src={heroImg} alt="OM Cartridge" className={`w-11 h-11 object-contain ${className}`} />
    );
  }

  // 'full' variant — used on login page
  return (
    <div className={`om-logo-full flex flex-col items-center gap-2.5 select-none ${className}`}>
      <img src={heroImg} alt="OM Cartridge" className="w-[90px] h-[90px] object-contain drop-shadow-md" />
      <div className="text-center">
        <div className="font-black text-[22px] text-white tracking-[3px] leading-none">OM CARTRIDGE</div>
        <div className="text-[11px] text-white/75 tracking-[1.5px] mt-1.5 font-medium">
          STOCK &amp; BILLING MANAGEMENT
        </div>
      </div>
    </div>
  );
};

export default OMLogo;

