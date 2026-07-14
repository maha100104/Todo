import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { StoreLayout } from '../components/StoreLayout';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, fetchWithAuth } = useAuth();
  const { addToCart, toggleWishlist, isInWishlist } = useStore();

  const [product, setProduct] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit review states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editReviewId, setEditReviewId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!user || !id) return;
    const fetchProductDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchWithAuth(`/products/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Product not found');
          }
          throw new Error('Failed to load product details');
        }
        const data = await res.json();
        setProduct(data.product);
        setReviews(data.reviews || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [user, id]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-app)]">
        <div className="w-6 h-6 border-2 border-[var(--primary-glow)] border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const renderStars = (rating: number) => {
    const stars = [];
    const floor = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= floor) {
        stars.push(<span key={i} className="text-amber-400">★</span>);
      } else if (i - 0.5 <= rating) {
        stars.push(<span key={i} className="text-amber-400">⯪</span>);
      } else {
        stars.push(<span key={i} className="text-[var(--text-muted)]">★</span>);
      }
    }
    return stars;
  };

  const isWishlisted = product ? isInWishlist(product.id) : false;
  const originalPrice = product 
    ? (product.price / (1 - (product.discountPercentage || 0) / 100)).toFixed(2)
    : '0.00';

  return (
    <StoreLayout pageTitle="Product Details">
      <div className="mb-6">
        <button
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] hover:border-[var(--primary)] transition-all cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Catalog
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-[var(--primary-glow)] border-t-[var(--primary)] rounded-full animate-spin" />
          <span className="text-xs text-[var(--text-muted)] font-medium">Loading product specifications...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      ) : product ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-2xl">
            {/* Gallery Section */}
            <div className="flex items-center justify-center bg-white/2 border border-[var(--border-color)] rounded-xl p-6 aspect-square max-h-[450px]">
              <img
                src={product.thumbnail}
                alt={product.title}
                className="object-contain w-full h-full max-h-[380px] hover:scale-105 transition-all duration-300"
              />
            </div>

            {/* Info Panel Section */}
            <div className="flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  <span>{product.brand || 'Generic'}</span>
                  {product.offer && (
                    <span className="px-2 py-0.5 bg-[var(--primary-glow)] text-[var(--primary)] rounded text-[9px] font-bold">
                      ★ {product.offer}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-heading)]">{product.title}</h1>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex gap-0.5 text-amber-500 text-sm">
                  {renderStars(product.rating || 0)}
                </div>
                <span className="font-semibold text-[var(--text-main)]">
                  {product.rating ? product.rating.toFixed(1) : '0.0'} / 5.0
                </span>
                <span className="text-[var(--text-muted)]">| Verified Reviews</span>
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`ml-auto w-8 h-8 flex items-center justify-center rounded-full border bg-white/5 cursor-pointer transition-all hover:scale-110 ${
                    isWishlisted ? 'text-red-500 border-red-500/25' : 'text-[var(--text-muted)] border-[var(--border-color)] hover:text-white'
                  }`}
                  title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <svg width="16" height="16" fill={isWishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              <div className="flex items-baseline gap-3 py-2 border-y border-[var(--border-color)]">
                <span className="text-3xl font-extrabold text-[var(--primary)]">₹{product.price.toFixed(2)}</span>
                {product.discountPercentage > 0 && (
                  <>
                    <span className="text-base text-[var(--text-muted)] line-through font-medium">₹{originalPrice}</span>
                    <span className="bg-red-500 text-white font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {product.discountPercentage}% OFF
                    </span>
                  </>
                )}
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Description</h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{product.description}</p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-[var(--text-muted)]">Availability:</span>
                {product.stock > 0 ? (
                  <span className="text-emerald-500">✔ In Stock ({product.stock} left)</span>
                ) : (
                  <span className="text-red-500">✘ Out of Stock</span>
                )}
              </div>

              <div className="pt-4 border-t border-[var(--border-color)]">
                <button
                  className="w-full flex items-center justify-center gap-2 bg-[var(--primary)] text-slate-900 font-bold py-3 rounded-lg text-sm hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add to Cart
                </button>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-12 space-y-6">
            <h3 className="text-lg font-bold text-[var(--text-heading)]">Customer Reviews ({reviews.length})</h3>
            {reviews.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">No reviews yet for this product.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--primary-glow)] text-[var(--primary)] font-bold text-xs flex items-center justify-center uppercase">
                          {rev.reviewerAvatar}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[var(--text-main)]">{rev.reviewerName}</div>
                          <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-2 flex-wrap">
                            <span>{rev.date}</span>
                            {rev.userId === user.id && (
                              <>
                                <span className="text-white/20 select-none">|</span>
                                <button
                                  onClick={() => {
                                    setEditReviewId(rev.id);
                                    setEditRating(rev.rating);
                                    setEditComment(rev.comment);
                                    setSubmitError('');
                                    setIsEditModalOpen(true);
                                  }}
                                  className="text-teal-400 hover:text-teal-300 font-semibold underline cursor-pointer transition-all"
                                >
                                  Edit
                                </button>
                                <span className="text-white/20 select-none">|</span>
                                <button
                                  onClick={async () => {
                                    if (window.confirm("Are you sure you want to delete this review?")) {
                                      try {
                                        const res = await fetchWithAuth(`/reviews/${rev.id}`, { method: 'DELETE' });
                                        if (res.ok) {
                                          // Reload reviews
                                          const detailsRes = await fetchWithAuth(`/products/${id}`);
                                          if (detailsRes.ok) {
                                            const detailsData = await detailsRes.json();
                                            setReviews(detailsData.reviews || []);
                                          }
                                        }
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }
                                  }}
                                  className="text-red-400 hover:text-red-300 font-semibold underline cursor-pointer transition-all"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-0.5 text-amber-500 text-xs">
                        {renderStars(rev.rating)}
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed italic">
                      “{rev.comment}”
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
      {/* Edit Review Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-md w-full space-y-5 shadow-xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-[var(--text-heading)]">Edit Review</h3>

            <div className="space-y-4">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  Rating *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setEditRating(num)}
                      className={`text-2xl transition-all cursor-pointer focus:outline-none hover:scale-110 active:scale-95 ${
                        num <= editRating ? 'text-amber-400' : 'text-white/20'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment text area */}
              <div>
                <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  Comment / Review *
                </label>
                <textarea
                  className="w-full px-3.5 py-2.5 text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                  rows={4}
                  placeholder="Share your experience..."
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                />
              </div>
            </div>

            {submitError && <div className="text-red-500 text-[11px] font-semibold">{submitError}</div>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                className="px-4 py-2 border border-[var(--border-color)] hover:bg-white/5 rounded-md text-xs font-semibold text-[var(--text-main)] cursor-pointer"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (editRating < 1 || editRating > 5) {
                    setSubmitError('Please select a rating (1-5 stars).');
                    return;
                  }
                  if (!editComment.trim()) {
                    setSubmitError('Please write a comment.');
                    return;
                  }
                  setSubmittingReview(true);
                  setSubmitError('');
                  try {
                    const res = await fetchWithAuth(`/reviews/${editReviewId}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ rating: editRating, comment: editComment.trim() }),
                    });

                    if (res.ok) {
                      setIsEditModalOpen(false);
                      // Reload reviews
                      const detailsRes = await fetchWithAuth(`/products/${id}`);
                      if (detailsRes.ok) {
                        const detailsData = await detailsRes.json();
                        setReviews(detailsData.reviews || []);
                      }
                    } else {
                      const data = await res.json();
                      setSubmitError(data.message || 'Failed to update review.');
                    }
                  } catch (err) {
                    console.error(err);
                    setSubmitError('Network error.');
                  } finally {
                    setSubmittingReview(false);
                  }
                }}
                disabled={submittingReview}
                className="px-4 py-2 bg-[var(--primary)] text-slate-900 font-bold rounded-md text-xs hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {submittingReview ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </StoreLayout>
  );
};
