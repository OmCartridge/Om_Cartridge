import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Printer,
  Phone,
  Search,
  ShoppingCart,
  ChevronRight,
  Menu,
  X,
  Lock,
  ArrowRight,
  Filter,
  PackageCheck,
  Star,
  Eye,
  CheckCircle,
  Truck,
  Shield,
  Tag,
  Headphones,
  Minus,
  Plus,
  Trash2
} from 'lucide-react';
import heroImg from '../assets/hero.png';
import api from '../services/api';

const PublicProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeUnit, setActiveUnit] = useState('ALL');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Cart / Quote Drawer
  const [cartItems, setCartItems] = useState([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/public', {
        params: { search: search || undefined },
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching public products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const handleAddToCart = (p) => {
    setCartItems((prev) => {
      const existing = prev.find((it) => it._id === p._id);
      if (existing) {
        return prev.map((it) =>
          it._id === p._id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [...prev, { ...p, quantity: 1 }];
    });
    setCartDrawerOpen(true);
  };

  const handleUpdateQuantity = (productId, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item._id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const totalCartCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);
  const totalCartAmount = cartItems.reduce(
    (acc, it) => acc + (Number(it.sellingRate) || 0) * it.quantity,
    0
  );

  // Filter by unit if selected
  const availableUnits = ['ALL', ...new Set(products.map((p) => p.unit).filter(Boolean))];
  const filteredProducts =
    activeUnit === 'ALL'
      ? products
      : products.filter((p) => p.unit === activeUnit);

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* ── Top Announcement Bar ────────────────────────────────────────────── */}
      <div className="bg-[#0B304A] border-b border-[#1A6596]/30 text-white text-[11px] sm:text-xs py-1.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">
              OFFICIAL SUPPLY
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

      {/* ── Main Navbar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#15527A] text-white py-3 px-4 sm:px-8 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 cursor-pointer group text-left">
            <div className="bg-white p-1 rounded-xl shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
              <img src={heroImg} alt="OM Cartridge Logo" className="w-9 h-9 sm:w-10 sm:h-10 object-contain" />
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
          </Link>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-100">
            <Link to="/" className="hover:text-cyan-300 transition">Home</Link>
            <Link to="/products" className="hover:text-cyan-300 transition text-cyan-200 font-bold">Products</Link>
            <Link to="/#solutions" className="hover:text-cyan-300 transition">Solutions</Link>
            <Link to="/#about" className="hover:text-cyan-300 transition">About</Link>
            <Link to="/#contact" className="hover:text-cyan-300 transition">Contact</Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="relative p-2.5 rounded-xl bg-[#0D3854] hover:bg-[#0A2D44] border border-[#1A6596]/40 text-white transition flex items-center gap-2 cursor-pointer shadow-sm"
              title="Quote Cart"
            >
              <ShoppingCart size={18} />
              <span className="hidden sm:inline text-xs font-semibold">Quote Cart</span>
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white font-black text-[10px] rounded-full flex items-center justify-center shadow-md">
                  {totalCartCount}
                </span>
              )}
            </button>

            <Link
              to="/#contact"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all duration-200"
            >
              <span>Get Quote</span>
              <ChevronRight size={15} />
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#0D3854] text-white hover:bg-[#0A2D44]"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0D3854] text-white border-t border-[#1A6596]/30 px-6 py-5 space-y-4 mt-3 rounded-b-xl">
            <div className="flex flex-col space-y-3 font-semibold text-sm">
              <Link to="/" className="text-left py-1 hover:text-cyan-300" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link to="/products" className="text-left py-1 hover:text-cyan-300 text-cyan-200" onClick={() => setMobileMenuOpen(false)}>Products</Link>
              <Link to="/#solutions" className="text-left py-1 hover:text-cyan-300" onClick={() => setMobileMenuOpen(false)}>Solutions</Link>
              <Link to="/#about" className="text-left py-1 hover:text-cyan-300" onClick={() => setMobileMenuOpen(false)}>About</Link>
              <Link to="/#contact" className="text-left py-1 hover:text-cyan-300" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Main Catalog Content ────────────────────────────────────────────── */}
      <main className="flex-1 bg-white text-slate-800 py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#15527A] text-xs font-bold uppercase tracking-wider mb-3">
              <Printer size={13} />
              <span>Official Product Inventory</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Laser Toner &amp; Cartridge Catalog
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Browse our factory-tested compatible laser cartridges and refilling supplies, synced live with our inventory.
            </p>

            {/* Search Bar */}
            <div className="mt-6 max-w-md mx-auto relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by product name, SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#15527A] text-sm shadow-sm transition"
              />
            </div>

            {/* Unit / Category Pills */}
            {availableUnits.length > 2 && (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {availableUnits.map((u) => (
                  <button
                    key={u}
                    onClick={() => setActiveUnit(u)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeUnit === u
                        ? 'bg-[#15527A] text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {u === 'ALL' ? 'All Packaging' : `${u} Units`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-4 border-[#15527A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">Fetching products from inventory...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center max-w-md mx-auto p-8 rounded-2xl bg-slate-50 border border-slate-200">
              <Printer size={36} className="mx-auto text-slate-400 mb-3" />
              <h3 className="text-base font-bold text-slate-800">No products found</h3>
              <p className="text-xs text-slate-500 mt-1">
                {search
                  ? `No products matched "${search}". Try searching another name or SKU.`
                  : 'No products are currently published on the public website catalog.'}
              </p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#15527A] text-white text-xs font-bold"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((p) => (
                <div
                  key={p._id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden text-left group"
                >
                  {/* Top Image Showcase */}
                  <div className="relative w-full h-52 bg-gradient-to-b from-slate-50 via-slate-100/60 to-white flex items-center justify-center p-4 border-b border-slate-100 overflow-hidden">
                    <div className="absolute top-3 left-3 z-10">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#15527A] text-white shadow-sm">
                        {p.unit || 'PCS'}
                      </span>
                    </div>

                    <Link
                      to={`/products/${p._id}`}
                      className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 text-slate-700 hover:text-white hover:bg-[#15527A] border border-slate-200 shadow-sm transition"
                      title="View Details"
                    >
                      <Eye size={14} />
                    </Link>

                    {p.imageUrl ? (
                      <Link to={`/products/${p._id}`} className="w-full h-full flex items-center justify-center p-2">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="max-h-40 max-w-[85%] object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                    ) : (
                      <Link to={`/products/${p._id}`} className="w-full h-full flex items-center justify-center">
                        <div className="w-36 h-20 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
                          <div className="text-center">
                            <img src={heroImg} alt="OM" className="w-6 h-6 object-contain mx-auto mb-1" />
                            <span className="text-[9px] font-mono text-cyan-300 font-bold block">{p.sku}</span>
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>

                  {/* Details Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span className="font-mono text-[#15527A] font-semibold text-[11px]">{p.sku}</span>
                        <div className="flex items-center gap-1 text-amber-500 font-semibold text-xs">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span>4.9</span>
                        </div>
                      </div>

                      <Link to={`/products/${p._id}`}>
                        <h3 className="font-bold text-base text-slate-900 group-hover:text-[#15527A] transition line-clamp-2 leading-snug">
                          {p.name}
                        </h3>
                      </Link>

                      {p.description && (
                        <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      )}
                    </div>

                    {/* Price & Action */}
                    <div className="mt-5 pt-3.5 border-t border-slate-100">
                      <div className="flex items-baseline gap-1.5 mb-3">
                        <span className="text-xl font-extrabold text-slate-900">
                          ₹{Number(p.sellingRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[11px] text-slate-500">/ {p.unit || 'PCS'}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          to={`/products/${p._id}`}
                          className="py-2 px-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition text-center flex items-center justify-center gap-1"
                        >
                          <span>Details</span>
                          <ArrowRight size={12} />
                        </Link>

                        <button
                          onClick={() => handleAddToCart(p)}
                          className="py-2 px-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ShoppingCart size={13} />
                          <span>Inquire</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bulk supply / Corporate banner */}
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
            <Link
              to="/#contact"
              className="px-6 py-3 rounded-xl bg-[#15527A] hover:bg-[#0e3d5c] text-white text-xs sm:text-sm font-bold shadow-md transition flex items-center gap-2 flex-shrink-0"
            >
              <span>Request Corporate Quote</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="w-full bg-[#0D3854] text-white border-t border-[#1A6596]/40 py-12 px-4 sm:px-8 text-xs text-left">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#1A6596]/30">
            <div className="md:col-span-5">
              <div className="flex items-center gap-3">
                <div className="bg-white p-1 rounded-xl shadow-md">
                  <img src={heroImg} alt="OM Cartridge Logo" className="w-9 h-9 object-contain" />
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

            <div className="md:col-span-4 flex flex-col space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono mb-2">
                Quick Navigation
              </span>
              <Link to="/" className="text-left text-slate-300 hover:text-white transition">Home</Link>
              <Link to="/products" className="text-left text-slate-300 hover:text-white transition">Products Catalog</Link>
              <Link to="/#solutions" className="text-left text-slate-300 hover:text-white transition">Solutions</Link>
              <Link to="/#about" className="text-left text-slate-300 hover:text-white transition">About Us</Link>
              <Link to="/#contact" className="text-left text-slate-300 hover:text-white transition">Contact</Link>
            </div>

            <div className="md:col-span-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono mb-2 block">
                  Staff Management
                </span>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:text-white bg-[#0A2D44] hover:bg-[#072336] border border-[#1A6596]/40 transition shadow-sm"
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

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-[11px] text-slate-300">
            <div>&copy; 2026 Om Cartridge. All Rights Reserved.</div>
            <div className="text-slate-400">Reliable Printing Solutions for Gujarat Businesses</div>
          </div>
        </div>
      </footer>

      {/* ── Inquiry Cart Drawer ─────────────────────────────────────────────── */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between text-left">
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

            <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <ShoppingCart size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="font-medium text-sm">Your inquiry cart is empty</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item._id} className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 bg-slate-50/50">
                    <div className="flex-1">
                      <div className="text-[10px] font-mono text-[#15527A] uppercase">{item.sku}</div>
                      <div className="text-sm font-bold text-slate-900">{item.name}</div>
                      <div className="text-xs text-red-600 font-extrabold mt-0.5">
                        ₹{Number(item.sellingRate).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(item._id, -1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-bold text-xs text-slate-900 w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item._id, 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <button
                      onClick={() => handleUpdateQuantity(item._id, -item.quantity)}
                      className="text-slate-400 hover:text-red-500 p-1"
                      title="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Estimated Subtotal:</span>
                  <span className="text-lg font-black text-slate-900">
                    ₹{totalCartAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  GST Invoice &amp; delivery terms finalized with executive.
                </div>
                <button
                  onClick={() => {
                    setCartDrawerOpen(false);
                    navigate('/#contact');
                  }}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>Submit Inquiry For These Items</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicProductsPage;
