import { create } from "zustand";
import type {
  Offer,
  CreateOfferPayload,
  UpdateOfferPayload,
  OfferExportPayload,
} from "./types";

type CreateOfferResult = {
  offer: Offer;
  exportPayload: OfferExportPayload | null;
};

interface OffersStore {
  offers: Offer[];
  isLoading: boolean;
  selectedOffer: Offer | null;

  loadOffers: () => Promise<void>;
  createOffer: (payload: CreateOfferPayload) => Promise<CreateOfferResult | null>;
  updateOffer: (id: string, payload: UpdateOfferPayload) => Promise<Offer | null>;
  deleteOffer: (id: string) => Promise<boolean>;
  selectOffer: (offer: Offer | null) => void;
}

export const useOffersStore = create<OffersStore>((set) => ({
  offers: [],
  isLoading: false,
  selectedOffer: null,

  loadOffers: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/offers");
      if (!res.ok) throw new Error("Failed to load offers");
      const data = await res.json();
      set({ offers: data.offers || [], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createOffer: async (payload) => {
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;

      const data = await res.json();
      const offer = data.offer as Offer;
      set((state) => ({ offers: [offer, ...state.offers] }));

      return {
        offer,
        exportPayload: (data.export_payload as OfferExportPayload | undefined) || null,
      };
    } catch {
      return null;
    }
  },

  updateOffer: async (id, payload) => {
    try {
      const res = await fetch(`/api/offers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;

      const data = await res.json();
      const offer = data.offer as Offer;
      set((state) => ({
        offers: state.offers.map((o) => (o.id === id ? offer : o)),
        selectedOffer: state.selectedOffer?.id === id ? offer : state.selectedOffer,
      }));
      return offer;
    } catch {
      return null;
    }
  },

  deleteOffer: async (id) => {
    try {
      const res = await fetch(`/api/offers/${id}`, { method: "DELETE" });
      if (!res.ok) return false;

      set((state) => ({
        offers: state.offers.filter((o) => o.id !== id),
        selectedOffer: state.selectedOffer?.id === id ? null : state.selectedOffer,
      }));
      return true;
    } catch {
      return false;
    }
  },

  selectOffer: (offer) => set({ selectedOffer: offer }),
}));
