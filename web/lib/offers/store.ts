import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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

type CreateOfferError = {
  error: string;
};

export interface ManualOfferDraft {
  recipientMode: "employee" | "manual";
  selectedEmployeeId: string;
  recipientName: string;
  recipientEmail: string;
  manualOfferValue: string;
  manualRoleTitle: string;
  manualLevelName: string;
  manualLocationCity: string;
  manualLocationCountry: string;
  manualCurrency: string;
  offerTarget: number;
  updatedAt: number;
}

export const EMPTY_MANUAL_DRAFT: ManualOfferDraft = {
  recipientMode: "manual",
  selectedEmployeeId: "",
  recipientName: "",
  recipientEmail: "",
  manualOfferValue: "",
  manualRoleTitle: "",
  manualLevelName: "",
  manualLocationCity: "",
  manualLocationCountry: "",
  manualCurrency: "SAR",
  offerTarget: 50,
  updatedAt: 0,
};

interface OffersStore {
  offers: Offer[];
  isLoading: boolean;
  selectedOffer: Offer | null;
  manualDraft: ManualOfferDraft;

  loadOffers: () => Promise<void>;
  createOffer: (payload: CreateOfferPayload) => Promise<CreateOfferResult | CreateOfferError>;
  updateOffer: (id: string, payload: UpdateOfferPayload) => Promise<Offer | null>;
  deleteOffer: (id: string) => Promise<boolean>;
  selectOffer: (offer: Offer | null) => void;
  setManualDraft: (patch: Partial<ManualOfferDraft>) => void;
  clearManualDraft: () => void;
}

export const useOffersStore = create<OffersStore>()(
  persist(
    (set) => ({
      offers: [],
      isLoading: false,
      selectedOffer: null,
      manualDraft: EMPTY_MANUAL_DRAFT,

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

          const data = await res.json();

          if (!res.ok) {
            return { error: data?.error || "Failed to create offer." };
          }

          const offer = data.offer as Offer;
          set((state) => ({ offers: [offer, ...state.offers] }));

          return {
            offer,
            exportPayload: (data.export_payload as OfferExportPayload | undefined) || null,
          };
        } catch {
          return { error: "Network error. Please try again." };
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

      setManualDraft: (patch) =>
        set((state) => ({
          manualDraft: { ...state.manualDraft, ...patch, updatedAt: Date.now() },
        })),

      clearManualDraft: () => set({ manualDraft: EMPTY_MANUAL_DRAFT }),
    }),
    {
      name: "qeemly-offers-store",
      storage: createJSONStorage(() => localStorage),
      // Only persist the manual draft. Offers are loaded from the API on demand.
      partialize: (state) => ({ manualDraft: state.manualDraft }),
    },
  ),
);
