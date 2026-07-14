import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';

type OrderStatus = 'ordered' | 'shipped' | 'out_for_delivery' | 'delivered' | 'rejected';

const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'ordered', label: 'Ordered' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  ordered: 'Ordered',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  rejected: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  ordered: '#14b8a6',
  shipped: '#3b82f6',
  out_for_delivery: '#8b5cf6',
  delivered: '#22c55e',
  rejected: '#ef4444',
};

function StatusTracker({
  status,
  steps = STATUS_STEPS,
  colors = STATUS_COLORS,
}: {
  status: string;
  steps?: { key: string; label: string }[];
  colors?: Record<string, string>;
}) {
  if (status === 'rejected') {
    return (
      <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 font-semibold text-xs my-3 animate-in fade-in duration-200">
        <div className="flex items-center gap-2">
          <span>❌</span> This order has been cancelled.
        </div>
        <div className="text-[11px] opacity-90 font-medium pl-6">
          Refund will be processed in 5 working days.
        </div>
      </div>
    );
  }
  const currentIdx = steps.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center gap-0 my-4">
      {steps.map((step, idx) => {
        const done = idx <= currentIdx;
        const color = done ? (colors[status] ?? 'var(--primary)') : 'var(--border-color)';
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center flex-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 text-white"
                style={{
                  background: done ? color : 'var(--bg-app)',
                  borderColor: color,
                }}
              >
                {done && (
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span
                className="text-[9px] mt-1.5 text-center font-semibold leading-tight capitalize whitespace-nowrap"
                style={{ color: done ? color : 'var(--text-muted)' }}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className="flex-1 h-0.5 -mt-4 transition-all duration-300"
                style={{
                  backgroundColor: idx < currentIdx ? color : 'var(--border-color)',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export const Orders: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [dbStatuses, setDbStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const res = await fetchWithAuth('/orders/statuses');
        if (res.ok) {
          const data = await res.json();
          setDbStatuses(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadStatuses();
  }, [fetchWithAuth]);

  const statusLabels = dbStatuses.length > 0
    ? dbStatuses.reduce((acc, curr) => {
        acc[curr.key] = curr.label;
        return acc;
      }, {} as Record<string, string>)
    : STATUS_LABELS;

  const statusColors = dbStatuses.length > 0
    ? dbStatuses.reduce((acc, curr) => {
        acc[curr.key] = curr.color;
        return acc;
      }, {} as Record<string, string>)
    : STATUS_COLORS;

  const statusSteps = dbStatuses.length > 0
    ? dbStatuses
        .filter((s) => s.isStep)
        .sort((a, b) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0))
        .map((s) => ({ key: s.key as OrderStatus, label: s.label }))
    : STATUS_STEPS;

  // Cancellation and Address States
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priceMin, setPriceMin] = useState('0');
  const [priceMax, setPriceMax] = useState('100000');
  const [cancelConfirmId, setCancelConfirmId] = useState<number | null>(null);
  const [editingAddressOrder, setEditingAddressOrder] = useState<any | null>(null);
  const [addrForm, setAddrForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrError, setAddrError] = useState('');

  // Reviews states
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewProductId, setReviewProductId] = useState<number | null>(null);
  const [reviewProductTitle, setReviewProductTitle] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewEditId, setReviewEditId] = useState<number | null>(null);
  const [reviewError, setReviewError] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const handleDeleteReview = async (reviewId: number) => {
    try {
      const res = await fetchWithAuth(`/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast.success('Review deleted successfully.');
        const revRes = await fetchWithAuth('/reviews/user');
        if (revRes.ok) {
          setUserReviews(await revRes.json());
        }
      } else {
        showToast.error('Failed to delete review.');
      }
    } catch (err) {
      console.error(err);
      showToast.error('Network error.');
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInputValue);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInputValue]);
  // Define filteredOrders for rendering
  const filteredOrders = orders;

  useEffect(() => {
    const load = async () => {
      try {
        let url = '/orders';
        const params = new URLSearchParams();
        if (searchQuery.trim() !== '') {
          params.append('search', searchQuery.trim());
        }
        if (statusFilter) {
          params.append('status', statusFilter);
        }
        if (priceMin.trim() !== '') {
          params.append('priceMin', priceMin.trim());
        }
        if (priceMax.trim() !== '') {
          params.append('priceMax', priceMax.trim());
        }
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        const res = await fetchWithAuth(url);
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }

        // Fetch user reviews
        if (user && user.role !== 'admin') {
          const revRes = await fetchWithAuth('/reviews/user');
          if (revRes.ok) {
            setUserReviews(await revRes.json());
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchWithAuth, searchQuery, statusFilter, priceMin, priceMax, user]);

  if (loading) {
    return (
      <div className="flex flex-col gap-5 w-full">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex justify-between items-center gap-4 animate-pulse"
          >
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-1/4" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
            <div className="flex flex-col items-end space-y-2">
              <div className="h-5 bg-white/10 rounded w-16" />
              <div className="h-3 bg-white/5 rounded w-12" />
            </div>
          </div>
        ))}
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
        {user?.role === 'admin' && (
          <div className="relative flex-1 max-w-xs w-full">
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
              placeholder="Search orders by user email or name..."
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
            />
          </div>
        )}
        {user?.role === 'admin' && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1 rounded-md border bg-[var(--bg-card)] text-[var(--text-main)] focus:outline-none"
          >
            <option value="">All Statuses</option>
            {(dbStatuses.length > 0
              ? dbStatuses
              : Object.entries(STATUS_LABELS).map(([key, label]) => ({ key, label }))
            ).map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        )}
        {/* Price Range Slider */}
        <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-1 rounded-md h-[30px] flex-1 sm:flex-initial">
          <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase whitespace-nowrap">Price Limit:</span>
          <input
            type="range"
            min="0"
            max="100000"
            step="500"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="w-24 sm:w-32 accent-[var(--primary)] cursor-pointer h-1 rounded-lg bg-[var(--border-color)] outline-none"
          />
          <span className="text-[10px] font-bold text-[var(--primary)] whitespace-nowrap">
            ₹{Number(priceMax).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
          <svg className="w-16 h-16 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          {searchQuery.trim() !== '' || statusFilter !== '' || priceMin !== '0' || priceMax !== '100000' ? (
            <>
              <h3 className="text-base font-bold text-[var(--text-heading)]">No matching orders found</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-sm leading-relaxed">
                Try adjusting your search query, status selection, or price limits.
              </p>
              <button
                onClick={() => {
                  setSearchInputValue('');
                  setSearchQuery('');
                  setStatusFilter('');
                  setPriceMin('0');
                  setPriceMax('100000');
                }}
                className="mt-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-glow)] text-white text-xs font-semibold rounded-md transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Clear All Filters
              </button>
            </>
          ) : (
            <>
              <h3 className="text-base font-bold text-[var(--text-heading)]">No orders yet</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-sm leading-relaxed">
                Start shopping and your orders will appear here.
              </p>
            </>
          )}
        </div>
      ) : (
        filteredOrders.map((order) => {
          const isExpanded = expandedId === order.id;
          const statusColor = statusColors[order.status] ?? 'var(--primary)';

          return (
            <div
              key={order.id}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-sm overflow-hidden transition-all"
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
            >
              {/* Card Header Row */}
              <div className="flex items-center gap-3 p-4 md:p-5 cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[var(--text-heading)] text-sm md:text-base">
                      Order #{order.id}
                    </span>
                    {user?.role === 'admin' ? (
                      <div onClick={(e) => e.stopPropagation()}>
                        <select
                          disabled={!order.isActive}
                          value={order.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            try {
                              const res = await fetchWithAuth(`/orders/${order.id}/status`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: newStatus }),
                              });
                              if (res.ok) {
                                setOrders((prev) =>
                                  prev.map((o) =>
                                    o.id === order.id ? { ...o, status: newStatus } : o
                                  )
                                );
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="px-3 py-1 rounded-full text-xs font-semibold border bg-transparent outline-none cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            color: statusColor,
                            borderColor: statusColor,
                            backgroundColor: `${statusColor}10`,
                          }}
                        >
                          {(dbStatuses.length > 0
                            ? dbStatuses
                            : [...STATUS_STEPS, { key: 'rejected' as OrderStatus, label: 'Cancelled' }]
                          ).map((s) => (
                            <option key={s.key} value={s.key} className="bg-[var(--bg-card)] text-[var(--text-main)]">
                              {statusLabels[s.key] ?? s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold"
                        style={{
                          color: statusColor,
                          backgroundColor: `${statusColor}10`,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                        {statusLabels[order.status] ?? order.status}
                      </span>
                    )}

                    {order.user && (
                      <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-white/5 text-[var(--text-muted)] border border-[var(--border-color)]">
                        👤 {order.user.name} ({order.user.email})
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-[var(--text-muted)] flex flex-wrap gap-4">
                    <span>📅 {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>📦 {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}</span>
                    <span className="font-mono text-[10px]">Txn: {order.txnId}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg md:text-xl font-extrabold text-[var(--primary)]">
                    ₹{Number(order.totalAmount).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                    via {order.paymentMethod}
                  </div>
                </div>
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="text-[var(--text-muted)] transition-transform duration-200 flex-shrink-0"
                  style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

            {/* Expanded Section */}
            {isExpanded && (
              <div className="border-t border-[var(--border-color)] p-5 md:p-6 flex flex-col gap-6 bg-white/[0.01]">
                {/* Status Tracker */}
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Order Tracking
                  </div>
                  <StatusTracker status={order.status} steps={statusSteps} colors={statusColors} />
                </div>

                {/* Delivery Address */}
                {order.address && (
                  <div className="bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl p-4 space-y-2">
                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      Delivery Address
                    </div>
                    <div className="text-xs text-[var(--text-main)] leading-relaxed">
                      <strong>{order.address.fullName}</strong> · {order.address.phone}<br />
                      {order.address.addressLine1}
                      {order.address.addressLine2 ? `, ${order.address.addressLine2}` : ''}<br />
                      {order.address.city}, {order.address.state} – {order.address.pincode}
                    </div>
                  </div>
                )}

                {/* Items */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Items
                  </div>
                  <div className="divide-y divide-[var(--border-color)]">
                    {(order.items ?? []).map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 py-3">
                        {item.thumbnail && (
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-12 h-12 rounded-lg object-contain bg-white/2 border border-[var(--border-color)] flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-xs text-[var(--text-heading)] truncate">
                            {item.title}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)]">Qty: {item.quantity}</div>
                          {order.status === 'delivered' && user?.role !== 'admin' && (
                            <div className="mt-2 flex items-center gap-3">
                              {(() => {
                                const existingReview = userReviews.find(r => r.productId === item.productId);
                                if (existingReview) {
                                  return (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs text-amber-400 font-bold flex items-center gap-0.5 mr-1">
                                        {'★'.repeat(existingReview.rating)}{'☆'.repeat(5 - existingReview.rating)}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setReviewEditId(existingReview.id);
                                          setReviewProductId(item.productId);
                                          setReviewProductTitle(item.title);
                                          setReviewRating(existingReview.rating);
                                          setReviewComment(existingReview.comment);
                                          setReviewError('');
                                          setIsReviewModalOpen(true);
                                        }}
                                        className="px-3.5 py-1.5 bg-white/5 border border-teal-500/35 hover:bg-teal-500/10 text-teal-400 rounded-md text-xs font-bold cursor-pointer transition-all active:scale-95"
                                      >
                                        Edit Review
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (window.confirm("Are you sure you want to delete this review?")) {
                                            handleDeleteReview(existingReview.id);
                                          }
                                        }}
                                        className="px-3.5 py-1.5 bg-white/5 border border-red-500/35 hover:bg-red-500/10 text-red-400 rounded-md text-xs font-bold cursor-pointer transition-all active:scale-95"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReviewEditId(null);
                                        setReviewProductId(item.productId);
                                        setReviewProductTitle(item.title);
                                        setReviewRating(0);
                                        setReviewComment('');
                                        setReviewError('');
                                        setIsReviewModalOpen(true);
                                      }}
                                      className="px-4.5 py-2.5 bg-[var(--primary)] text-slate-900 font-extrabold rounded-lg text-sm hover:opacity-90 transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95 shadow-lg border border-[var(--primary)]"
                                    >
                                      ★ Write Review
                                    </button>
                                  );
                                }
                              })()}
                            </div>
                          )}
                        </div>
                        <div className="font-bold text-xs text-[var(--text-heading)] flex-shrink-0">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Total */}
                <div className="flex justify-between items-center pt-4 border-t border-[var(--border-color)] font-semibold text-sm">
                  <span className="text-[var(--text-muted)]">Order Total</span>
                  <span className="text-[var(--primary)] font-extrabold text-base">₹{Number(order.totalAmount).toFixed(2)}</span>
                </div>

                {/* User Order Actions */}
                {user?.role !== 'admin' && order.status !== 'delivered' && order.status !== 'rejected' && (
                  <div className="flex justify-end gap-3 pt-2">
                    {order.address && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAddressOrder(order);
                          setAddrForm({
                            fullName: order.address.fullName || '',
                            phone: order.address.phone || '',
                            addressLine1: order.address.addressLine1 || '',
                            addressLine2: order.address.addressLine2 || '',
                            city: order.address.city || '',
                            state: order.address.state || '',
                            pincode: order.address.pincode || '',
                          });
                          setAddrError('');
                        }}
                        className="px-4 py-2 border border-[var(--border-color)] hover:bg-white/5 rounded-md text-xs font-semibold text-[var(--text-main)] cursor-pointer transition-all"
                      >
                        Change Delivery Address
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCancelConfirmId(order.id);
                      }}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-semibold cursor-pointer transition-all active:scale-95"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }))}

      {/* Cancellation Confirmation Modal */}
      {cancelConfirmId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setCancelConfirmId(null)}
        >
          <div
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-[var(--text-heading)]">Confirm Cancellation</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 py-2 border border-[var(--border-color)] hover:bg-white/5 rounded-md text-xs font-semibold text-[var(--text-main)] cursor-pointer"
                onClick={() => setCancelConfirmId(null)}
              >
                No, Keep Order
              </button>
              <button
                onClick={async () => {
                  const orderId = cancelConfirmId;
                  setCancelConfirmId(null);
                  try {
                    const res = await fetchWithAuth(`/orders/${orderId}/cancel`, {
                      method: 'PUT',
                    });
                    if (res.ok) {
                      setOrders((prev) =>
                        prev.map((o) =>
                          o.id === orderId ? { ...o, status: 'rejected', isActive: false } : o
                        )
                      );
                      showToast.success('Order cancelled successfully.');
                    } else {
                      showToast.error('Failed to cancel order.');
                    }
                  } catch (err) {
                    console.error(err);
                    showToast.error('Network error occurred.');
                  }
                }}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-semibold cursor-pointer"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Address Modal */}
      {editingAddressOrder !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setEditingAddressOrder(null)}
        >
          <div
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-md w-full space-y-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-[var(--text-heading)]">Change Delivery Address</h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                    value={addrForm.fullName}
                    onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Phone *
                  </label>
                  <input
                    className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                    value={addrForm.phone}
                    onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Address Line 1 *
                </label>
                <input
                  className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                  value={addrForm.addressLine1}
                  onChange={(e) => setAddrForm({ ...addrForm, addressLine1: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Address Line 2 (Optional)
                </label>
                <input
                  className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                  value={addrForm.addressLine2}
                  onChange={(e) => setAddrForm({ ...addrForm, addressLine2: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    City *
                  </label>
                  <input
                    className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                    value={addrForm.city}
                    onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    State *
                  </label>
                  <input
                    className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                    value={addrForm.state}
                    onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                  />
                </div>
              </div>

              <div className="w-1/2">
                <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Pincode *
                </label>
                <input
                  className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                  value={addrForm.pincode}
                  onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })}
                />
              </div>
            </div>

            {addrError && <div className="text-red-500 text-[11px] font-semibold">{addrError}</div>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                className="px-4 py-2 border border-[var(--border-color)] hover:bg-white/5 rounded-md text-xs font-semibold text-[var(--text-main)] cursor-pointer"
                onClick={() => setEditingAddressOrder(null)}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const { fullName, phone, addressLine1, city, state, pincode } = addrForm;
                  if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
                    setAddrError('Please fill in all required fields.');
                    return;
                  }
                  setAddrLoading(true);
                  try {
                    const res = await fetchWithAuth(`/address/${editingAddressOrder.address.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(addrForm),
                    });
                    if (res.ok) {
                      setOrders((prev) =>
                        prev.map((o) => {
                          if (o.id === editingAddressOrder.id) {
                            return {
                              ...o,
                              address: {
                                ...o.address,
                                ...addrForm,
                              },
                            };
                          }
                          return o;
                        })
                      );
                      showToast.success('Address changed successfully.');
                      setEditingAddressOrder(null);
                    } else {
                      setAddrError('Failed to update address.');
                    }
                  } catch (err) {
                    console.error(err);
                    setAddrError('Network error.');
                  } finally {
                    setAddrLoading(false);
                  }
                }}
                disabled={addrLoading}
                className="px-4 py-2 bg-[var(--primary)] text-slate-900 font-bold rounded-md text-xs hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {addrLoading ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Review Dialog Modal */}
      {isReviewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsReviewModalOpen(false)}
        >
          <div
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-md w-full space-y-5 shadow-xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-[var(--text-heading)]">
              {reviewEditId ? 'Edit Product Review' : 'Write Product Review'}
            </h3>
            
            <p className="text-xs text-[var(--text-muted)] font-semibold leading-relaxed">
              Product: <span className="text-[var(--text-main)]">{reviewProductTitle}</span>
            </p>

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
                      onClick={() => setReviewRating(num)}
                      className={`text-2xl transition-all cursor-pointer focus:outline-none hover:scale-110 active:scale-95 ${
                        num <= reviewRating ? 'text-amber-400' : 'text-white/20'
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
                  placeholder="Share your experience with this product..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>
            </div>

            {reviewError && <div className="text-red-500 text-[11px] font-semibold">{reviewError}</div>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                className="px-4 py-2 border border-[var(--border-color)] hover:bg-white/5 rounded-md text-xs font-semibold text-[var(--text-main)] cursor-pointer"
                onClick={() => setIsReviewModalOpen(false)}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (reviewRating < 1 || reviewRating > 5) {
                    setReviewError('Please select a rating (1-5 stars).');
                    return;
                  }
                  if (!reviewComment.trim()) {
                    setReviewError('Please write a comment.');
                    return;
                  }
                  setReviewLoading(true);
                  setReviewError('');
                  try {
                    const url = reviewEditId ? `/reviews/${reviewEditId}` : '/reviews';
                    const method = reviewEditId ? 'PUT' : 'POST';
                    const payload = reviewEditId
                      ? { rating: reviewRating, comment: reviewComment.trim() }
                      : { productId: reviewProductId, rating: reviewRating, comment: reviewComment.trim() };

                    const res = await fetchWithAuth(url, {
                      method,
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    });

                    if (res.ok) {
                      showToast.success(reviewEditId ? 'Review updated successfully!' : 'Review submitted successfully!');
                      setIsReviewModalOpen(false);
                      const revRes = await fetchWithAuth('/reviews/user');
                      if (revRes.ok) {
                        setUserReviews(await revRes.json());
                      }
                    } else {
                      const data = await res.json();
                      setReviewError(data.message || 'Failed to submit review.');
                    }
                  } catch (err) {
                    console.error(err);
                    setReviewError('Network error.');
                  } finally {
                    setReviewLoading(false);
                  }
                }}
                disabled={reviewLoading}
                className="px-4 py-2 bg-[var(--primary)] text-slate-900 font-bold rounded-md text-xs hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {reviewLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


