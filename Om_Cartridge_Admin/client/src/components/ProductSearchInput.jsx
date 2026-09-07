import { useState, useRef, useEffect } from 'react';
import { Search, Check, AlertCircle, X, ChevronDown } from 'lucide-react';

/**
 * ProductSearchInput — Autocomplete search for invoice line items.
 * Allows searching products by name or SKU. Shows live stock status badges.
 */
const ProductSearchInput = ({
  products = [],
  selectedProductId = '',
  onSelect,
  placeholder = 'Search product by name or SKU...',
  disabled = false,
  error = '',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedProduct = products.find((p) => p._id === selectedProductId);

  // Sync query when selectedProduct changes
  useEffect(() => {
    if (selectedProduct) {
      setQuery(selectedProduct.name);
    } else {
      setQuery('');
    }
  }, [selectedProductId, selectedProduct]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        // Reset query to selected product name if not chosen
        if (selectedProduct) {
          setQuery(selectedProduct.name);
        } else {
          setQuery('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedProduct]);

  // Filter products by query
  const filteredProducts = products.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const nameMatch = (p.name || '').toLowerCase().includes(q);
    const skuMatch = (p.sku || '').toLowerCase().includes(q);
    const hsnMatch = (p.hsnSac || '').toLowerCase().includes(q);
    return nameMatch || skuMatch || hsnMatch;
  });

  const handleSelect = (prod) => {
    if (prod.quantity <= 0) return; // Prevent selecting out of stock
    onSelect(prod);
    setQuery(prod.name);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onSelect(null);
    setQuery('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < filteredProducts.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : filteredProducts.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredProducts[highlightIndex]) {
        handleSelect(filteredProducts[highlightIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full min-w-[200px]">
      <div
        className={`flex items-center relative rounded-lg px-2 py-0.5 transition-all border ${
          error
            ? 'border-red-500 ring-2 ring-red-100'
            : isOpen
            ? 'border-navy ring-2 ring-navy/15'
            : 'border-app-border-dark hover:border-navy/60'
        } ${disabled ? 'bg-gray-100' : 'bg-white'}`}
      >
        <Search size={14} className="text-gray-400 mr-1.5 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
            setHighlightIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full border-none outline-none text-xs py-1.5 bg-transparent text-gray-800 placeholder:text-gray-400 ${
            selectedProduct ? 'font-semibold' : 'font-normal'
          }`}
        />

        {selectedProduct && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors flex items-center"
            title="Clear selected product"
          >
            <X size={13} />
          </button>
        )}

        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen((prev) => !prev)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex items-center"
        >
          <ChevronDown
            size={13}
            className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-white rounded-xl border border-app-border shadow-xl max-h-64 overflow-y-auto p-1.5">
          {filteredProducts.length === 0 ? (
            <div className="p-3.5 text-center text-xs text-gray-500">
              No matching products found
            </div>
          ) : (
            filteredProducts.map((p, idx) => {
              const isSelected = p._id === selectedProductId;
              const isHighlighted = idx === highlightIndex;
              const isOutOfStock = p.quantity <= 0;
              const isLowStock = !isOutOfStock && p.quantity <= (p.minimumStock || 5);

              return (
                <div
                  key={p._id}
                  onClick={() => !isOutOfStock && handleSelect(p)}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  className={`p-2 rounded-lg flex items-center justify-between gap-2.5 transition-colors border-b border-gray-50 last:border-none ${
                    isOutOfStock
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer'
                  } ${
                    isSelected
                      ? 'bg-blue-50 text-navy'
                      : isHighlighted
                      ? 'bg-slate-50'
                      : 'bg-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-xs font-semibold truncate ${
                        isSelected ? 'text-navy' : 'text-gray-900'
                      }`}
                    >
                      {p.name}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                      {p.sku && <span>SKU: {p.sku}</span>}
                      {p.hsnSac && <span>HSN: {p.hsnSac}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0">
                    <div className="text-xs font-bold text-gray-900">
                      ₹{Number(p.sellingRate || 0).toLocaleString('en-IN')}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                        isOutOfStock
                          ? 'bg-red-100 text-app-danger'
                          : isLowStock
                          ? 'bg-amber-100 text-app-warning'
                          : 'bg-emerald-100 text-app-success'
                      }`}
                    >
                      {isOutOfStock ? 'OUT OF STOCK' : `${p.quantity} ${p.unit || 'PCS'} in stock`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};


export default ProductSearchInput;
