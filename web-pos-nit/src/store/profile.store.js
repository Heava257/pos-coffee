export const setAcccessToken = (value) => {
  localStorage.setItem("access_token", value);
};
export const getAcccessToken = () => {
  return localStorage.getItem("access_token");
};

// --- GUEST SESSION (To avoid conflict with Staff) ---
export const setGuestToken = (value) => {
  localStorage.setItem("guest_access_token", value);
};
export const getGuestToken = () => {
  return localStorage.getItem("guest_access_token");
};
export const setGuestProfile = (value) => {
  localStorage.setItem("guest_profile", JSON.stringify(value));
};
export const getGuestProfile = () => {
  try {
    var profile = localStorage.getItem("guest_profile");
    if (profile && profile !== "undefined") return JSON.parse(profile);
    return null;
  } catch (err) { return null; }
};

export const setGuestPermission = (array) => {
  localStorage.setItem("guest_permission", JSON.stringify(array));
};
export const getGuestPermission = () => {
  try {
    var permission = localStorage.getItem("guest_permission");
    if (permission) return JSON.parse(permission);
    return null;
  } catch (err) { return null; }
};

export const setProfile = (value) => {
  localStorage.setItem("profile", JSON.stringify(value));
};
export const getProfile = () => {
  try {
    var profile = localStorage.getItem("profile");
    if (profile !== "" && profile !== null && profile !== undefined) {
      return JSON.parse(profile);
    }
    return null;
  } catch (err) {
    return null;
  }
};
export const setPermission = (array) => {
  localStorage.setItem("permission", JSON.stringify(array));
};
export const getPermission = () => {
  try {
    var permission = localStorage.getItem("permission");
    if (permission !== "" && permission !== null && permission !== undefined) {
      return JSON.parse(permission);
    }
    return null;
  } catch (err) {
    return null;
  }
};
export const setUserId = (id) => {
  localStorage.setItem("user_id", id);
};
export const getUserId = () => {
  const userId = localStorage.getItem("user_id");
  return userId ? Number(userId) : null;
};

export const setLogout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("profile");
  localStorage.removeItem("permission");
  localStorage.removeItem("user_id");
};