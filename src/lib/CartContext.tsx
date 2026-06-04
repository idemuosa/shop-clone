import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { PYTHON_API_URL } from './api';

export interface CartItem {
  id: string;
  name: string;
  price: string;
  priceValue: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  syncWithBackend: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isOpen, setIsOpen] = useState(false);

  // Sync to localStorage on any change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));

    // Sync to backend if user is logged in
    const syncTimeout = setTimeout(async () => {
      if (user) {
        try {
          const token = await user.getIdToken();
          await fetch(`${PYTHON_API_URL}/api/cart/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(items)
          });
        } catch (e) {
          console.error("Auto-sync failed", e);
        }
      }
    }, 2000); // Debounce sync to backend

    return () => clearTimeout(syncTimeout);
  }, [items, user]);

  // Sync with backend on login
  useEffect(() => {
    if (user) {
      syncWithBackend();
    }
  }, [user]);

  const syncWithBackend = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();

      // 1. Fetch backend cart
      const response = await fetch(`${PYTHON_API_URL}/api/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const backendCart = await response.json();
        const backendItems: CartItem[] = backendCart.items.map((item: any) => ({
          id: item.product_id,
          name: item.name,
          price: item.price,
          priceValue: item.price_value,
          image: item.image,
          quantity: item.quantity
        }));

        // Merge logic: Combine local items with backend items
        if (items.length > 0) {
          const mergedItems = [...backendItems];

          items.forEach(localItem => {
            const existingIndex = mergedItems.findIndex(bi => bi.id === localItem.id);
            if (existingIndex > -1) {
              mergedItems[existingIndex].quantity += localItem.quantity;
            } else {
              mergedItems.push(localItem);
            }
          });

          setItems(mergedItems);

          await fetch(`${PYTHON_API_URL}/api/cart/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(mergedItems)
          });
        } else if (backendItems.length > 0) {
          setItems(backendItems);
        }
      }
    } catch (error) {
      console.error("Failed to sync cart:", error);
    }
  };

  const addToCart = (product: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      let newItems;
      if (existing) {
        newItems = prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i);
      } else {
        newItems = [...prev, { ...product, quantity }];
      }
      return newItems;
    });
  };

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce((acc, item) => acc + (item.priceValue * item.quantity), 0);

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      totalItems,
      totalPrice,
      isOpen,
      setIsOpen,
      syncWithBackend
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
