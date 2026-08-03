"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";

// Standard "click add → show a checkmark for a beat → open the cart drawer"
// behavior shared by every add-to-cart control in the app (AddToCartButton,
// AddCoverButton, GetAsCoastersButton, TruckGuyColorSelector). Callers add
// the item to the cart themselves, then call flash().
export function useAddedFlash() {
  const { openCart } = useCart();
  const [added, setAdded] = useState(false);

  function flash() {
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      openCart();
    }, 800);
  }

  return { added, flash };
}
