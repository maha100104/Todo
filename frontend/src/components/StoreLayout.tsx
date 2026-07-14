import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface StoreLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
  activeTab?: 'dashboard' | 'profile' | 'orders';
}

export const StoreLayout: React.FC<StoreLayoutProps> = ({
  children,
  pageTitle,
}) => {
  const { user, fetchWithAuth } = useAuth();
  const { cart, wishlist, removeFromCart, updateQuantity, addToCart, toggleWishlist, clearCart } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'address' | 'payment'>('address');
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit' | 'upi'>('credit');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [txnId, setTxnId] = useState('');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);

  // Address states
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrForm, setAddrForm] = useState({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' });
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrError, setAddrError] = useState('');

  if (!user) return null;

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const fetchAddresses = async () => {
    try {
      const res = await fetchWithAuth('/address');
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
        const def = data.find((a: any) => a.isDefault === 1);
        if (def) setSelectedAddressId(def.id);
        else if (data.length > 0) setSelectedAddressId(data[0].id);
      }
    } catch (err) { console.error(err); }
  };

  const handleAddAddress = async () => {
    setAddrError('');
    const { fullName, phone, addressLine1, city, state, pincode } = addrForm;
    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      setAddrError('Please fill all required fields.');
      return;
    }
    setAddrLoading(true);
    try {
      const res = await fetchWithAuth('/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addrForm, isDefault: addresses.length === 0 ? 1 : 0 }),
      });
      if (res.ok) {
        await fetchAddresses();
        setShowAddressForm(false);
        setAddrForm({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' });
      } else {
        const errData = await res.json();
        setAddrError(errData?.message || 'Failed to add address.');
      }
    } catch { setAddrError('Network error.'); }
    finally { setAddrLoading(false); }
  };

  const handlePayment = async () => {
    setPaymentError('');

    // Validate fields
    if (paymentMethod === 'credit' || paymentMethod === 'debit') {
      if (!cardNumber.trim() || !cardName.trim() || !cardExpiry.trim() || !cardCvv.trim()) {
        setPaymentError('Please fill in all card details.');
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId.trim()) {
        setPaymentError('Please enter your UPI ID.');
        return;
      }
      if (!upiId.includes('@')) {
        setPaymentError('Please enter a valid UPI ID (e.g. name@upi).');
        return;
      }
    }

    setPaymentLoading(true);
    try {
      const res = await fetchWithAuth('/payment/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: paymentMethod,
          amount: cartTotal,
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardName,
          cardExpiry,
          cardCvv,
          upiId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPaymentError(data?.message || 'Payment failed. Please try again.');
        return;
      }

      // Save order to backend
      await fetchWithAuth('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalAmount: cartTotal,
          txnId: data.transactionId,
          paymentMethod,
          addressId: selectedAddressId,
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
            title: item.product.title,
            thumbnail: item.product.thumbnail,
          })),
        }),
      });

      // Simulate payment processing loader for 2.5 seconds
      await new Promise((resolve) => setTimeout(resolve, 2500));

      setTxnId(data.transactionId || '');
      setPaidAmount(cartTotal);
      setPaymentSuccess(true);
      clearCart();
    } catch {
      setPaymentError('Network error. Please check your connection.');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[var(--bg-app)] text-[var(--text-main)] overflow-x-hidden">
      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden md:flex w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-sidebar)] flex-col p-6 flex-shrink-0 transition-all duration-300">
        <div className="flex items-center gap-3 text-sm font-bold text-[var(--text-heading)] mb-10 cursor-pointer select-none" onClick={() => navigate('/dashboard')}>
          <div className="w-9 h-9 rounded-full bg-[var(--primary-glow)] text-[var(--primary)] flex items-center justify-center text-sm font-extrabold shadow-sm border border-[var(--primary-glow)]/30">
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <span className="truncate max-w-[150px]">{user.name}</span>
        </div>

        <nav className="flex flex-col gap-2 flex-grow">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ${
              location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/')
                ? 'bg-[var(--primary)] text-slate-900 shadow-md shadow-[var(--primary-glow)]/20'
                : 'text-[#94a3b8] hover:bg-[var(--primary-glow)]/[0.06] hover:text-[var(--primary)]'
            }`}
            onClick={() => navigate('/dashboard')}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            <span>Products</span>
          </div>

          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ${
              location.pathname === '/orders'
                ? 'bg-[var(--primary)] text-slate-900 shadow-md shadow-[var(--primary-glow)]/20'
                : 'text-[#94a3b8] hover:bg-[var(--primary-glow)]/[0.06] hover:text-[var(--primary)]'
            }`}
            onClick={() => navigate('/orders')}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>Orders</span>
          </div>

          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ${
              location.pathname === '/profile'
                ? 'bg-[var(--primary)] text-slate-900 shadow-md shadow-[var(--primary-glow)]/20'
                : 'text-[#94a3b8] hover:bg-[var(--primary-glow)]/[0.06] hover:text-[var(--primary)]'
            }`}
            onClick={() => navigate('/profile')}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Profile</span>
          </div>

          {user?.role === 'admin' && (
            <>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ${
                  location.pathname === '/products'
                    ? 'bg-[var(--primary)] text-slate-900 shadow-md shadow-[var(--primary-glow)]/20'
                    : 'text-[#94a3b8] hover:bg-[var(--primary-glow)]/[0.06] hover:text-[var(--primary)]'
                }`}
                onClick={() => navigate('/products')}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Manage Products</span>
              </div>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ${
                  location.pathname === '/users'
                    ? 'bg-[var(--primary)] text-slate-900 shadow-md shadow-[var(--primary-glow)]/20'
                    : 'text-[#94a3b8] hover:bg-[var(--primary-glow)]/[0.06] hover:text-[var(--primary)]'
                }`}
                onClick={() => navigate('/users')}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Manage Users</span>
              </div>
            </>
          )}
        </nav>

        <div className="mt-auto border-t border-[var(--border-sidebar)] pt-4">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-red-500/10 hover:text-red-500 w-full"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Log Out</span>
          </div>
        </div>
      </aside>

      {/* Sidebar Navigation - Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 md:hidden animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)}>
          <div
            className="fixed top-0 left-0 h-full w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-sidebar)] flex flex-col p-6 z-50 animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3 text-sm font-bold text-[var(--text-heading)] cursor-pointer select-none" onClick={() => { setIsMobileMenuOpen(false); navigate('/dashboard'); }}>
                <div className="w-9 h-9 rounded-full bg-[var(--primary-glow)] text-[var(--primary)] flex items-center justify-center text-sm font-extrabold shadow-sm border border-[var(--primary-glow)]/30">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <span className="truncate max-w-[120px]">{user.name}</span>
              </div>
              <button className="text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer text-xl" onClick={() => setIsMobileMenuOpen(false)}>
                &times;
              </button>
            </div>

            <nav className="flex flex-col gap-2 flex-grow">
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ${
                  location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/')
                    ? 'bg-[var(--primary)] text-slate-900 shadow-md shadow-[var(--primary-glow)]/20'
                    : 'text-[#94a3b8] hover:bg-[var(--primary-glow)]/[0.06] hover:text-[var(--primary)]'
                }`}
                onClick={() => { setIsMobileMenuOpen(false); navigate('/dashboard'); }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                </svg>
                <span>Products</span>
              </div>

              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ${
                  location.pathname === '/orders'
                    ? 'bg-[var(--primary)] text-slate-900 shadow-md shadow-[var(--primary-glow)]/20'
                    : 'text-[#94a3b8] hover:bg-[var(--primary-glow)]/[0.06] hover:text-[var(--primary)]'
                }`}
                onClick={() => { setIsMobileMenuOpen(false); navigate('/orders'); }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>Orders</span>
              </div>

              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ${
                  location.pathname === '/profile'
                    ? 'bg-[var(--primary)] text-slate-900 shadow-md shadow-[var(--primary-glow)]/20'
                    : 'text-[#94a3b8] hover:bg-[var(--primary-glow)]/[0.06] hover:text-[var(--primary)]'
                }`}
                onClick={() => { setIsMobileMenuOpen(false); navigate('/profile'); }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profile</span>
              </div>

              {user?.role === 'admin' && (
                <>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ${
                      location.pathname === '/products'
                        ? 'bg-[var(--primary)] text-slate-900 shadow-md shadow-[var(--primary-glow)]/20'
                        : 'text-[#94a3b8] hover:bg-[var(--primary-glow)]/[0.06] hover:text-[var(--primary)]'
                    }`}
                    onClick={() => { setIsMobileMenuOpen(false); navigate('/products'); }}
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Manage Products</span>
                  </div>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ${
                      location.pathname === '/users'
                        ? 'bg-[var(--primary)] text-slate-900 shadow-md shadow-[var(--primary-glow)]/20'
                        : 'text-[#94a3b8] hover:bg-[var(--primary-glow)]/[0.06] hover:text-[var(--primary)]'
                    }`}
                    onClick={() => { setIsMobileMenuOpen(false); navigate('/users'); }}
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>Manage Users</span>
                  </div>
                </>
              )}
            </nav>

            <div className="mt-auto border-t border-[var(--border-sidebar)] pt-4">
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-red-500/10 hover:text-red-500 w-full"
                onClick={() => { setIsMobileMenuOpen(false); setShowLogoutConfirm(true); }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Log Out</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 bg-[var(--bg-app)] flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="flex justify-between items-center px-4 md:px-8 py-4 md:py-5 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3">
            {/* Hamburger button on mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-base md:text-lg font-bold text-[var(--text-heading)]">{pageTitle}</div>
          </div>
          <div className="flex items-center gap-4">
            {/* Wishlist Indicator */}
            <div 
              className="relative p-2 md:p-2.5 rounded-full border border-[var(--border-color)] hover:border-red-500 text-[var(--text-muted)] hover:text-red-500 cursor-pointer transition-all bg-white/2" 
              onClick={() => setIsWishlistOpen(true)} 
              title="View Wishlist"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                  {wishlistCount}
                </span>
              )}
            </div>

            {/* Cart Indicator */}
            <div 
              className="relative p-2 md:p-2.5 rounded-full border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-muted)] hover:text-[var(--primary)] cursor-pointer transition-all bg-white/2" 
              onClick={() => setIsCartOpen(true)} 
              title="View Cart"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-slate-900 text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                  {cartCount}
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 w-full box-border">
          {children}
        </div>
      </main>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 transition-all duration-300 animate-in fade-in" onClick={() => setIsCartOpen(false)}>
          <div className="fixed top-0 right-0 h-full w-[420px] max-w-full bg-[var(--bg-card)] border-l border-[var(--border-color)] shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-[var(--border-color)] bg-white/1">
              <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-heading)]">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-[var(--primary)]">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Shopping Cart</span>
              </div>
              <button className="text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer text-xl" onClick={() => setIsCartOpen(false)}>
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-muted)] space-y-4">
                  <svg className="w-16 h-16 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <h3 className="font-bold text-sm text-[var(--text-heading)]">Your cart is empty</h3>
                  <p className="text-xs max-w-[240px]">Add some products from the shop catalog to get started.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="flex gap-4 p-4 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl relative group">
                    <img src={item.product.thumbnail} alt={item.product.title} className="w-16 h-16 rounded-lg object-contain bg-white/2 border border-[var(--border-color)] p-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-semibold text-xs text-[var(--text-heading)] truncate pr-4">{item.product.title}</h4>
                        <span className="text-xs font-bold text-[var(--primary)] mt-1 block">₹{item.product.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center border border-[var(--border-color)] rounded bg-white/2 overflow-hidden">
                          <button className="px-2.5 py-0.5 text-xs text-[var(--text-muted)] hover:text-white hover:bg-white/5 cursor-pointer transition-all" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                          <span className="px-3 text-xs font-semibold text-[var(--text-heading)]">{item.quantity}</span>
                          <button className="px-2.5 py-0.5 text-xs text-[var(--text-muted)] hover:text-white hover:bg-white/5 cursor-pointer transition-all" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                        </div>
                        <button className="text-red-500 hover:text-red-400 transition-colors cursor-pointer" onClick={() => removeFromCart(item.product.id)} title="Remove item">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-5 border-t border-[var(--border-color)] bg-white/[0.01] space-y-4">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-[var(--text-muted)]">Subtotal:</span>
                  <span className="text-[var(--text-heading)] font-extrabold text-base">₹{cartTotal.toFixed(2)}</span>
                </div>
                <button className="w-full bg-[var(--primary)] hover:opacity-90 active:scale-95 text-slate-900 font-bold py-3 rounded-lg text-xs cursor-pointer transition-all" onClick={async () => {
                  setIsCartOpen(false);
                  setPaymentSuccess(false);
                  setPaymentError('');
                  setPaymentLoading(false);
                  setCardNumber('');
                  setCardName('');
                  setCardExpiry('');
                  setCardCvv('');
                  setUpiId('');
                  setPaidAmount(0);
                  setShowAddressForm(false);
                  setAddrError('');
                  setCheckoutStep('address');
                  setIsPaymentOpen(true);
                  await fetchAddresses();
                }}>
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isWishlistOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 transition-all duration-300 animate-in fade-in" onClick={() => setIsWishlistOpen(false)}>
          <div className="fixed top-0 right-0 h-full w-[420px] max-w-full bg-[var(--bg-card)] border-l border-[var(--border-color)] shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-[var(--border-color)] bg-white/1">
              <div className="flex items-center gap-2 font-bold text-sm text-red-500">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>My Wishlist</span>
              </div>
              <button className="text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer text-xl" onClick={() => setIsWishlistOpen(false)}>
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {wishlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-muted)] space-y-4">
                  <svg className="w-16 h-16 text-red-500/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <h3 className="font-bold text-sm text-[var(--text-heading)]">Your wishlist is empty</h3>
                  <p className="text-xs max-w-[240px]">Save items you like for later browsing.</p>
                </div>
              ) : (
                wishlist.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl relative group">
                    <img src={item.thumbnail} alt={item.title} className="w-16 h-16 rounded-lg object-contain bg-white/2 border border-[var(--border-color)] p-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-semibold text-xs text-[var(--text-heading)] truncate pr-4">{item.title}</h4>
                        <span className="text-xs font-bold text-[var(--primary)] mt-1 block">₹{item.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <button
                          className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--primary)] hover:opacity-90 active:scale-95 text-slate-900 rounded text-[11px] font-semibold cursor-pointer transition-all"
                          onClick={() => addToCart(item)}
                        >
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5" />
                          </svg>
                          Add to Cart
                        </button>
                        <button className="text-red-500 hover:text-red-400 transition-colors cursor-pointer" onClick={() => toggleWishlist(item)} title="Remove from wishlist">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-[var(--text-heading)]">Confirm Log Out</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">Are you sure you want to end your session? Any items in your cart will remain saved.</p>
            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 py-2 border border-[var(--border-color)] hover:bg-white/5 rounded-md text-xs font-semibold text-[var(--text-main)] cursor-pointer"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  navigate('/logout');
                }}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-semibold cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsPaymentOpen(false)}>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 max-w-md w-full space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {paymentSuccess ? (
              /* Success Screen */
              <div className="text-center py-4 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-[var(--text-heading)]">Payment Successful!</h2>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">Your order has been placed. Thank you for shopping!</p>
                <p className="text-xl font-extrabold text-[var(--primary)]">₹{paidAmount.toFixed(2)}</p>
                {txnId && (
                  <div className="bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-3 py-2 text-[10px] text-[var(--text-muted)] font-mono">
                    Txn ID: {txnId}
                  </div>
                )}
                <button className="w-full bg-[var(--primary)] hover:opacity-90 active:scale-95 text-slate-900 font-bold py-2.5 rounded-lg text-xs cursor-pointer transition-all mt-4" onClick={() => setIsPaymentOpen(false)}>
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-bold text-[var(--text-heading)]">Secure Checkout</h2>
                  <button onClick={() => setIsPaymentOpen(false)} className="text-[var(--text-muted)] hover:text-white transition-colors text-xl cursor-pointer">✕</button>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-0 my-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-slate-900 flex items-center justify-center font-bold text-xs">1</div>
                    <span className="text-xs font-semibold text-[var(--text-heading)]">Address</span>
                  </div>
                  <div className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${checkoutStep === 'payment' ? 'bg-[var(--primary)]' : 'bg-[var(--border-color)]'}`} />
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                      checkoutStep === 'payment'
                        ? 'bg-[var(--primary)] text-slate-900 border-[var(--primary)]'
                        : 'bg-[var(--bg-app)] text-[var(--text-muted)] border-[var(--border-color)]'
                    }`}>2</div>
                    <span className={`text-xs font-semibold ${checkoutStep === 'payment' ? 'text-[var(--text-heading)]' : 'text-[var(--text-muted)]'}`}>Payment</span>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-[var(--primary-glow)]/[0.04] border border-[var(--primary-glow)]/10 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Order Total</p>
                    <p className="text-lg font-extrabold text-[var(--primary)] mt-0.5">₹{cartTotal.toFixed(2)}</p>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] text-right">
                    <p>{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* STEP 1: Address Selection */}
                {checkoutStep === 'address' && (
                  <div className="flex flex-col gap-4">
                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Select Delivery Address</p>

                    {addresses.length === 0 && !showAddressForm && (
                      <div className="text-xs text-[var(--text-muted)] text-center py-4 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl">
                        No saved addresses. Please add one below to continue.
                      </div>
                    )}

                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {addresses.map((addr: any) => (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-3 rounded-xl cursor-pointer border transition-all ${
                            selectedAddressId === addr.id
                              ? 'border-[var(--primary)] bg-[var(--primary-glow)]/[0.04]'
                              : 'border-[var(--border-color)] bg-[var(--bg-app)] hover:border-[var(--text-muted)]'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <strong className="text-xs font-bold text-[var(--text-heading)]">{addr.fullName}</strong>
                            {addr.isDefault === 1 && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-[var(--primary-glow)] text-[var(--primary)] font-bold rounded">DEFAULT</span>
                            )}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
                            {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                            {addr.city}, {addr.state} – {addr.pincode}
                          </div>
                        </div>
                      ))}
                    </div>

                    {!showAddressForm ? (
                      <button
                        onClick={() => setShowAddressForm(true)}
                        className="py-2.5 rounded-lg border-2 border-dashed border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--primary)] font-semibold text-xs cursor-pointer transition-all bg-transparent"
                      >
                        + Add New Address
                      </button>
                    ) : (
                      <div className="flex flex-col gap-3 p-4 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl">
                        <div className="grid grid-cols-2 gap-2">
                          <input className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] transition-all" placeholder="Full Name *" value={addrForm.fullName} onChange={e => setAddrForm({ ...addrForm, fullName: e.target.value })} />
                          <input className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] transition-all" placeholder="Phone *" value={addrForm.phone} onChange={e => setAddrForm({ ...addrForm, phone: e.target.value })} />
                        </div>
                        <input className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] transition-all" placeholder="Address Line 1 *" value={addrForm.addressLine1} onChange={e => setAddrForm({ ...addrForm, addressLine1: e.target.value })} />
                        <input className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] transition-all" placeholder="Address Line 2 (Optional)" value={addrForm.addressLine2} onChange={e => setAddrForm({ ...addrForm, addressLine2: e.target.value })} />
                        <div className="grid grid-cols-2 gap-2">
                          <input className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] transition-all" placeholder="City *" value={addrForm.city} onChange={e => setAddrForm({ ...addrForm, city: e.target.value })} style={{ flex: 1 }} />
                          <input className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] transition-all" placeholder="State *" value={addrForm.state} onChange={e => setAddrForm({ ...addrForm, state: e.target.value })} style={{ flex: 1 }} />
                        </div>
                        <input className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] transition-all" placeholder="Pincode *" value={addrForm.pincode} onChange={e => setAddrForm({ ...addrForm, pincode: e.target.value })} style={{ maxWidth: 140 }} />
                        {addrError && <div className="text-red-500 text-[11px] font-semibold">{addrError}</div>}
                        <div className="flex gap-2 justify-end mt-1">
                          <button onClick={() => { setShowAddressForm(false); setAddrError(''); }} className="px-3.5 py-1.5 border border-[var(--border-color)] hover:bg-white/5 rounded-md text-xs font-semibold text-[var(--text-main)] cursor-pointer">Cancel</button>
                          <button onClick={handleAddAddress} disabled={addrLoading} className="px-4 py-1.5 bg-[var(--primary)] text-slate-900 font-bold rounded-md text-xs hover:opacity-90 active:scale-95 disabled:opacity-50 cursor-pointer">{addrLoading ? 'Saving...' : 'Save Address'}</button>
                        </div>
                      </div>
                    )}

                    <button
                      className="w-full bg-[var(--primary)] hover:opacity-90 active:scale-95 text-slate-900 font-bold py-3 rounded-lg text-xs cursor-pointer transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!selectedAddressId}
                      onClick={() => setCheckoutStep('payment')}
                    >
                      Continue to Payment →
                    </button>
                  </div>
                )}

                {/* STEP 2: Payment Details */}
                {checkoutStep === 'payment' && (
                  <div className="flex flex-col gap-4">
                    {/* Selected Address Summary */}
                    {(() => {
                      const selAddr = addresses.find((a: any) => a.id === selectedAddressId);
                      return selAddr ? (
                        <div className="bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl p-3.5 flex justify-between items-center gap-4">
                          <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                            <span className="font-bold text-[var(--text-main)]">{selAddr.fullName}</span> · {selAddr.phone}<br />
                            {selAddr.addressLine1}, {selAddr.city} – {selAddr.pincode}
                          </div>
                          <button onClick={() => setCheckoutStep('address')} className="text-[var(--primary)] hover:underline font-semibold text-xs cursor-pointer whitespace-nowrap">Change</button>
                        </div>
                      ) : null;
                    })()}

                    {/* Payment Method Tabs */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Payment Method</p>
                      <div className="flex gap-2">
                        {(['credit', 'debit', 'upi'] as const).map((m) => (
                          <button
                            key={m}
                            onClick={() => setPaymentMethod(m)}
                            className={`flex-1 py-2 rounded-md border text-xs font-semibold cursor-pointer transition-all ${
                              paymentMethod === m
                                ? 'border-[var(--primary)] bg-[var(--primary-glow)]/[0.08] text-[var(--primary)]'
                                : 'border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-white'
                            }`}
                          >
                            {m === 'credit' ? '💳 Credit' : m === 'debit' ? '🏦 Debit' : '📱 UPI'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Payment Form Fields */}
                    {paymentMethod !== 'upi' ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                            {paymentMethod === 'credit' ? 'Credit' : 'Debit'} Card Number
                          </label>
                          <input
                            type="text"
                            maxLength={19}
                            placeholder="1234 5678 9012 3456"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                            className="w-full px-3.5 py-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] text-xs outline-none focus:border-[var(--primary)] transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Cardholder Name</label>
                          <input
                            type="text"
                            placeholder="John Doe"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] text-xs outline-none focus:border-[var(--primary)] transition-all"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Expiry (MM/YY)</label>
                            <input
                              type="text"
                              maxLength={5}
                              placeholder="MM/YY"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] text-xs outline-none focus:border-[var(--primary)] transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">CVV</label>
                            <input
                              type="password"
                              maxLength={3}
                              placeholder="•••"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] text-xs outline-none focus:border-[var(--primary)] transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">UPI ID</label>
                        <input
                          type="text"
                          placeholder="yourname@upi"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] text-xs outline-none focus:border-[var(--primary)] transition-all"
                        />
                        <p className="text-[10px] text-[var(--text-muted)] mt-1">Enter your UPI ID (e.g. name@okaxis, name@ybl)</p>
                      </div>
                    )}

                    {/* Error Display */}
                    {paymentError && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 text-red-500 text-xs font-semibold">
                        {paymentError}
                      </div>
                    )}

                    {/* Pay Button */}
                    <button
                      className="w-full bg-[var(--primary)] hover:opacity-90 active:scale-[0.98] text-slate-900 font-bold py-3.5 rounded-lg text-xs cursor-pointer transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handlePayment}
                      disabled={paymentLoading}
                    >
                      {paymentLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Pay ₹${cartTotal.toFixed(2)}`
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
