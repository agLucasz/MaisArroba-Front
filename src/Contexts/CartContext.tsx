import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { type ProdutoDTO } from '../Services/produtoService';

export interface CartItem {
  produto: ProdutoDTO;
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  addItem: (produto: ProdutoDTO, qty: number) => void;
  removeItem: (produtoId: number) => void;
  updateQty: (produtoId: number, qty: number) => void;
  clearCart: () => void;
}

const CART_KEY = 'mais-arroba-cart';

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  const addItem = useCallback((produto: ProdutoDTO, qty: number) => {
    setItems(prev => {
      const existing = prev.find(i => i.produto.produtoId === produto.produtoId);
      if (existing) {
        return prev.map(i =>
          i.produto.produtoId === produto.produtoId ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { produto, qty }];
    });
  }, []);

  const removeItem = useCallback((produtoId: number) => {
    setItems(prev => prev.filter(i => i.produto.produtoId !== produtoId));
  }, []);

  const updateQty = useCallback((produtoId: number, qty: number) => {
    if (qty < 1) return;
    setItems(prev => prev.map(i => i.produto.produtoId === produtoId ? { ...i, qty } : i));
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_KEY);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, totalItems, addItem, removeItem, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
