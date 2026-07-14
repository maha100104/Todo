import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { showToast } from '../utils/toast';

export interface CartItem {
  product: any;
  quantity: number;
}

interface StoreContextType {
  cart: CartItem[];
  wishlist: any[];
  addToCart: (product: any) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  toggleWishlist: (product: any) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  clearCart: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, fetchWithAuth } = useAuth();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);

  // Load user-specific cart and wishlist from backend when user/fetchWithAuth changes
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          // Fetch Wishlist
          const wlRes = await fetchWithAuth('/wishlist');
          if (wlRes.ok) {
            const wlData = await wlRes.json();
            const mappedWishlist = wlData.map((item: any) => item.product);
            setWishlist(mappedWishlist);
          }

          // Fetch Cart
          const cartRes = await fetchWithAuth('/cart');
          if (cartRes.ok) {
            const cartData = await cartRes.json();
            const mappedCart = cartData.map((item: any) => ({
              product: item.product,
              quantity: item.quantity
            }));
            setCart(mappedCart);
          }
        } catch (err) {
          console.error("Error loading cart/wishlist from backend:", err);
        }
      };
      loadData();
    } else {
      setCart([]);
      setWishlist([]);
    }
  }, [user, fetchWithAuth]);

  const addToCart = async (product: any) => {
    try {
      const res = await fetchWithAuth('/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: 1 })
      });
      if (res.ok) {
        setCart((prevCart) => {
          const existing = prevCart.find((item) => item.product.id === product.id);
          if (existing) {
            return prevCart.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          }
          return [...prevCart, { product, quantity: 1 }];
        });
        showToast.success(`${product.title} added to cart!`);
      } else {
        showToast.error(`Failed to add ${product.title} to cart.`);
      }
    } catch (err) {
      console.error(err);
      showToast.error('Network error while adding to cart.');
    }
  };

  const removeFromCart = async (productId: number) => {
    const item = cart.find((i) => i.product.id === productId);
    try {
      const res = await fetchWithAuth(`/cart/${productId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
        if (item) {
          showToast.custom(`${item.product.title} removed from cart.`, '🗑️');
        }
      } else {
        showToast.error('Failed to remove item from cart.');
      }
    } catch (err) {
      console.error(err);
      showToast.error('Network error while removing from cart.');
    }
  };

  const clearCart = async () => {
    try {
      const res = await fetchWithAuth('/cart/clear', {
        method: 'DELETE'
      });
      if (res.ok) {
        setCart([]);
      } else {
        showToast.error('Failed to clear cart on server.');
      }
    } catch (err) {
      console.error(err);
      showToast.error('Network error while clearing cart.');
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    try {
      const res = await fetchWithAuth(`/cart/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
      });
      if (res.ok) {
        setCart((prevCart) =>
          prevCart.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          )
        );
      } else {
        showToast.error('Failed to update quantity.');
      }
    } catch (err) {
      console.error(err);
      showToast.error('Network error while updating quantity.');
    }
  };

  const toggleWishlist = async (product: any) => {
    const isPresent = wishlist.some((item) => item.id === product.id);
    try {
      if (isPresent) {
        const res = await fetchWithAuth(`/wishlist/${product.id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setWishlist((prev) => prev.filter((item) => item.id !== product.id));
          showToast.custom(`${product.title} removed from wishlist.`, '💔');
        } else {
          showToast.error('Failed to remove from wishlist.');
        }
      } else {
        const res = await fetchWithAuth(`/wishlist/${product.id}`, {
          method: 'POST'
        });
        if (res.ok) {
          setWishlist((prev) => [...prev, product]);
          showToast.success(`${product.title} added to wishlist!`);
        } else {
          showToast.error('Failed to add to wishlist.');
        }
      }
    } catch (err) {
      console.error(err);
      showToast.error('Network error while updating wishlist.');
    }
  };

  const isInWishlist = (productId: number) => {
    return wishlist.some((item) => item.id === productId);
  };

  return (
    <StoreContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleWishlist,
        isInWishlist,
        clearCart,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
