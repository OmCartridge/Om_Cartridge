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
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minWidth: '220px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          background: disabled ? '#f3f4f6' : '#fff',
          border: `1.5px solid ${error ? '#ef4444' : isOpen ? '#15527A' : '#d1d5db'}`,
          borderRadius: '8px',
          padding: '2px 8px',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(21, 82, 122, 0.12)' : 'none',
        }}
      >
        <Search size={14} color="#9ca3af" style={{ marginRight: '6px', flexShrink: 0 }} />
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
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            fontSize: '12px',
            padding: '6px 0',
            background: 'transparent',
            color: '#1f2937',
            fontWeight: selectedProduct ? 600 : 400,
          }}
        />

        {selectedProduct && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px',
              cursor: 'pointer',
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px',
            }}
            title="Clear selected product"
          >
            <X size={13} />
          </button>
        )}

        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            background: 'none',
            border: 'none',
            padding: '2px',
            cursor: 'pointer',
            color: '#9ca3af',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronDown
            size={13}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s ease',
            }}
          />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 100,
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.06)',
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '4px',
          }}
        >
          {filteredProducts.length === 0 ? (
            <div style={{ padding: '14px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
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
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    background: isSelected
                      ? '#eff6ff'
                      : isHighlighted
                      ? '#f8fafc'
                      : 'transparent',
                    opacity: isOutOfStock ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: isSelected ? '#15527A' : '#1e293b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      {p.sku && <span>SKU: {p.sku}</span>}
                      {p.hsnSac && <span>HSN: {p.hsnSac}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                      ₹{Number(p.sellingRate || 0).toLocaleString('en-IN')}
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        marginTop: '2px',
                        background: isOutOfStock ? '#fee2e2' : isLowStock ? '#fef3c7' : '#dcfce7',
                        color: isOutOfStock ? '#dc2626' : isLowStock ? '#d97706' : '#16a34a',
                      }}
                    >
                      {isOutOfStock ? 'OUT OF STOCK' : `${p.quantity} ${p.unit || 'PCS'} in stock`}
                    </div>
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
