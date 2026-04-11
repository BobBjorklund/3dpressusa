"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { CartItem, CapPricingType } from "@/lib/storefront/pricing-config";
import { calculateCart } from "@/lib/storefront/pricing";

export type CartEntry = {
  id: string;             // slug — dedup key and CartItem.id
  slug: string;
  type: "cap" | "cover";
  quantity: number;
  pricingType?: CapPricingType;
  highDetail?: boolean;
  name: string;
};

type CartContextValue = {
  entries: CartEntry[];
  addItem: (entry: Omit<CartEntry, "id">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, delta: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  itemCount: number;
  subtotal: number;       // dollars, from calculateCart
  cartItems: CartItem[];  // stripped to CartItem shape for checkout API
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "3dpressusa-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<CartEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setEntries(JSON.parse(stored));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries, hydrated]);

  function addItem(entry: Omit<CartEntry, "id">) {
    const id = entry.slug;
    setEntries((prev) => {
      const existing = prev.find((e) => e.id === id);
      if (existing) {
        return prev.map((e) =>
          e.id === id ? { ...e, quantity: e.quantity + entry.quantity } : e
        );
      }
      return [...prev, { ...entry, id }];
    });
  }

  function removeItem(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function updateQty(id: string, delta: number) {
    setEntries((prev) =>
      prev
        .map((e) => (e.id === id ? { ...e, quantity: e.quantity + delta } : e))
        .filter((e) => e.quantity > 0)
    );
  }

  function clearCart() {
    setEntries([]);
  }

  const cartItems: CartItem[] = entries.map((e) => ({
    id: e.id,
    type: e.type,
    quantity: e.quantity,
    pricingType: e.pricingType,
    highDetail: e.highDetail,
  }));

  const { subtotal } = entries.length > 0 ? calculateCart(cartItems) : { subtotal: 0 };
  const itemCount = entries.reduce((sum, e) => sum + e.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        entries,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        itemCount,
        subtotal,
        cartItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
