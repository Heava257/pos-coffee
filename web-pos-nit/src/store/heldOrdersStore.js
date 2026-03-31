import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useHeldOrdersStore = create(
  persist(
    (set, get) => ({
      heldOrders: [],
      
      holdOrder: (orderData) => {
        const { id, ...data } = orderData;
        const newOrder = {
          ...data,
          id: id || Date.now(),
          heldAt: new Date().toISOString(),
        };
        
        set((state) => {
          const exists = state.heldOrders.find((o) => o.id === id);
          if (exists) {
            return {
              heldOrders: state.heldOrders.map((o) => o.id === id ? newOrder : o),
            };
          }
          return {
            heldOrders: [newOrder, ...state.heldOrders],
          };
        });

      },
      
      resumeOrder: (id) => {
        const order = get().heldOrders.find((o) => o.id === id);
        // We DON'T remove it automatically if we want to allow "Update" 
        // But usually, resume means we take it out of the drawer.
        // Let's keep it simple: resume removes it, but we track its ID in the page state.
        if (order) {
          set((state) => ({
            heldOrders: state.heldOrders.filter((o) => o.id !== id),
          }));
        }
        return order;
      },
      
      removeHeldOrder: (id) => {
        set((state) => ({
          heldOrders: state.heldOrders.filter((o) => o.id !== id),
        }));
      },
      
      clearAllHeldOrders: () => {
        set({ heldOrders: [] });
      },
    }),
    {
      name: "held-orders-storage",
    }
  )
);

