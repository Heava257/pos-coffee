import { create } from 'zustand';
import { getProfile, setProfile as saveProfileToStorage, getPermission, setPermission as savePermissionToStorage } from './profile.store';

export const useProfileStore = create((set) => ({
    profile: getProfile(),
    permissions: getPermission() || [],
    setProfile: (profile) => {
        saveProfileToStorage(profile);
        set({ profile });
    },
    setPermissions: (permissions) => {
        savePermissionToStorage(permissions);
        set({ permissions: Array.isArray(permissions) ? permissions : [] });
    },
    refreshProfile: () => {
        set({ 
            profile: getProfile(),
            permissions: getPermission() || []
        });
    }
}));

// 🔄 CROSS-TAB SYNC
const syncChannel = new BroadcastChannel('auth_sync');
syncChannel.onmessage = (event) => {
    if (event.data === 'REFRESH_STATE') {
        useProfileStore.getState().refreshProfile();
    }
};

export const broadcastRefresh = () => {
    syncChannel.postMessage('REFRESH_STATE');
};
