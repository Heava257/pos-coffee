import { create } from 'zustand';
import { request } from '@/shared/utils/helper';

export const useShiftStore = create((set, get) => ({
    currentShift: null,
    loading: false,

    // Fetch current open shift for logged in user
    fetchCurrentShift: async () => {
        set({ loading: true });
        try {
            const res = await request("shift/current", "get");
            if (res && res.success) {
                set({ currentShift: res.data, loading: false });
                return res.data;
            }
        } catch (error) {
            console.error("Error fetching shift:", error);
        }
        set({ currentShift: null, loading: false });
        return null;
    },

    // Open a new shift
    openShift: async (openingCashUSD, openingCashKHR) => {
        set({ loading: true });
        try {
            const res = await request("shift/open", "post", {
                opening_cash_usd: openingCashUSD,
                opening_cash_khr: openingCashKHR
            });
            if (res && res.success) {
                await get().fetchCurrentShift();
                return { success: true, message: res.message };
            }
            return { success: false, message: res?.message || "Failed to open shift" };
        } catch (error) {
            return { success: false, message: error.message };
        } finally {
            set({ loading: false });
        }
    },

    // Close shift
    closeShift: async (shiftData) => {
        set({ loading: true });
        try {
            const res = await request("shift", "post", shiftData);
            if (res && res.success) {
                set({ currentShift: null, loading: false });
                return { success: true, message: res.message };
            }
            return { success: false, message: res?.message || "Failed to close shift" };
        } catch (error) {
            return { success: false, message: error.message };
        } finally {
            set({ loading: false });
        }
    }
}));
