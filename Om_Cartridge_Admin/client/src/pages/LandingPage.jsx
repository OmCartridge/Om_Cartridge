import { Link } from 'react-router-dom';
import {
  Printer,
  Sparkles,
  Phone,
  MapPin,
  ArrowRight,
  Lock,
  CheckCircle2,
  Zap,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';
import heroImg from '../assets/hero.png';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-red-500 selection:text-white relative overflow-hidden font-sans">
      {/* Background Glows & Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#15527A]/30 to-transparent blur-3xl pointer-events-none -z-0" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#15527A]/20 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={heroImg}
            alt="OM Cartridge Logo"
            className="w-10 h-10 object-contain drop-shadow-md"
          />
          <div>
            <span className="font-extrabold text-base tracking-wider text-white">OM CARTRIDGE</span>
            <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 font-medium tracking-wide">
              | Toner &amp; Refilling Services
            </span>
          </div>
        </div>

        {/* Discreet Admin Login Access */}
        {/* <Link 
          to="/login" 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition shadow-sm"
          title="Admin Panel Login"
        >
          <Lock size={13} className="text-slate-400" />
          <span>Admin Login</span>
        </Link> */}
      </header>

      {/* Hero Section */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 py-12 md:py-16 flex flex-col items-center text-center my-auto">
        {/* Coming Soon Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-500/10 via-[#15527A]/20 to-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm font-semibold mb-6 shadow-sm animate-pulse">
          <Sparkles size={14} className="text-red-400" />
          <span>OUR NEW WEBSITE IS COMING SOON</span>
        </div>

        {/* Main Logo Showcase */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#15527A]/40 to-red-500/30 rounded-3xl blur-xl" />
          <div className="relative bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-2xl">
            <img
              src={heroImg}
              alt="OM Cartridge"
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-lg"
            />
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white max-w-3xl leading-tight">
          Reliable Printing &amp; <br />
          <span className="bg-gradient-to-r from-white via-slate-200 to-red-400 bg-clip-text text-transparent">
            Cartridge Solutions
          </span>
        </h1>

        <p className="mt-4 sm:mt-5 text-sm sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
          We are upgrading our digital experience to provide fast toner supply,
          precision laser cartridge and quick deliveries for businesses and home offices.
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 w-full max-w-3xl text-left">
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-lg bg-[#15527A]/30 border border-[#15527A]/40 flex items-center justify-center text-[#4da8e0] mb-3">
              <Printer size={20} />
            </div>
            <h3 className="font-semibold text-white text-sm sm:text-base">Laser Toner Cartridges</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              High-yield compatible black and colour cartridges for HP, Canon, Brother &amp; more.
            </p>
          </div>

          {/* <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-3">
              <Zap size={20} />
            </div>
            <h3 className="font-semibold text-white text-sm sm:text-base">Refilling &amp; Maintenance</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              High-density toner refills, drum replacement, and reliable printer maintenance.
            </p>
          </div> */}

          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <PackageCheck size={20} />
            </div>
            <h3 className="font-semibold text-white text-sm sm:text-base">Quick Corporate Delivery</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Fast door-step deliveries and bulk supplies across Ahmedabad and Sanand.
            </p>
          </div>
        </div>

        {/* Direct Inquiries & Contact Bar */}
        <div className="mt-10 w-full max-w-2xl bg-gradient-to-r from-slate-900/90 to-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left w-full sm:w-auto">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Direct Orders &amp; Inquiries</div>
            <div className="text-sm font-semibold text-white mt-0.5 flex items-center gap-2">
              <Phone size={15} className="text-red-400" />
              <span>+91 70967 06868 &nbsp;/&nbsp; +91 70967 06363</span>
            </div>
          </div>
          <a
            href="tel:+917096706868"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition shadow-lg shadow-red-600/20"
          >
            <span>Call Now</span>
            <ArrowRight size={14} />
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-900 py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <MapPin size={13} className="text-slate-500" />
            <span>Sanand, Ahmedabad, Gujarat</span>
          </div>

          <div>
            &copy; {new Date().getFullYear()} OM CARTRIDGE &bull; OM ENTERPRISE. All rights reserved.
          </div>

          <div>
            {/* <Link to="/login" className="text-slate-400 hover:text-white transition flex items-center gap-1">
              <ShieldCheck size={14} />
              <span>Admin Portal (/login)</span>
            </Link> */}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
