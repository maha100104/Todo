import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { StoreLayout } from '../components/StoreLayout';
import { FaFilter } from 'react-icons/fa';

export const DashboardPage: React.FC = () => {
  const { user, loading, fetchWithAuth } = useAuth();
  const { addToCart, toggleWishlist, isInWishlist } = useStore();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState(100000);
  const [tempCategory, setTempCategory] = useState('all');
  const [tempPriceRange, setTempPriceRange] = useState(100000);
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search input and reset pagination when search input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInputValue);
      setPage(1);
      setPageCursors(['']);
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchInputValue]);

  const [selectedCategory, setSelectedCategory] = useState('all');

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCursors, setPageCursors] = useState<string[]>(['']);
  const limit = 10;

  // Fetch products from backend when category, page, search query, or priceRange changes
  useEffect(() => {
    if (!user) return;
    const fetchProducts = async () => {
      setLoadingProducts(true);
      setProductError(null);
      try {
        const cursor = page === 1 ? '' : (pageCursors[page - 1] || '');
        let url = `/products?limit=${limit}`;

        if (selectedCategory !== 'all') {
          url += `&category=${selectedCategory}`;
        }

        if (cursor && cursor.trim() !== '') {
          url += `&cursor=${cursor}`;
        }

        if (searchQuery.trim() !== '') {
          url += `&search=${encodeURIComponent(searchQuery.trim())}`;
        }

        // Add price limits
        url += `&minPrice=100&maxPrice=${priceRange}`;

        const res = await fetchWithAuth(url);
        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();
        setProducts(data.products || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
        if (data.pageCursors) {
          setPageCursors(data.pageCursors);
        }
      } catch (err: any) {
        console.error(err);
        setProductError(err.message || 'Failed to fetch products');
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [user, selectedCategory, page, searchQuery, priceRange]);

  // Protect the route
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-app)]">
        <div className="w-6 h-6 border-2 border-[var(--primary-glow)] border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const categories = ['all', 'beauty', 'fragrances'];

  const filteredProducts = products;

  return (
    <StoreLayout pageTitle="E-Commerce" activeTab="dashboard">
      <div className="p-6 text-[var(--text-main)] space-y-6">
        {/* Store Hero Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-gradient-to-r from-teal-500/10 to-teal-500/5 border border-[var(--border-color)] rounded-xl gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--primary)] mb-1">Welcome {user.name}!</h1>
            <p className="text-xs text-[var(--text-muted)] max-w-xl">
              Discover our exclusive catalog of products. Browse by category, search for items, and enjoy our premium membership perks.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-[var(--bg-card)] border border-[var(--border-color)] px-4 py-3 rounded-lg shadow-sm">
            <span className="text-2xl font-bold text-[var(--primary)]">{totalCount}</span>
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Products</span>
          </div>
        </div>

        {/* Catalog Controls */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 items-center">
            <div className="relative max-w-xs w-full">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-glow)] transition-all"
                placeholder="Search products..."
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
              />
            </div>
            <div className="relative">
              <button
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md border text-xs font-semibold cursor-pointer transition-all h-[38px] ${isFilterOpen
                  ? 'bg-[var(--primary)] text-slate-900 border-[var(--primary)]'
                  : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-color)] hover:border-[var(--primary)]'
                  }`}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <FaFilter size={12} />
                <span>Filter</span>
              </button>

              {/* Popover Filter Panel */}
              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-5 flex flex-col gap-4 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Popover Header & Close Button */}
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[var(--text-heading)] text-sm">Filter Catalog</span>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>

                  {/* Category List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Category Filter</h4>
                    <div className="flex gap-2 flex-wrap">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          className={`px-3 py-1 rounded-full text-[10px] font-semibold border capitalize cursor-pointer transition-all ${tempCategory === cat
                            ? 'bg-[var(--primary)] text-slate-900 border-[var(--primary)]'
                            : 'bg-[var(--bg-app)] text-[var(--text-main)] border-[var(--border-color)] hover:border-[var(--primary)]'
                            }`}
                          onClick={() => setTempCategory(cat)}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Price Range</h4>
                      <span className="text-xs font-bold text-[var(--primary)]">₹100 - ₹{tempPriceRange}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-[var(--text-muted)]">₹100</span>
                      <input
                        type="range"
                        min="100"
                        max="100000"
                        step="50"
                        value={tempPriceRange}
                        onChange={(e) => setTempPriceRange(Number(e.target.value))}
                        className="flex-1 accent-[var(--primary)] cursor-pointer h-1.5 rounded-lg bg-[var(--border-color)] outline-none"
                      />
                      <span className="text-[10px] text-[var(--text-muted)]">₹1L+</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-end mt-2">
                    <button
                      onClick={() => {
                        setTempCategory('all');
                        setTempPriceRange(100000);
                        setSelectedCategory('all');
                        setPriceRange(100000);
                        setPage(1);
                        setPageCursors(['']);
                        setIsFilterOpen(false);
                      }}
                      className="px-4 py-2 border border-[var(--border-color)] hover:bg-white/5 rounded-md text-[10px] font-semibold text-[var(--text-main)] cursor-pointer transition-all"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCategory(tempCategory);
                        setPriceRange(tempPriceRange);
                        setPage(1);
                        setPageCursors(['']);
                        setIsFilterOpen(false);
                      }}
                      className="px-4 py-2 bg-[var(--primary)] text-slate-900 hover:opacity-90 active:scale-95 rounded-md text-[10px] font-semibold cursor-pointer transition-all"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products Display */}
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden animate-pulse flex flex-col h-full">
                <div className="aspect-square bg-white/5" />
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="h-3 bg-white/10 rounded w-1/3" />
                    <div className="h-4 bg-white/15 rounded w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                  </div>
                  <div className="h-8 bg-white/10 rounded w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : productError ? (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{productError}</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--text-muted)] space-y-3">
            <svg className="w-12 h-12 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-semibold text-base text-[var(--text-heading)]">No Products Found</h3>
            <p className="text-xs">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredProducts.map((product) => {
                const discountAmt = product.discountPercentage || 0;
                const originalPrice = (product.price / (1 - discountAmt / 100)).toFixed(2);
                const isWishlisted = isInWishlist(product.id);

                return (
                  <div
                    key={product.id}
                    className="group relative bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--primary)] rounded-xl overflow-hidden flex flex-col h-full transition-all duration-300 ease-out cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-[var(--primary)]/10 hover:scale-105 hover:-translate-y-1.5"
                    onClick={() => navigate(`/dashboard/${product.id}`)}
                  >
                    {/* Wishlist Heart — visible in both light and dark themes */}
                    <button
                      className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all cursor-pointer hover:scale-110 shadow-sm ${isWishlisted
                        ? 'bg-red-50 border-red-400 text-red-500'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-red-400 hover:text-red-400'
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product);
                      }}
                      title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <svg width="15" height="15" fill={isWishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>



                    <div className="aspect-square bg-white/2 flex items-center justify-center p-4 border-b border-[var(--border-color)] overflow-hidden">
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="object-contain w-full h-full max-h-48 group-hover:scale-105 transition-all duration-300 ease-out"
                        loading="lazy"
                      />
                    </div>

                    <div className="p-4 flex-1 flex flex-col gap-2">
                      {/* Brand */}
                      <span className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider truncate">
                        {product.brand || 'Generic'}
                      </span>

                      {/* Product Title */}
                      <h4 className="font-bold text-base text-[var(--text-heading)] line-clamp-2 group-hover:text-[var(--primary)] transition-all leading-snug" title={product.title}>
                        {product.title}
                      </h4>

                      {/* Offer — red highlighted description line (only if offer exists) */}
                      {product.offer && (
                        <p className="text-sm font-semibold text-red-500 bg-red-500/8 border border-red-500/20 rounded px-2 py-1 line-clamp-1">
                          🏷️ {product.offer}
                        </p>
                      )}

                      {/* Discount % inline with price row */}
                      {discountAmt > 0 && (
                        <span className="text-sm font-bold text-red-500">{Math.round(discountAmt)}% OFF</span>
                      )}

                      {/* Rating */}
                      <div className="flex items-center gap-1.5 text-sm">
                        <svg className="text-amber-500 w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="font-semibold text-[var(--text-main)]">{product.rating}</span>
                        <span className="text-[var(--text-muted)]">({Math.floor((product.id * 17) % 150) + 12})</span>
                      </div>

                      {/* Price row */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-extrabold text-[var(--primary)]">₹{product.price.toFixed(2)}</span>
                        {discountAmt > 0 && (
                          <span className="text-sm text-[var(--text-muted)] line-through">₹{originalPrice}</span>
                        )}
                      </div>

                      {/* Stock */}
                      <span className={`text-sm font-semibold ${product.stock === 0 ? 'text-red-500' : product.stock < 10 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {product.stock === 0 ? 'Out of stock' : product.stock < 10 ? `Only ${product.stock} left!` : 'In stock'}
                      </span>
                    </div>

                    <div className="p-3 border-t border-[var(--border-color)] mt-auto">
                      <button
                        className="w-full flex items-center justify-center gap-2 bg-[var(--primary)] hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-bold py-3 rounded-lg text-sm cursor-pointer transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        disabled={product.stock === 0}
                      >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (() => {
              const groupIndex = Math.floor((page - 1) / 3);
              const startPage = groupIndex * 3 + 1;
              const endPage = Math.min(totalPages, startPage + 2);
              const visiblePages = [];
              for (let i = startPage; i <= endPage; i++) {
                visiblePages.push(i);
              }
              return (
                <div className="flex justify-center items-center gap-1.5 mt-8">
                  <button
                    className="px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] text-xs rounded-md font-medium text-[var(--text-main)] hover:border-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Prev
                  </button>
                  {visiblePages.map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`px-3.5 py-1.5 text-xs rounded-md font-semibold border transition-all cursor-pointer ${page === pageNum
                        ? 'bg-[var(--primary)] text-slate-900 border-[var(--primary)]'
                        : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-color)] hover:border-[var(--primary)]'
                        }`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    className="px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] text-xs rounded-md font-medium text-[var(--text-main)] hover:border-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </StoreLayout>
  );
};

