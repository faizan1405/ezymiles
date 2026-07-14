"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/config/site";

/* -------------------------------- Currency -------------------------------- */

interface PreferencesState {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  hydrated: boolean;
  setHydrated: () => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      currency: DEFAULT_CURRENCY,
      setCurrency: (currency) => set({ currency }),
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "ezymiles.preferences",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ currency: s.currency }) as PreferencesState,
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

/* -------------------------------- Wishlist -------------------------------- */
/**
 * Guests keep a wishlist in localStorage; signed-in travellers get it persisted
 * to their account. `sync()` merges the two after login.
 */
interface WishlistState {
  ids: string[];
  hydrated: boolean;
  toggle: (id: string) => boolean;
  has: (id: string) => boolean;
  set: (ids: string[]) => void;
  setHydrated: () => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      hydrated: false,
      toggle: (id) => {
        const exists = get().ids.includes(id);
        set({ ids: exists ? get().ids.filter((x) => x !== id) : [...get().ids, id] });
        return !exists;
      },
      has: (id) => get().ids.includes(id),
      set: (ids) => set({ ids: Array.from(new Set(ids)) }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "ezymiles.wishlist",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ ids: s.ids }) as WishlistState,
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

/* ---------------------------- Recently viewed ----------------------------- */

interface RecentState {
  slugs: string[];
  push: (slug: string) => void;
}

export const useRecentlyViewed = create<RecentState>()(
  persist(
    (set, get) => ({
      slugs: [],
      push: (slug) =>
        set({ slugs: [slug, ...get().slugs.filter((s) => s !== slug)].slice(0, 8) }),
    }),
    { name: "ezymiles.recent", storage: createJSONStorage(() => localStorage) },
  ),
);
