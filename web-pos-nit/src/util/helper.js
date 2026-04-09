import axios from "axios";
import { Config } from "./config";
import { setServerSatus } from "../store/server.store";
import { getAcccessToken, getPermission } from "../store/profile.store";
import dayjs from "dayjs";
import { message } from "antd";

export const request = (url = "", method = "get", data = {}) => {
  var access_token = getAcccessToken();

  // Skip requests that require auth if token is missing (except login/register)
  const isAuthRoute =
    url.includes("auth/login") ||
    url.includes("auth/register") ||
    url.includes("auth/register-owner") ||
    url.includes("auth/guest-access");
  if (!isAuthRoute && (!access_token || access_token === "null" || access_token === "undefined")) {
    return Promise.resolve(false);
  }

  // in react
  var headers = { "Content-Type": "application/json" };
  if (data instanceof FormData) {
    // check if param data is FormData
    headers = { "Content-Type": "multipart/form-data" };
  }
  var param_query = "?";
  if (method == "get" && data instanceof Object) {
    Object.keys(data).map((key, index) => {
      if (data[key] != "" && data[key] != null) {
        param_query += "&" + key + "=" + data[key];
      }
    });
  }
  const config_req = {
    url: Config.base_url + url,
    method: method,
    headers: {
      ...headers,
    },
  };

  if (access_token && access_token !== "null" && access_token !== "undefined") {
    config_req.headers.Authorization = "Bearer " + access_token;
  }

  if (method.toLowerCase() === "get" || method.toLowerCase() === "delete") {
    config_req.params = data;
  } else {
    config_req.data = data;
  }

  return axios(config_req)
    .then(async (res) => {
      setServerSatus(200);

      // 🛡️ SILENT PERMISSION RE-SYNC
      // If backend detects a role change, it sends this header
      if (res.headers && res.headers["x-permissions-updated"] === "true" && !url.includes("auth/profile")) {
        try {
          // Fetch freshest data without going through this interceptor again
          const response = await axios({
            url: Config.base_url + "auth/profile",
            method: "get",
            headers: { "Authorization": "Bearer " + access_token }
          });
          
          if (response.data && response.data.profile) {
            const { setProfile, setPermission } = await import("../store/profile.store");
            // Update local storage
            setProfile(response.data.profile);
            setPermission(response.data.permission);
            // console.log("✅ Security session synchronized automatically.");
            
            // Note: Menu/Sidebar should ideally listen to this change. 
            // In our current MainLayout, it depends on location.pathname.
            // We'll trigger a small state change or just reload once to be safe if no reactive store.
          }
        } catch (e) {
          console.error("Failed to sync permissions:", e);
        }
      }

      return res.data;
    })
    .catch((err) => {
      var response = err.response;
      if (response) {
        var status = response.status;
        if (status == 401) {
          // Clear session and redirect to login only on Unauthorized
          localStorage.removeItem("access_token");
          localStorage.removeItem("profile");
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
        if (status == 403) {
          message.error("Access Denied: You don't have permission for this action.");
        }
        setServerSatus(status);
        // Important: Return the response data so caller can see { message: "..." }
        return { ...response.data, error: true, status: status };
      } else if (err.code == "ERR_NETWORK") {
        setServerSatus("error");
      }
      console.log(">>>", err);
      return { error: true, message: err.message || "Network Error" };
    });
};

export const formatDateClient = (date, format = "DD/MM/YYYY") => {
  if (date) return dayjs(date).format(format);
  return null;
};

export const formatDateServer = (date, format = "YYYY-MM-DD") => {
  if (date) return dayjs(date).format(format);
  return null;
};

export const isPermission = (permission_name) => {
  const permision = getPermission();
  const findPermission = permision?.findIndex(
    (item) => item.name == permission_name
  );
  if (findPermission != -1) {
    return true;
  }
  return false;
}


export const updateSize = (itemId, sizeValue, availableSizes) => {
  const selectedSize = availableSizes.find(s => s.value === sizeValue);
  setItemSizes(prev => ({
    ...prev,
    [itemId]: selectedSize
  }));
};

export const updateAddons = (itemId, addonValue, checked, availableAddons) => {
  const addon = availableAddons.find(a => a.value === addonValue);
  setItemAddons(prev => ({
    ...prev,
    [itemId]: checked
      ? [...(prev[itemId] || []), addon]
      : (prev[itemId] || []).filter(a => a.value !== addonValue)
  }));
};




export const getIconForCategory = (name) => {
  if (!name) return '🍽️';
  const lowerName = name.toLowerCase();
  
  // Restaurant & Food (New)
  if (lowerName.includes('seafood') || lowerName.includes('គ្រឿងសមុទ្រ')) return '🦞';
  if (lowerName.includes('soup') || lowerName.includes('សម្ល')) return '🥣';
  if (lowerName.includes('stir-fry') || lowerName.includes('ម្ហូបឆា')) return '🍳';
  if (lowerName.includes('roasted') || lowerName.includes('deep-fried') || lowerName.includes('បំពង')) return '🍗';
  if (lowerName.includes('salad') || lowerName.includes('spicy') || lowerName.includes('ញាំ')) return '🥗';
  if (lowerName.includes('dessert') || lowerName.includes('បង្អែម')) return '🍰';
  if (lowerName.includes('drink') || lowerName.includes('ភេសជ្ជៈ')) return '🥤';

  // Pharmacy 
  if (lowerName.includes('medicine') || lowerName.includes('ថ្នាំ')) return '💊';
  if (lowerName.includes('antibiotics') || lowerName.includes('ថ្នាំផ្សះ')) return '🦠';
  if (lowerName.includes('supplement') || lowerName.includes('vitamin') || lowerName.includes('វីតាមីន')) return '🧪';
  if (lowerName.includes('skincare') || lowerName.includes('care') || lowerName.includes('ថែរក្សា')) return '🧴';
  if (lowerName.includes('medical') || lowerName.includes('equipment') || lowerName.includes('ឧបករណ៍')) return '🩺';
  if (lowerName.includes('baby') || lowerName.includes('mom') || lowerName.includes('ម្តាយ')) return '👶';
  if (lowerName.includes('first aid') || lowerName.includes('សង្គ្រោះ')) return '🩹';

  // Cafe/Food
  if (lowerName.includes('coffee')) return '☕';
  if (lowerName.includes('juice')) return '🧃';
  if (lowerName.includes('milk')) return '🥛';
  if (lowerName.includes('snack')) return '🍪';
  if (lowerName.includes('rice')) return '🍚';
  
  return '🍽️';
};

export const getColorForCategory = (name) => {
  if (!name) return '#ff6b35';
  const lowerName = name.toLowerCase();

  // Restaurant & Food Colors
  if (lowerName.includes('seafood') || lowerName.includes('គ្រឿងសមុទ្រ')) return '#13c2c2'; 
  if (lowerName.includes('soup') || lowerName.includes('សម្ល')) return '#1890ff';
  if (lowerName.includes('stir-fry') || lowerName.includes('ម្ហូបឆា')) return '#fa541c';
  if (lowerName.includes('roasted') || lowerName.includes('deep-fried') || lowerName.includes('បំពង')) return '#faad14';
  if (lowerName.includes('salad') || lowerName.includes('spicy') || lowerName.includes('ញាំ')) return '#52c41a';
  if (lowerName.includes('dessert') || lowerName.includes('បង្អែម')) return '#eb2f96';
  if (lowerName.includes('drink') || lowerName.includes('ភេសជ្ជៈ')) return '#597ef7';

  // Pharmacy Colors
  if (lowerName.includes('medicine') || lowerName.includes('ថ្នាំ')) return '#13c2c2';
  if (lowerName.includes('antibiotics') || lowerName.includes('ថ្នាំផ្សះ')) return '#f5222d'; 
  if (lowerName.includes('supplement') || lowerName.includes('vitamin')) return '#eb2f96';
  if (lowerName.includes('skincare') || lowerName.includes('care')) return '#faad14';
  if (lowerName.includes('medical') || lowerName.includes('equipment')) return '#0958d9';
  if (lowerName.includes('baby') || lowerName.includes('mom')) return '#2f54eb';

  // Cafe/Food Colors
  if (lowerName.includes('coffee')) return '#8B4513';
  if (lowerName.includes('juice')) return '#4CAF50';
  if (lowerName.includes('milk')) return '#2196F3';
  if (lowerName.includes('snack')) return '#FF9800';
  if (lowerName.includes('rice')) return '#E91E63';
  
  return '#ff6b35';
};

//   export const getIconForCategory = (categoryName) => {
//   const iconMap = {
//     'Coffee': '☕',
//     'Juice': '🧃',
//     'Milk Based': '🥛',
//     'Snack': '🍪',
//     'Rice': '🍚',
//     'Dessert': '🍰',
//   };
//   return iconMap[categoryName] || '📁';
// };

// export const getColorForCategory = (categoryName) => {
//   const colorMap = {
//     'Coffee': '#8B4513',
//     'Juice': '#4CAF50',
//     'Milk Based': '#2196F3',
//     'Snack': '#FF9800',
//     'Rice': '#E91E63',
//     'Dessert': '#9C27B0',
//   };
//   return colorMap[categoryName] || '#666666';
// };

export const compressImage = (file, maxWidth = 1024) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, "image/jpeg", 0.7); // 0.7 quality is perfect for receipts/products
      };
    };
  });
};

export const formatNumber = (num, decimals = 2) => {
  return Number(num || 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};
