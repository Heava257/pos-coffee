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
        // FOR RESTAURANT: We DON'T remove it automatically on resume!
        // We only remove it when it is PAID or manually deleted.
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

