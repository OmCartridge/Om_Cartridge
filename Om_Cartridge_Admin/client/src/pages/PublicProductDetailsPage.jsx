import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Printer,
  Phone,
  ArrowLeft,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Star,
  ChevronRight,
  Menu,
  X,
  Mail,
  Lock,
  Check,
  Cpu,
  Truck,
  Shield,
  Tag,
  Headphones,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import heroImg from '../assets/hero.png';
import api from '../services/api';

const PublicProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Cart / Quote Drawer
  const [cartItems, setCartItems] = useState([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/products/public/${id}`);
        if (res.data?.success && res.data.data) {
          setProduct(res.data.data);
        } else {
          setError('Product not found or not currently available on the website.');
        }

        // Also fetch related public products
        try {
          const listRes = await api.get('/products/public');
          if (listRes.data?.success && Array.isArray(listRes.data.data)) {
            setRelatedProducts(listRes.data.data.filter((p) => p._id !== id).slice(0, 4));
          }
        } catch {
          // ignore related failure
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Product not found or not currently available on the website.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

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
              to="/products"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all duration-200"
            >
              <span>All Products</span>
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

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main className="flex-1 bg-white text-slate-800 py-10 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-8 flex-wrap">
            <Link to="/" className="hover:text-[#15527A] transition font-medium">Home</Link>
            <ChevronRight size={14} className="text-slate-400" />
            <Link to="/products" className="hover:text-[#15527A] transition font-medium">Products</Link>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="text-slate-900 font-semibold truncate max-w-xs sm:max-w-md">
              {product ? product.name : 'Product Details'}
            </span>
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <div className="w-12 h-12 border-4 border-[#15527A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-slate-600">Loading product details from inventory...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center max-w-md mx-auto p-8 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
                <Printer size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Product Not Available</h2>
              <p className="text-sm text-slate-600 mb-6">{error}</p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  to="/products"
                  className="px-5 py-2.5 rounded-xl bg-[#15527A] hover:bg-[#0f4061] text-white text-xs font-bold transition shadow-sm"
                >
                  Browse Public Catalog
                </Link>
                <Link
                  to="/"
                  className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition"
                >
                  Go Home
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Product Hero Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Left Column: Photograph Display */}
                <div className="lg:col-span-6">
                  <div className="relative rounded-3xl bg-gradient-to-b from-slate-50 via-slate-100/60 to-white border border-slate-200 p-8 flex items-center justify-center min-h-[380px] sm:min-h-[440px] shadow-sm overflow-hidden group">
                    {/* Badge */}
                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 items-start">
                      <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md bg-[#15527A] text-white shadow-sm">
                        {product.unit ? `${product.unit} Supply` : 'Toner Cartridge'}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                        100% Tested &amp; Certified
                      </span>
                    </div>

                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="max-h-80 sm:max-h-96 max-w-full object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      /* Styled 3D Cartridge Visual representation fallback */
                      <div className="relative w-64 h-36 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-850 rounded-2xl border-2 border-slate-700 shadow-2xl flex items-center justify-between p-4 group-hover:scale-105 transition-transform duration-300">
                        <div className="w-14 h-24 rounded-lg bg-gradient-to-b from-teal-500 via-emerald-400 to-teal-700 shadow-inner border border-emerald-300/40 relative overflow-hidden flex-shrink-0">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-8 animate-shimmer" />
                        </div>
                        <div className="flex-1 px-3 text-left">
                          <div className="flex items-center gap-1.5">
                            <img src={heroImg} alt="OM" className="w-5 h-5 object-contain" />
                            <span className="text-xs font-black text-white tracking-wide">OM LASER</span>
                          </div>
                          <div className="text-[10px] text-slate-300 font-mono mt-1">High-Density Toner</div>
                          <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                            <div className="bg-red-500 h-full rounded-full" style={{ width: '85%' }} />
                          </div>
                        </div>
                        <div className="w-6 h-7 rounded bg-amber-400 border border-amber-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Cpu size={14} className="text-slate-950" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Micro Trust Indicators */}
                  <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs font-bold text-[#15527A]">100%</div>
                      <div className="text-[11px] text-slate-500">OEM Compatible</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs font-bold text-red-600">Zero Leak</div>
                      <div className="text-[11px] text-slate-500">Guaranteed</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs font-bold text-emerald-600">Fast Delivery</div>
                      <div className="text-[11px] text-slate-500">Gujarat Hub</div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Product Info & Order CTAs */}
                <div className="lg:col-span-6 flex flex-col justify-between text-left">
                  <div>
                    {/* Category & Rating */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#15527A] font-mono">
                        Model: {product.sku}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500 font-semibold text-xs">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        <span>4.9</span>
                        <span className="text-slate-400 font-normal">(Verified Benchmark)</span>
                      </div>
                    </div>

                    {/* Product Name */}
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                      {product.name}
                    </h1>

                    {/* Price Showcase */}
                    <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-baseline justify-between">
                      <div>
                        <div className="text-xs text-slate-500 font-medium">Public Price</div>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-3xl font-black text-slate-900">
                            ₹{Number(product.sellingRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">/ {product.unit || 'PCS'}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                        GST Invoice Applicable
                      </span>
                    </div>

                    {/* Description */}
                    {product.description && (
                      <div className="mt-5 text-sm text-slate-600 leading-relaxed">
                        <p>{product.description}</p>
                      </div>
                    )}

                    {/* Specifications List */}
                    <div className="mt-6 p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 text-xs">
                      <div className="font-bold text-slate-900 uppercase font-mono tracking-wider text-[11px]">
                        Technical Specifications
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400 font-mono block">Product SKU:</span>
                          <span className="font-bold text-slate-800 font-mono mt-0.5 block">{product.sku}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-mono block">Packaging Unit:</span>
                          <span className="font-bold text-slate-800 mt-0.5 block">{product.unit || 'PCS'}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400 font-mono block">Tax Bracket:</span>
                          <span className="font-bold text-slate-800 mt-0.5 block">{product.gstRate || 18}% GST</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-mono block">Dispatch Status:</span>
                          <span className="font-bold text-emerald-600 mt-0.5 block">Ready for Dispatch</span>
                        </div>
                      </div>
                      <div className="pt-2.5 border-t border-slate-100">
                        <span className="text-slate-400 font-mono block">Printer Engine Compatibility:</span>
                        <span className="font-medium text-slate-700 mt-0.5 block">
                          Engineered for HP, Canon, Brother, and all standard OEM monochrome/colour laser engines.
                        </span>
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="mt-5 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                        <span>Precision-milled micro-toner ensures smudge-free, laser-sharp documents.</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                        <span>Hermetically sealed toner chamber eliminates leaks and page streaking.</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                        <span>Backed by OM Cartridge 100% replacement warranty against manufacturing defects.</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Inquiry */}
                  <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="py-3 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ShoppingCart size={16} />
                        <span>Add To Quote Cart</span>
                      </button>

                      <a
                        href="tel:+917096706868"
                        className="py-3 px-5 rounded-xl bg-white hover:bg-slate-50 text-[#15527A] font-bold text-sm border-2 border-[#15527A] transition flex items-center justify-center gap-2"
                      >
                        <Phone size={15} className="text-red-500" />
                        <span>Call +91 70967 06868</span>
                      </a>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                      <Link to="/products" className="inline-flex items-center gap-1.5 text-[#15527A] hover:underline font-semibold">
                        <ArrowLeft size={13} />
                        <span>Back to All Products</span>
                      </Link>
                      <span>Same-day dispatch available in Gujarat</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Products Section */}
              {relatedProducts.length > 0 && (
                <div className="mt-20 pt-12 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-red-600 font-mono">
                        From Our Inventory
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 mt-1">Other Available Products</h3>
                    </div>
                    <Link
                      to="/products"
                      className="text-xs font-bold text-[#15527A] hover:underline inline-flex items-center gap-1"
                    >
                      <span>View All</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {relatedProducts.map((rel) => (
                      <div
                        key={rel._id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between text-left group"
                      >
                        <div>
                          <div className="w-full h-36 bg-slate-50 rounded-xl mb-4 flex items-center justify-center p-3 border border-slate-100 overflow-hidden">
                            {rel.imageUrl ? (
                              <img
                                src={rel.imageUrl}
                                alt={rel.name}
                                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <Printer size={36} className="text-slate-400 group-hover:scale-110 transition-transform" />
                            )}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#15527A] font-mono">
                            {rel.sku}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#15527A] transition line-clamp-1 mt-1">
                            {rel.name}
                          </h4>
                          {rel.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 mt-1">{rel.description}</p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 text-sm">
                            ₹{Number(rel.sellingRate).toLocaleString('en-IN')}
                          </span>
                          <Link
                            to={`/products/${rel._id}`}
                            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                          >
                            <span>Details</span>
                            <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
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
                  <button
                    onClick={() => {
                      setCartDrawerOpen(false);
                      navigate('/products');
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
                  >
                    Browse Products
                  </button>
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

export default PublicProductDetailsPage;
