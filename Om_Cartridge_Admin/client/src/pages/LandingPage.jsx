import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Printer,
  Sparkles,
  Phone,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Zap,
  ShieldCheck,
  PackageCheck,
  Star,
  Award,
  Layers,
  ChevronRight,
  Menu,
  X,
  Mail,
  Send,
  Lock,
  Clock,
  Check,
  Cpu,
  RefreshCw,
  Building,
  Home,
  Briefcase,
  ExternalLink,
  Eye,
  ShoppingCart,
  Search,
  Filter,
  Truck,
  Shield,
  Headphones,
  RotateCcw,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  ThumbsUp,
  Tag
} from 'lucide-react';
import heroImg from '../assets/hero.png';

// E-commerce Demo Products Catalog
const DEMO_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Premium Black Cartridge',
    category: 'Laser Cartridge',
    categorySlug: 'laser',
    description: 'High-quality cartridge for consistent professional printing.',
    price: '₹1,499',
    rawPrice: 1499,
    originalPrice: '₹2,199',
    discount: '32% OFF',
    rating: 4.9,
    reviewsCount: 128,
    badge: 'Bestseller',
    badgeColor: 'bg-red-600 text-white',
    yield: '2,600 Pages (at 5% coverage)',
    compatibility: 'HP LaserJet Pro M402, M404, M428 & Canon LBP 214dw / 226dw',
    features: ['High-density micro-toner', 'Smudge-resistant matte finish', 'OEM-grade smart microchip'],
    accent: '#15527A',
    stock: 'In Stock (Ready to Ship)'
  },
  {
    id: 'prod-2',
    name: 'Office Pro Cartridge',
    category: 'Office Printing',
    categorySlug: 'office',
    description: 'Reliable printing solution for everyday office requirements.',
    price: '₹1,899',
    rawPrice: 1899,
    originalPrice: '₹2,699',
    discount: '30% OFF',
    rating: 4.8,
    reviewsCount: 94,
    badge: 'Corporate Choice',
    badgeColor: 'bg-[#15527A] text-white',
    yield: '3,800 Pages (Heavy Duty Cycle)',
    compatibility: 'HP LaserJet Enterprise M506, M527, Canon ImageClass LBP series',
    features: ['Engineered for high-volume duty', 'Zero ghosting drum technology', 'Extended roller lifespan'],
    accent: '#ED3838',
    stock: 'In Stock (Bulk Supply Available)'
  },
  {
    id: 'prod-3',
    name: 'High Yield Toner',
    category: 'High Yield',
    categorySlug: 'high-yield',
    description: 'Higher page yield with sharp and consistent output.',
    price: '₹2,299',
    rawPrice: 2299,
    originalPrice: '₹3,299',
    discount: '30% OFF',
    rating: 5.0,
    reviewsCount: 76,
    badge: 'Max Capacity',
    badgeColor: 'bg-emerald-600 text-white',
    yield: '6,500 Pages (Ultra-Extended Yield)',
    compatibility: 'Heavy-duty corporate printers HP Enterprise, Ricoh, Brother',
    features: ['Extra-capacity toner reservoir', 'Deep jet-black pigment formulation', '99.8% transfer efficiency'],
    accent: '#0284c7',
    stock: 'In Stock (Fast Gujarat Delivery)'
  },
  {
    id: 'prod-4',
    name: 'Eco Print Cartridge',
    category: 'Eco Series',
    categorySlug: 'eco',
    description: 'Efficient printing solution designed for responsible usage.',
    price: '₹1,299',
    rawPrice: 1299,
    originalPrice: '₹1,899',
    discount: '31% OFF',
    rating: 4.7,
    reviewsCount: 62,
    badge: 'Eco Series',
    badgeColor: 'bg-teal-600 text-white',
    yield: '2,200 Pages (Green Certified)',
    compatibility: 'Compact home & SME laser printers (HP 1020, 1005, Canon 2900)',
    features: ['Recycled polymers shell', 'Low-melt temperature energy saving', 'Non-toxic toner grade'],
    accent: '#059669',
    stock: 'In Stock (Eco-Friendly Pack)'
  }
];

// Interactive 3D Product Tilt Card with Scroll Reveal
const EcommerceProductCard = ({ product, onQuickView, onAddToCart }) => {
  const cardRef = useRef(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotX = -(y / (rect.height / 2)) * 8;
    const rotY = (x / (rect.width / 2)) * 10;
    setRotate({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col justify-between overflow-hidden text-left ${isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-8 scale-95'
        }`}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateY(-8px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        transition: isHovered
          ? 'transform 0.12s ease-out, box-shadow 0.25s ease'
          : 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Dynamic 3D Glint Effect on hover */}
      <div
        className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
        style={{
          transform: `translate(${rotate.y * 3}px, ${rotate.x * 3}px)`
        }}
      />

      {/* Top Image Showcase */}
      <div className="relative w-full h-52 bg-gradient-to-b from-slate-50 via-slate-100/60 to-white flex items-center justify-center p-6 border-b border-slate-100 overflow-hidden">

        {/* Badge Pill */}
        <div className="absolute top-3.5 left-3.5 z-20 flex flex-col gap-1.5 items-start">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm ${product.badgeColor}`}>
            {product.badge}
          </span>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded">
            {product.discount}
          </span>
        </div>

        {/* Quick View Button overlay */}
        <button
          onClick={() => onQuickView(product)}
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-white/90 backdrop-blur-sm text-slate-700 hover:text-white hover:bg-[#15527A] border border-slate-200 shadow-sm transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 cursor-pointer"
          title="Quick View"
        >
          <Eye size={15} />
        </button>

        {/* 3D Visual Representation of Cartridge */}
        <div
          className="relative w-48 h-28 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
          style={{
            transform: `translateZ(20px) rotateY(${rotate.y * 0.8}deg)`
          }}
        >
          {/* Soft Shadow Beneath Cartridge */}
          <div className="absolute -bottom-2 w-36 h-4 bg-slate-900/15 rounded-full blur-md group-hover:scale-110 transition-transform" />

          {/* Cartridge Outer Shell */}
          <div className="relative w-44 h-22 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-850 rounded-xl border border-slate-700 shadow-lg flex items-center justify-between p-2.5">
            {/* OPC Drum Cyan Roller */}
            <div className="w-10 h-16 rounded-md bg-gradient-to-b from-teal-500 via-emerald-400 to-teal-700 shadow-inner border border-emerald-300/40 relative overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-8 animate-shimmer" />
            </div>

            {/* Inner Details */}
            <div className="flex-1 px-2.5 text-left">
              <div className="flex items-center gap-1.5">
                <img src={heroImg} alt="OM" className="w-4 h-4 object-contain" />
                <span className="text-[10px] font-black text-white tracking-wide">OM LASER</span>
              </div>
              <div className="text-[9px] text-slate-300 font-mono mt-1">{product.yield.split(' ')[0]} Pgs</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-red-500 h-full rounded-full" style={{ width: '85%' }} />
              </div>
            </div>

            {/* Smart Microchip */}
            <div className="w-4 h-5 rounded bg-amber-400 border border-amber-300 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Cpu size={10} className="text-slate-950" />
            </div>
          </div>
        </div>

      </div>

      {/* Product Content Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Star Rating */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-medium text-[#15527A]">{product.category}</span>
            <div className="flex items-center gap-1 text-amber-500 font-semibold text-xs">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              <span>{product.rating}</span>
              <span className="text-slate-400 text-[11px]">({product.reviewsCount})</span>
            </div>
          </div>

          {/* Product Title */}
          <h3 className="font-bold text-base text-slate-900 group-hover:text-[#15527A] transition-colors leading-snug">
            {product.name}
          </h3>

          <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Key Feature Badges */}
          <div className="mt-3.5 space-y-1">
            {product.features.slice(0, 2).map((feat, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <Check size={12} className="text-emerald-600 flex-shrink-0" />
                <span className="truncate">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing & E-commerce Action Buttons */}
        <div className="mt-5 pt-3.5 border-t border-slate-100">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl font-extrabold text-slate-900">{product.price}</span>
            <span className="text-xs text-slate-400 line-through">{product.originalPrice}</span>
            <span className="text-[11px] font-semibold text-red-600">Save {product.discount}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onQuickView(product)}
              className="py-2 px-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition text-center cursor-pointer"
            >
              Details
            </button>

            <button
              onClick={() => onAddToCart(product)}
              className="py-2 px-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShoppingCart size={13} />
              <span>Inquire</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// 3D Interactive Hero Cartridge Demonstration Model
const Hero3DCartridgeModel = () => {
  const containerRef = useRef(null);
  const [rotate, setRotate] = useState({ x: 8, y: -16 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotX = -(y / (rect.height / 2)) * 16;
    const rotY = (x / (rect.width / 2)) * 22;
    setRotate({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 8, y: -16 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[460px] h-[390px] sm:h-[430px] flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
      style={{ perspective: '1100px' }}
    >
      {/* Light Mesh Ambient Aura */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
        <div className="w-80 h-80 rounded-full bg-gradient-to-tr from-[#15527A]/15 via-red-500/10 to-teal-400/15 blur-3xl animate-pulse" />
      </div>

      {/* Cybernetic Pedestal Shadow on White Surface */}
      <div
        className="absolute bottom-6 w-72 h-10 bg-slate-400/25 rounded-full blur-xl pointer-events-none transition-transform duration-300"
        style={{
          transform: `scale(${isHovered ? 1.1 : 1}) translateX(${rotate.y * 1.5}px)`
        }}
      />

      {/* Floating 3D Assembly */}
      <div
        className="relative transition-transform duration-200 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateY(${isHovered ? '-10px' : '0px'})`
        }}
      >
        {/* Main Cartridge Body */}
        <div className="relative w-72 sm:w-80 h-44 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-slate-700/80 shadow-2xl p-3.5">

          {/* Top Bevel Grips */}
          <div className="absolute -top-3 left-6 right-6 h-3.5 bg-gradient-to-r from-slate-750 via-slate-700 to-slate-750 rounded-t-lg border-t border-x border-slate-600 flex items-center justify-between px-3">
            <span className="w-6 h-1 bg-slate-500 rounded-full" />
            <span className="text-[7.5px] font-mono uppercase tracking-widest text-slate-300">OM LASER TONER</span>
            <span className="w-6 h-1 bg-slate-500 rounded-full" />
          </div>

          {/* Cartridge Handle with Brand Logo */}
          <div className="w-full h-11 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between px-3 shadow-md mb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-0.5 bg-white rounded-md shadow-sm">
                <img src={heroImg} alt="OM Cartridge" className="w-6 h-6 object-contain" />
              </div>
              <div>
                <span className="text-xs font-black tracking-wider text-white block leading-none">OM CARTRIDGE</span>
                <span className="text-[8px] text-slate-300 font-mono">100% COMPATIBLE</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-0.5 rounded-full border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[9px] font-mono text-emerald-300 font-bold">READY</span>
            </div>
          </div>

          {/* OPC Drum (Green/Cyan Cylindrical Laser Roller) */}
          <div className="w-full h-14 bg-slate-950 rounded-xl border border-slate-800 p-1 flex items-center shadow-inner overflow-hidden relative">
            <div className="relative w-full h-11 rounded-lg bg-gradient-to-r from-teal-700 via-emerald-400 to-teal-800 border border-emerald-300/50 flex items-center justify-between px-4 overflow-hidden shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-black/30 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent w-24 transform -skew-x-25 animate-shimmer" />
              <span className="relative text-[9px] font-bold text-slate-950 font-mono tracking-wider">
                ORGANIC PHOTOCONDUCTOR
              </span>
              <div className="relative flex items-center gap-1">
                <Zap size={13} className="text-slate-900 fill-slate-900" />
                <span className="text-[9px] font-black text-slate-950 font-mono">3000V CHARGED</span>
              </div>
            </div>
          </div>

          {/* Microchip & Capacity Monitor */}
          <div className="mt-2.5 flex items-center justify-between px-1.5 text-[10px]">
            <div className="flex items-center gap-1.5 bg-slate-850 px-2 py-1 rounded-md border border-amber-500/40">
              <div className="w-3.5 h-3.5 rounded bg-amber-400 flex items-center justify-center font-bold text-[8px] text-slate-900">
                <Cpu size={10} />
              </div>
              <span className="text-[9px] font-bold text-amber-300 font-mono">ENCRYPTED CHIP</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-700">
              <span className="text-slate-400 font-mono text-[9px]">CAPACITY:</span>
              <div className="w-16 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div className="w-full h-full bg-gradient-to-r from-red-500 to-[#15527A]" />
              </div>
              <span className="text-red-400 font-bold font-mono text-[9px]">FULL</span>
            </div>
          </div>

        </div>
      </div>

      {/* Floating 3D Feature Badges */}
      {/* 1. Premium Quality */}
      <div
        className="absolute top-4 -left-4 sm:-left-8 bg-white/95 backdrop-blur-md border border-slate-200/90 px-3.5 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 pointer-events-auto transition-transform duration-300 hover:scale-105"
        style={{
          transform: `translate3d(${rotate.y * -0.7}px, ${rotate.x * -0.5}px, 50px)`
        }}
      >
        <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
          <Star size={16} className="fill-red-600" />
        </div>
        <div className="text-left">
          <div className="text-xs font-bold text-slate-900 leading-tight">Premium Quality</div>
          <div className="text-[10px] text-slate-500 font-medium">100% Tested Cartridges</div>
        </div>
      </div>

      {/* 2. Long Lasting */}
      <div
        className="absolute top-1/2 -right-4 sm:-right-8 bg-white/95 backdrop-blur-md border border-slate-200/90 px-3.5 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 pointer-events-auto transition-transform duration-300 hover:scale-105"
        style={{
          transform: `translate3d(${rotate.y * 0.8}px, ${rotate.x * -0.6}px, 60px)`
        }}
      >
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#15527A]">
          <Zap size={16} className="fill-[#15527A]" />
        </div>
        <div className="text-left">
          <div className="text-xs font-bold text-slate-900 leading-tight">Long Lasting</div>
          <div className="text-[10px] text-slate-500 font-medium">High Yield Toner Fill</div>
        </div>
      </div>

      {/* 3. Reliable Printing */}
      <div
        className="absolute -bottom-2 left-6 sm:left-10 bg-white/95 backdrop-blur-md border border-slate-200/90 px-3.5 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 pointer-events-auto transition-transform duration-300 hover:scale-105"
        style={{
          transform: `translate3d(${rotate.y * -0.5}px, ${rotate.x * 0.7}px, 45px)`
        }}
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
          <CheckCircle2 size={16} />
        </div>
        <div className="text-left">
          <div className="text-xs font-bold text-slate-900 leading-tight">Reliable Printing</div>
          <div className="text-[10px] text-slate-500 font-medium">Zero Streaks or Smudges</div>
        </div>
      </div>

    </div>
  );
};

// Main Landing Page Component
const LandingPage = () => {
  // Sticky Header Scroll State
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // E-commerce Cart / Inquiry Drawer State
  const [cartItems, setCartItems] = useState([
    {
      ...DEMO_PRODUCTS[0],
      quantity: 2
    }
  ]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // Product Filter State
  const [activeCategory, setActiveCategory] = useState('all');

  // Quick View Modal
  const [selectedProduct, setSelectedProduct] = useState(null);

  // 3D Brand Interactive Pillar
  const [activePillar, setActivePillar] = useState('quality');

  // Contact Form State
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track scroll position for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAddToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setCartDrawerOpen(true);
  };

  const handleUpdateQuantity = (productId, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartAmount = cartItems.reduce((acc, item) => acc + item.rawPrice * item.quantity, 0);

  const filteredProducts =
    activeCategory === 'all'
      ? DEMO_PRODUCTS
      : DEMO_PRODUCTS.filter((p) => p.categorySlug === activeCategory);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!formState.name || !formState.email) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setFormSubmitted(true);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-red-600 selection:text-white relative">

      {/* ========================================================
          1. HEADER (Deep Navy #15527A with Red Accents as per Logo)
      ======================================================== */}
      <header className="sticky top-0 z-50 w-full shadow-lg">

        {/* Top Announcement Bar */}
        <div className="bg-[#0B304A] border-b border-[#1A6596]/30 text-white text-[11px] sm:text-xs py-1.5 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">
                OFFICIAL  SUPPLY
              </span>
              <span className="hidden sm:inline text-slate-200">
                Bulk Toner Cartridge Orders &amp; Doorstep Delivery across Ahmedabad &amp; Sanand
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-200">
              <a href="tel:+917096706868" className="flex items-center gap-1.5 hover:text-white font-medium">
                <Phone size={12} className="text-red-400" />
                <span>+91 70967 06868</span>
              </a>
              <span className="hidden md:inline text-slate-400">&bull;</span>
              <span className="hidden md:inline text-slate-300">Sanand, Ahmedabad</span>
            </div>
          </div>
        </div>

        {/* Main Navbar (Brand Navy #15527A) */}
        <div className="bg-[#15527A] text-white py-3 px-4 sm:px-8 transition-all duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

            {/* Logo and Brand Name */}
            <button
              onClick={() => scrollToSection('home')}
              className="flex items-center gap-3 cursor-pointer group text-left focus:outline-none"
            >
              <div className="bg-white p-1 rounded-xl shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                <img
                  src={heroImg}
                  alt="OM Cartridge Logo"
                  className="w-9 h-9 sm:w-10 sm:h-10 object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg sm:text-xl tracking-wider text-white">OM CARTRIDGE</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                </div>
                <span className="text-[10px] text-cyan-200 font-medium tracking-wide block uppercase">
                  Toner &amp; Printing Solutions
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-100">
              <button onClick={() => scrollToSection('home')} className="hover:text-cyan-300 transition cursor-pointer">
                Home
              </button>
              <button onClick={() => scrollToSection('products')} className="hover:text-cyan-300 transition cursor-pointer">
                Products
              </button>
              <button onClick={() => scrollToSection('solutions')} className="hover:text-cyan-300 transition cursor-pointer">
                Solutions
              </button>
              <button onClick={() => scrollToSection('about')} className="hover:text-cyan-300 transition cursor-pointer">
                About
              </button>
              <button onClick={() => scrollToSection('contact')} className="hover:text-cyan-300 transition cursor-pointer">
                Contact
              </button>
            </nav>

            {/* Right Actions: Inquiry Cart & CTA */}
            <div className="flex items-center gap-3">

              {/* Inquiry Cart Drawer Trigger Button */}
              <button
                onClick={() => setCartDrawerOpen(true)}
                className="relative p-2.5 rounded-xl bg-[#0D3854] hover:bg-[#0A2D44] border border-[#1A6596]/40 text-white transition flex items-center gap-2 cursor-pointer shadow-sm"
                title="Inquiry Cart"
              >
                <ShoppingCart size={18} />
                <span className="hidden sm:inline text-xs font-semibold">Quote Cart</span>
                {totalCartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white font-black text-[10px] rounded-full flex items-center justify-center shadow-md animate-scale">
                    {totalCartCount}
                  </span>
                )}
              </button>

              {/* Explore Products Button */}
              <button
                onClick={() => scrollToSection('products')}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all duration-200 transform hover:scale-[1.02] cursor-pointer"
              >
                <span>Explore Products</span>
                <ChevronRight size={15} />
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-[#0D3854] text-white hover:bg-[#0A2D44]"
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

            </div>

          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0D3854] text-white border-t border-[#1A6596]/30 px-6 py-5 space-y-4 animate-fadeIn">
            <div className="flex flex-col space-y-3 font-semibold text-sm">
              <button onClick={() => scrollToSection('home')} className="text-left py-1 hover:text-cyan-300">
                Home
              </button>
              <button onClick={() => scrollToSection('products')} className="text-left py-1 hover:text-cyan-300">
                Products
              </button>
              <button onClick={() => scrollToSection('solutions')} className="text-left py-1 hover:text-cyan-300">
                Solutions
              </button>
              <button onClick={() => scrollToSection('about')} className="text-left py-1 hover:text-cyan-300">
                About
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-left py-1 hover:text-cyan-300">
                Contact
              </button>
            </div>
            <button
              onClick={() => scrollToSection('products')}
              className="w-full py-2.5 rounded-xl bg-red-600 text-white font-bold text-center text-sm shadow-md"
            >
              Explore Products
            </button>
          </div>
        )}
      </header>

      {/* ========================================================
          MAIN CONTENT (CRITICAL: 100% WHITE BACKGROUND ONLY)
      ======================================================== */}
      <main className="flex-1 bg-white text-slate-800">

        {/* ========================================================
            2. HERO SECTION (White Background with 3D Visual & Trust Bar)
        ======================================================== */}
        <section
          id="home"
          className="relative min-h-[calc(100vh-140px)] flex flex-col justify-center px-4 sm:px-8 py-12 md:py-20 bg-gradient-to-b from-slate-50 via-white to-white overflow-hidden border-b border-slate-100"
        >
          {/* Subtle Light Mesh Background Gradient */}
          <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-blue-100/50 via-red-50/40 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />
          <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-gradient-to-tr from-cyan-50/50 via-slate-100/40 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />

          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

            {/* Left Column: Heading and CTAs */}
            <div className="lg:col-span-7 text-center lg:text-left">

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200/80 text-red-600 text-xs font-bold mb-6 shadow-sm">
                <Sparkles size={14} className="text-red-500" />
                <span>PREMIUM E-COMMERCE PRINTING SOLUTIONS</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
                Power Your Business With{' '}
                <span className="text-[#15527A] underline decoration-red-500 decoration-wavy decoration-2">
                  Reliable Printing
                </span>
              </h1>

              {/* Supporting Text */}
              <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed">
                Quality cartridges and printing solutions designed for homes, offices and businesses.
              </p>

              {/* Hero Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={() => scrollToSection('products')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-red-600/25 transition-all duration-200 transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingCart size={16} />
                  <span>Explore Products</span>
                </button>

                <button
                  onClick={() => scrollToSection('contact')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-[#15527A] font-bold text-sm border-2 border-[#15527A] transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow"
                >
                  <Phone size={15} className="text-red-500" />
                  <span>Contact Us</span>
                </button>
              </div>

              {/* Quick E-Commerce Trust Badges */}
              <div className="mt-10 pt-8 border-t border-slate-200/80 grid grid-cols-3 gap-4 text-center lg:text-left">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-[#15527A]">100%</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">OEM Compatible</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-red-600">Zero</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Leak Guarantee</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600">Same Day</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Gujarat Dispatch</div>
                </div>
              </div>

            </div>

            {/* Right Column: 3D Hero Cartridge Visual */}
            <div className="lg:col-span-5 flex justify-center items-center">
              <Hero3DCartridgeModel />
            </div>

          </div>

          {/* E-Commerce Benefits Banner */}
          <div className="max-w-7xl mx-auto w-full mt-12 pt-8 border-t border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-slate-700">

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#15527A] flex-shrink-0">
                  <Truck size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Fast Doorstep Delivery</div>
                  <div className="text-[11px] text-slate-500">Across Ahmedabad &amp; Sanand</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 flex-shrink-0">
                  <Shield size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">100% Replacement Warranty</div>
                  <div className="text-[11px] text-slate-500">Zero defect assurance</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <Tag size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Direct Factory Pricing</div>
                  <div className="text-[11px] text-slate-500">Save up to 60% vs OEM</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 flex-shrink-0">
                  <Headphones size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">24/7 Priority Support</div>
                  <div className="text-[11px] text-slate-500">Direct phone &amp; WhatsApp</div>
                </div>
              </div>

            </div>
          </div>

        </section>

        {/* ========================================================
            3. PRODUCT SHOWCASE (White Background with 3D Tilt Cards)
        ======================================================== */}
        <section id="products" className="py-20 px-4 sm:px-8 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto">

            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#15527A] text-xs font-bold uppercase tracking-wider mb-3">
                <Printer size={13} />
                <span>Featured Catalog</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                Designed For Better Printing
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-600">
                Browse our precision-formulated laser toner cartridges with fade-in and 3D hover interaction.
              </p>

              {/* Category Filter Pills */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
                {[
                  { label: 'All Products', slug: 'all' },
                  { label: 'Laser Cartridge', slug: 'laser' },
                  { label: 'Office Printing', slug: 'office' },
                  { label: 'High Yield', slug: 'high-yield' },
                  { label: 'Eco Series', slug: 'eco' }
                ].map((tab) => (
                  <button
                    key={tab.slug}
                    onClick={() => setActiveCategory(tab.slug)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeCategory === tab.slug
                        ? 'bg-[#15527A] text-white shadow-md'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3D Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <EcommerceProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => setSelectedProduct(p)}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {/* Bulk Supply Banner */}
            <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-50 via-slate-50 to-red-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <span className="text-xs font-bold uppercase text-red-600 font-mono tracking-wider">
                  Corporate &amp; Reseller Inquiries
                </span>
                <h4 className="text-xl font-bold text-slate-900 mt-1">
                  Need 10+ Cartridges for your Office or Dealership?
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Get customized institutional pricing, GST tax invoices, and scheduled quarterly refills.
                </p>
              </div>
              <button
                onClick={() => scrollToSection('contact')}
                className="px-6 py-3 rounded-xl bg-[#15527A] hover:bg-[#0e3d5c] text-white text-xs sm:text-sm font-bold shadow-md transition flex items-center gap-2 cursor-pointer flex-shrink-0"
              >
                <span>Request Corporate Quote</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </div>
        </section>

        {/* ========================================================
            4. WHY OM CARTRIDGE SECTION (White Background)
        ======================================================== */}
        <section className="py-20 px-4 sm:px-8 bg-slate-50/60 border-b border-slate-100">
          <div className="max-w-7xl mx-auto">

            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider mb-3">
                <Award size={13} />
                <span>The Om Cartridge Promise</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                Why Choose Om Cartridge?
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-600">
                Engineered with strict quality control to guarantee maximum print density and lower printing expenditure.
              </p>
            </div>

            {/* 4 Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Card 1: Premium Quality */}
              <div className="p-7 rounded-2xl bg-white border border-slate-200 hover:border-red-400 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group text-left">
                <div className="w-13 h-13 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-5 group-hover:scale-110 transition-transform">
                  <Star size={26} className="fill-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Premium Quality</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Reliable cartridges designed for consistent printing.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                  Zero streak, razor-sharp documents
                </div>
              </div>

              {/* Card 2: High Performance */}
              <div className="p-7 rounded-2xl bg-white border border-slate-200 hover:border-[#15527A] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group text-left">
                <div className="w-13 h-13 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#15527A] mb-5 group-hover:scale-110 transition-transform">
                  <Zap size={26} className="fill-[#15527A]" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">High Performance</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Sharp output and dependable performance.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                  Tested up to 50+ pages per minute
                </div>
              </div>

              {/* Card 3: Cost Efficient */}
              <div className="p-7 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group text-left">
                <div className="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-5 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={26} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Cost Efficient</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Solutions designed to reduce printing costs.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                  Lower cost-per-page by up to 50%
                </div>
              </div>

              {/* Card 4: Trusted Support */}
              <div className="p-7 rounded-2xl bg-white border border-slate-200 hover:border-amber-500 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group text-left">
                <div className="w-13 h-13 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-5 group-hover:scale-110 transition-transform">
                  <PackageCheck size={26} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Trusted Support</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Customer-focused service and support.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                  Instant phone &amp; onsite guidance
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ========================================================
            5. PRINTING SOLUTIONS SECTION (White Background)
        ======================================================== */}
        <section id="solutions" className="py-20 px-4 sm:px-8 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto">

            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider mb-3">
                <Layers size={13} />
                <span>Sector Applications</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                Printing Solutions For Every Environment
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-600">
                Tailored toner cartridges and refilling workflows for household printers, corporate departments, and high-duty server rooms.
              </p>
            </div>

            {/* 3 Solutions Cards: Home, Office, Enterprise */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {/* Home */}
              <div className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left">
                <div>
                  <div className="w-13 h-13 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#15527A] mb-6">
                    <Home size={26} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Home</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Simple and reliable printing solutions.
                  </p>
                  <ul className="mt-6 space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-6">
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-[#15527A]" />
                      <span>Ready for assignments, tickets &amp; letters</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-[#15527A]" />
                      <span>No drying up even during long idle breaks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-[#15527A]" />
                      <span>Affordable single cartridge replacements</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-8">
                  <button
                    onClick={() => scrollToSection('contact')}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                  >
                    Inquire For Home
                  </button>
                </div>
              </div>

              {/* Office (Highlighted) */}
              <div className="p-8 rounded-2xl bg-white border-2 border-red-500 shadow-xl shadow-red-500/5 flex flex-col justify-between text-left relative transform md:-translate-y-2">
                <div className="absolute -top-3.5 right-6 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                  Most Popular
                </div>
                <div>
                  <div className="w-13 h-13 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-6">
                    <Briefcase size={26} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Office</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Efficient solutions for daily business printing.
                  </p>
                  <ul className="mt-6 space-y-3 text-xs text-slate-700 border-t border-slate-100 pt-6">
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-red-600" />
                      <span>Speedy billing, GST invoices &amp; legal contracts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-red-600" />
                      <span>Prompt doorstep replacement across Ahmedabad</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-red-600" />
                      <span>Substantial bulk savings on multi-pack toners</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-8">
                  <button
                    onClick={() => scrollToSection('contact')}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    Inquire For Office
                  </button>
                </div>
              </div>

              {/* Enterprise */}
              <div className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left">
                <div>
                  <div className="w-13 h-13 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-[#15527A] mb-6">
                    <Building size={26} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Scalable printing solutions for larger requirements.
                  </p>
                  <ul className="mt-6 space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-6">
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-[#15527A]" />
                      <span>Multi-printer fleet toner stock management</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-[#15527A]" />
                      <span>Guaranteed SLA for zero printer downtime</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-[#15527A]" />
                      <span>Monthly consolidated corporate billing accounts</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-8">
                  <button
                    onClick={() => scrollToSection('contact')}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                  >
                    Inquire For Enterprise
                  </button>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ========================================================
            6. 3D BRAND SECTION ("Built For Better Printing") (White Background)
        ======================================================== */}
        <section className="py-24 px-4 sm:px-8 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-100 relative overflow-hidden">
          <div className="max-w-7xl mx-auto">

            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#15527A] text-xs font-bold uppercase tracking-wider mb-3">
                <Cpu size={13} />
                <span>3D Engineering Showcase</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                Built For Better Printing
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-600">
                Experience the 4 pillars that power Om Cartridge performance with interactive 3D perspective and hover reactions.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

              {/* Left Pillars */}
              <div className="lg:col-span-3 space-y-5">

                {/* Pillar 1: Quality */}
                <div
                  onClick={() => setActivePillar('quality')}
                  className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer text-left ${activePillar === 'quality'
                      ? 'bg-white border-red-500 shadow-xl shadow-red-500/10 -translate-y-1'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono text-red-600">PILLAR 01</span>
                    <Star size={16} className="text-red-500 fill-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Quality</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Zero-defect drum coatings ensuring crisp, razor-sharp text and uniform deep blacks.
                  </p>
                </div>

                {/* Pillar 2: Reliability */}
                <div
                  onClick={() => setActivePillar('reliability')}
                  className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer text-left ${activePillar === 'reliability'
                      ? 'bg-white border-[#15527A] shadow-xl shadow-blue-500/10 -translate-y-1'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono text-[#15527A]">PILLAR 02</span>
                    <ShieldCheck size={16} className="text-[#15527A]" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Reliability</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Hermetically sealed chambers preventing toner spills, page jams, or premature fading.
                  </p>
                </div>

              </div>

              {/* Center 3D Visualizer */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center">
                <Hero3DCartridgeModel />
                <div className="mt-2 text-xs text-slate-500 flex items-center gap-2 font-mono">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>Interactive 3D Perspective &bull; Hover or move cursor</span>
                </div>
              </div>

              {/* Right Pillars */}
              <div className="lg:col-span-3 space-y-5">

                {/* Pillar 3: Performance */}
                <div
                  onClick={() => setActivePillar('performance')}
                  className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer text-left ${activePillar === 'performance'
                      ? 'bg-white border-emerald-500 shadow-xl shadow-emerald-500/10 -translate-y-1'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono text-emerald-600">PILLAR 03</span>
                    <Zap size={16} className="text-emerald-500 fill-emerald-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Performance</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    High-speed toner transfer mechanics sustaining 45+ pages per minute printer cycles.
                  </p>
                </div>

                {/* Pillar 4: Innovation */}
                <div
                  onClick={() => setActivePillar('innovation')}
                  className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer text-left ${activePillar === 'innovation'
                      ? 'bg-white border-amber-500 shadow-xl shadow-amber-500/10 -translate-y-1'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono text-amber-600">PILLAR 04</span>
                    <Sparkles size={16} className="text-amber-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Innovation</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Auto-reset smart IC chips seamlessly communicating toner telemetry to workstations.
                  </p>
                </div>

              </div>

            </div>

          </div>
        </section>

        {/* ========================================================
            7. ABOUT SECTION (White Background + Demo Statistics)
        ======================================================== */}
        <section id="about" className="py-20 px-4 sm:px-8 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

              {/* Left Column: Brand Story */}
              <div className="lg:col-span-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider mb-4">
                  <span>About Our Enterprise</span>
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                  About Om Cartridge
                </h2>

                <p className="mt-6 text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
                  Om Cartridge focuses on providing reliable, efficient and quality-focused printing solutions for modern businesses, offices and everyday users.
                </p>

                <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                  Established in Gujarat with state-of-the-art testing equipment, Om Cartridge (OM Enterprise) manufactures and delivers compatible laser toner cartridges, drum units, and eco-certified refilling services. We help clients cut up to 60% off printing budgets without compromising quality.
                </p>

                {/* Badges list */}
                <div className="mt-8 space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 flex-shrink-0 mt-0.5">
                      <Check size={14} />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900">100% Post-Manufacturing Print Test</span>
                      <p className="text-xs text-slate-500">Every batch is benchmarked on genuine HP, Canon and Brother engines.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#15527A] flex-shrink-0 mt-0.5">
                      <Check size={14} />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900">Doorstep Refill &amp; Core Return Exchange</span>
                      <p className="text-xs text-slate-500">Fast pickup and replacement programs for corporate accounts across Gujarat.</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Demo Statistics Grid */}
              <div className="lg:col-span-6">
                <div className="grid grid-cols-2 gap-5">

                  {/* Stat 1: 10+ */}
                  <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 text-center hover:shadow-lg transition">
                    <div className="text-4xl sm:text-5xl font-black text-[#15527A]">
                      10+
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-2">Product Categories</div>
                    <div className="text-xs text-slate-500 mt-1">Laser, toner &amp; refills</div>
                  </div>

                  {/* Stat 2: 1000+ */}
                  <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 text-center hover:shadow-lg transition">
                    <div className="text-4xl sm:text-5xl font-black text-red-600">
                      1000+
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-2">Customers Served</div>
                    <div className="text-xs text-slate-500 mt-1">SMEs, offices &amp; retail</div>
                  </div>

                  {/* Stat 3: 99% */}
                  <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 text-center hover:shadow-lg transition">
                    <div className="text-4xl sm:text-5xl font-black text-emerald-600">
                      99%
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-2">Quality Focus</div>
                    <div className="text-xs text-slate-500 mt-1">Satisfaction benchmark</div>
                  </div>

                  {/* Stat 4: 24/7 */}
                  <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 text-center hover:shadow-lg transition">
                    <div className="text-4xl sm:text-5xl font-black text-amber-600">
                      24/7
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-2">Support</div>
                    <div className="text-xs text-slate-500 mt-1">Dedicated customer care</div>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ========================================================
            8. CONTACT SECTION (White Background)
        ======================================================== */}
        <section id="contact" className="py-20 px-4 sm:px-8 bg-slate-50/70">
          <div className="max-w-7xl mx-auto">

            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider mb-3">
                <Phone size={13} />
                <span>Quick Inquiries &amp; Orders</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                Let's Build Better Printing Solutions
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-600">
                Contact our cartridge experts for pricing, sample orders, or immediate toner supply.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

              {/* Contact Information Card */}
              <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-8 shadow-sm flex flex-col justify-between text-left">
                <div>
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                      <img src={heroImg} alt="OM Logo" className="w-10 h-10 object-contain" />
                    </div>
                    <div>
                      <div className="font-black text-xl text-slate-900">Om Cartridge</div>
                      <div className="text-xs text-slate-500 font-medium">OM Enterprise Solutions</div>
                    </div>
                  </div>

                  <div className="space-y-6 text-sm">
                    {/* Location */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 flex-shrink-0 mt-0.5">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase text-slate-400 font-mono">Location</div>
                        <div className="font-bold text-slate-900 mt-0.5">Ahmedabad, Gujarat, India</div>
                        <div className="text-xs text-slate-500 mt-0.5">Sanand &bull; Ahmedabad &bull; Gujarat</div>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#15527A] flex-shrink-0 mt-0.5">
                        <Phone size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase text-slate-400 font-mono">Phone</div>
                        <div className="font-bold text-slate-900 mt-0.5">+91 70967 06868</div>
                        <div className="text-xs text-slate-500 mt-0.5">+91 70967 06363</div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">
                        <Mail size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase text-slate-400 font-mono">Email</div>
                        <div className="font-bold text-slate-900 mt-0.5">info@omcartridge.com</div>
                        <div className="text-xs text-slate-500 mt-0.5">orders@omcartridge.com</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <a
                    href="tel:+917096706868"
                    className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition shadow-md"
                  >
                    <Phone size={15} />
                    <span>Call Directly: +91 70967 06868</span>
                  </a>
                </div>
              </div>

              {/* Frontend-Only Contact Form */}
              <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-8 shadow-sm text-left">
                {formSubmitted ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 animate-fadeIn">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 mb-4 animate-bounce-subtle">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Thank You!</h3>
                    <p className="text-sm text-slate-600 max-w-md">
                      Your inquiry has been received. Our cartridge specialist will get in touch with you shortly.
                    </p>
                    <button
                      onClick={() => {
                        setFormSubmitted(false);
                        setFormState({ name: '', email: '', phone: '', message: '' });
                      }}
                      className="mt-6 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                    >
                      Send Another Inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase font-mono">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formState.name}
                          onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                          placeholder="e.g. Ramesh Patel"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#15527A] focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase font-mono">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={formState.email}
                          onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                          placeholder="ramesh@company.com"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#15527A] focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase font-mono">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formState.phone}
                        onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#15527A] focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase font-mono">
                        Message / Cartridge Requirements
                      </label>
                      <textarea
                        rows={4}
                        value={formState.message}
                        onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                        placeholder="Specify printer models (e.g. HP LaserJet 1020, Canon LBP 2900) or required volume..."
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#15527A] focus:bg-white transition resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-xl bg-[#15527A] hover:bg-[#0e3d5c] disabled:bg-slate-300 text-white font-bold text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>Sending Inquiry...</span>
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-slate-500 text-center">
                      Frontend demo inquiry &bull; Instant confirmation without altering backend.
                    </p>
                  </form>
                )}
              </div>

            </div>

          </div>
        </section>

      </main>

      {/* ========================================================
          9. FOOTER (Deep Brand Navy #15527A / #0D3854 as per Logo)
      ======================================================== */}
      <footer className="w-full bg-[#0D3854] text-white border-t border-[#1A6596]/40 py-12 px-4 sm:px-8 text-xs text-left">
        <div className="max-w-7xl mx-auto">

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#1A6596]/30">

            {/* Logo and Brand Info */}
            <div className="md:col-span-5">
              <div className="flex items-center gap-3">
                <div className="bg-white p-1 rounded-xl shadow-md">
                  <img
                    src={heroImg}
                    alt="OM Cartridge Logo"
                    className="w-9 h-9 object-contain"
                  />
                </div>
                <div>
                  <span className="font-black text-lg tracking-wider text-white">OM CARTRIDGE</span>
                  <span className="text-[10px] text-cyan-200 block font-mono">Ahmedabad &bull; Gujarat</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-300 max-w-sm leading-relaxed">
                Premium laser toner cartridges, precision drum assemblies, and reliable printing supplies for modern homes, offices and corporate facilities.
              </p>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-4 flex flex-col space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono mb-2">
                Quick Navigation
              </span>
              <button onClick={() => scrollToSection('home')} className="text-left text-slate-300 hover:text-white transition">
                Home
              </button>
              <button onClick={() => scrollToSection('products')} className="text-left text-slate-300 hover:text-white transition">
                Products
              </button>
              <button onClick={() => scrollToSection('solutions')} className="text-left text-slate-300 hover:text-white transition">
                Solutions
              </button>
              <button onClick={() => scrollToSection('about')} className="text-left text-slate-300 hover:text-white transition">
                About
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-left text-slate-300 hover:text-white transition">
                Contact
              </button>
            </div>

            {/* Staff Portal / Admin Access */}
            <div className="md:col-span-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono mb-2 block">
                  Staff Management
                </span>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:text-white bg-[#0A2D44] hover:bg-[#072336] border border-[#1A6596]/40 transition shadow-sm"
                  title="OM Cartridge Internal Stock & Billing System"
                >
                  <Lock size={13} className="text-red-400" />
                  <span>Admin Panel Login</span>
                </Link>
              </div>

              <div className="mt-6 md:mt-0 text-[11px] text-slate-400 font-mono">
                Sanand, Ahmedabad, Gujarat &bull; India
              </div>
            </div>

          </div>

          {/* Bottom Copyright */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-[11px] text-slate-300">
            <div>
              &copy; 2026 Om Cartridge. All Rights Reserved.
            </div>
            <div className="text-slate-400">
              Reliable Printing Solutions for Gujarat Businesses
            </div>
          </div>

        </div>
      </footer>

      {/* ========================================================
          10. INTERACTIVE INQUIRY CART / QUOTE DRAWER (E-Commerce Feature)
      ======================================================== */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between text-left animate-slideLeft">

            {/* Drawer Header (Navy) */}
            <div className="p-4 sm:p-5 bg-[#15527A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={20} />
                <h3 className="font-bold text-base">Inquiry Quote Cart ({totalCartCount})</h3>
              </div>
              <button
                onClick={() => setCartDrawerOpen(false)}
                className="p-1 rounded-lg bg-[#0D3854] text-slate-200 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <ShoppingCart size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="font-medium text-sm">Your inquiry cart is empty</p>
                  <button
                    onClick={() => {
                      setCartDrawerOpen(false);
                      scrollToSection('products');
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
                  >
                    Browse Cartridges
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 bg-slate-50/50">
                    <div className="flex-1">
                      <div className="text-[10px] font-mono text-[#15527A] uppercase">{item.category}</div>
                      <div className="text-sm font-bold text-slate-900">{item.name}</div>
                      <div className="text-xs text-red-600 font-extrabold mt-0.5">{item.price}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-bold text-xs text-slate-900 w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleUpdateQuantity(item.id, -item.quantity)}
                      className="text-slate-400 hover:text-red-500 p-1"
                      title="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer with Checkout / Submit */}
            {cartItems.length > 0 && (
              <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Estimated Subtotal:</span>
                  <span className="text-lg font-black text-slate-900">
                    ₹{totalCartAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  GST Invoice &amp; free shipping applicable upon final confirmation.
                </div>
                <button
                  onClick={() => {
                    setCartDrawerOpen(false);
                    scrollToSection('contact');
                    const itemsSummary = cartItems
                      .map((it) => `${it.name} (Qty: ${it.quantity})`)
                      .join(', ');
                    setFormState((prev) => ({
                      ...prev,
                      message: `Order Inquiry for: ${itemsSummary}. Estimated total: ₹${totalCartAmount.toLocaleString('en-IN')}. Please contact with delivery timeline.`
                    }));
                  }}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Submit Inquiry For These Items</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================
          11. QUICK VIEW PRODUCT DETAILS MODAL (E-Commerce Feature)
      ======================================================== */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 sm:p-8 text-left overflow-hidden">

            {/* Close */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Badges */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#15527A] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">
                {selectedProduct.category}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${selectedProduct.badgeColor}`}>
                {selectedProduct.badge}
              </span>
            </div>

            <h3 className="text-2xl font-black text-slate-900">{selectedProduct.name}</h3>

            {/* Pricing */}
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold text-slate-900">{selectedProduct.price}</span>
              <span className="text-sm text-slate-400 line-through">{selectedProduct.originalPrice}</span>
              <span className="text-xs font-bold text-red-600">{selectedProduct.discount}</span>
            </div>

            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              {selectedProduct.description}
            </p>

            {/* Specifications Card */}
            <div className="mt-5 bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2.5 text-xs">
              <div className="font-bold text-slate-800 uppercase font-mono tracking-wider">
                Technical Specifications
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-500 font-mono block">Page Yield:</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{selectedProduct.yield}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-mono block">Stock Availability:</span>
                  <span className="font-bold text-emerald-600 mt-0.5 block">{selectedProduct.stock}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-mono block">Printer Engine Compatibility:</span>
                <span className="text-slate-800 font-medium mt-0.5 block">{selectedProduct.compatibility}</span>
              </div>
            </div>

            {/* Feature Bullets */}
            <div className="mt-4 space-y-1.5">
              {selectedProduct.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle size={14} className="text-red-500 flex-shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingCart size={14} />
                  <span>Add to Quote</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
