import axios from "axios";
import { Config } from "@/shared/utils/config";
import { setServerSatus } from "@/app/store/server.store";
import { getAcccessToken, getPermission, getGuestToken, setLogout } from "@/app/store/profile.store";
import { useLanguage, translations } from "@/app/store/language.store";
import Swal from "sweetalert2"; // Import SweetAlert2 for premium modals
import dayjs from "dayjs";
import { message } from "antd";

/**
 * Global API Error Alert Handler using SweetAlert2 Modals (EN/KH)
 * Displays actual error reasons translated into the selected language in a premium pop-up.
 */
export const alertAPIError = (err) => {
  const activeLang = useLanguage.getState().lang || "en";
  const t = translations[activeLang] || translations["en"];
  const okText = activeLang === "kh" ? "យល់ព្រម" : "Ok";

  const response = err.response;
  if (response) {
    const status = response.status;

    // 1. Parse structured validation errors array (CRUD validation)
    if (response.data && Array.isArray(response.data.errors)) {
      let errorListHTML = '<ul style="text-align: left; margin: 15px 0 0 0; padding-left: 20px; font-family: inherit;">';
      
      response.data.errors.forEach((e) => {
        const fieldName = t[e.field] || e.field;
        let msg = e.message;

        if (activeLang === "kh") {
          if (msg.includes("is required") || msg.includes("required")) {
            msg = `សូមបញ្ចូល ${fieldName}`;
          } else if (msg.includes("must be a valid email")) {
            msg = `${fieldName} ត្រូវតែជាអុីមែលត្រឹមត្រូវ`;
          } else if (msg.includes("must be 8") || msg.includes("8-128")) {
            msg = `${fieldName} ត្រូវតែមានប្រវែងពី ៨ ទៅ ១២៨ តួអក្សរ`;
          } else if (msg.includes("uppercase letter")) {
            msg = `${fieldName} ត្រូវតែមានអក្សរធំយ៉ាងតិច ១ តួ`;
          } else if (msg.includes("at least one number") || msg.includes("one number")) {
            msg = `${fieldName} ត្រូវតែមានលេខយ៉ាងតិច ១ តួ`;
          } else if (msg.includes("special character")) {
            msg = `${fieldName} ត្រូវតែមាននិមិត្តសញ្ញាពិសេសយ៉ាងតិច ១ តួ`;
          } else if (msg.includes("PIN must be")) {
            msg = `PIN ត្រូវតែមានពី ៤ ទៅ ៦ ខ្ទង់`;
          } else if (msg.includes("already in use") || msg.includes("already exists")) {
            msg = `${fieldName} នេះត្រូវបានប្រើប្រាស់រួចហើយ`;
          } else if (msg.includes("must be a number") || msg.includes("must be an integer") || msg.includes("must be decimal")) {
            msg = `${fieldName} ត្រូវតែជាលេខ`;
          } else if (msg.includes("must be a string")) {
            msg = `${fieldName} ត្រូវតែជាអក្សរ`;
          }
        }
        errorListHTML += `<li style="margin-bottom: 8px; color: #4b5563; font-size: 14px; line-height: 1.5;">${msg}</li>`;
      });
      
      errorListHTML += '</ul>';

      // Show high-fidelity validation modal
      Swal.fire({
        icon: 'error',
        title: activeLang === "kh" ? "បញ្ហាក្នុងការបញ្ជាក់ទិន្នន័យ" : "Validation Error",
        html: errorListHTML,
        confirmButtonText: okText,
        confirmButtonColor: '#1e4a2d', // Coffee theme color
        customClass: {
          popup: 'rounded-2xl',
        }
      });
      return;
    }

    // 2. Parse general error responses (database constraints, business logic)
    const rawError = response.data?.message || response.data?.error || "Operation failed";
    let finalMessage = rawError;

    if (activeLang === "kh") {
      if (rawError === "Password incorrect!") {
        finalMessage = "លេខសម្ងាត់មិនត្រឹមត្រូវទេ!";
      } else if (rawError === "Account not found or incorrect email!") {
        finalMessage = "រកមិនឃើញគណនី ឬអុីមែលមិនត្រឹមត្រូវទេ!";
      } else if (rawError === "Your business account is suspended!") {
        finalMessage = "គណនីអាជីវកម្មរបស់អ្នកត្រូវបានផ្អាក!";
      } else if (rawError === "Your account has been deactivated. Please contact your administrator.") {
        finalMessage = "គណនីរបស់អ្នកត្រូវបានបិទ។ សូមទាក់ទងអ្នកគ្រប់គ្រង។";
      } else if (rawError === "User not found!") {
        finalMessage = "រកមិនឃើញអ្នកប្រើប្រាស់ទេ!";
      } else if (rawError === "Access denied.") {
        finalMessage = "គ្មានសិទ្ធិចូលប្រើប្រាស់ទេ!";
      } else if (rawError === "Authorized personnel only!") {
        finalMessage = "សម្រាប់តែបុគ្គលិកដែលមានសិទ្ធិប៉ុណ្ណោះ!";
      } else if (rawError === "Invalid or expired OTP code!") {
        finalMessage = "កូដ OTP មិនត្រឹមត្រូវ ឬអស់សុពលភាព!";
      } else if (rawError.includes("already exists") || rawError.includes("Duplicate entry")) {
        finalMessage = "ទិន្នន័យនេះមានរួចហើយនៅក្នុងប្រព័ន្ធ។";
      } else if (rawError.includes("not found")) {
        finalMessage = "រកមិនឃើញទិន្នន័យនេះទេ។";
      } else if (rawError.includes("Cannot delete") || rawError.includes("foreign key constraint")) {
        finalMessage = "មិនអាចលុបបានទេ ព្រោះទិន្នន័យនេះកំពុងប្រើប្រាស់ដោយផ្នែកផ្សេងទៀត។";
      }
    }

    const titleText = activeLang === "kh" ? "មានបញ្ហា!" : "Error!";
    
    if (status === 429) {
      let secondsLeft = response.data?.retryAfter || 300;
      
      const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        if (activeLang === "kh") {
          return `${m} នាទី ${s} វិនាទី`;
        }
        return `${m}m ${s}s`;
      };

      Swal.fire({
        icon: 'error',
        title: titleText,
        html: `<div style="font-size: 15px; line-height: 1.6;">
                 ${finalMessage}<br/><br/>
                 <strong style="color: #ef4444; font-size: 18px;" id="swal-rate-limit-timer">${formatTime(secondsLeft)}</strong>
               </div>`,
        showConfirmButton: true,
        confirmButtonText: okText,
        confirmButtonColor: '#1e4a2d',
        customClass: {
          popup: 'rounded-2xl',
        },
        didOpen: () => {
          const timerEl = document.getElementById('swal-rate-limit-timer');
          const interval = setInterval(() => {
            secondsLeft--;
            if (secondsLeft <= 0) {
              clearInterval(interval);
              Swal.close();
            } else if (timerEl) {
              timerEl.textContent = formatTime(secondsLeft);
            }
          }, 1000);

          const popup = Swal.getPopup();
          if (popup) popup._timerInterval = interval;
        },
        willClose: () => {
          const popup = Swal.getPopup();
          const interval = popup ? popup._timerInterval : null;
          if (interval) clearInterval(interval);
        }
      });
      return;
    }
    
    if (status === 403) {
      if (response.data?.error === "BUSINESS_SUSPENDED") return;
      Swal.fire({
        icon: 'error',
        title: titleText,
        text: finalMessage || (activeLang === "kh" ? "ការចូលប្រើត្រូវបានបដិសេធ" : "Access Denied"),
        confirmButtonText: okText,
        confirmButtonColor: '#1e4a2d',
      });
    } else if (status >= 500) {
      Swal.fire({
        icon: 'error',
        title: titleText,
        text: (activeLang === "kh" ? "កំហុសម៉ាស៊ីនមេ៖ " : "Server Error: ") + finalMessage,
        confirmButtonText: okText,
        confirmButtonColor: '#1e4a2d',
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: titleText,
        text: finalMessage,
        confirmButtonText: okText,
        confirmButtonColor: '#1e4a2d',
      });
    }

  } else if (err.code === "ERR_NETWORK") {
    const networkMsg = activeLang === "kh"
      ? "មិនអាចភ្ជាប់ទៅកាន់ម៉ាស៊ីនមេបានទេ។ សូមពិនិត្យមើលថាតើប្រព័ន្ធដំណើរការដែរឬទេ។"
      : "Cannot connect to server. Please check if the backend is running.";
    Swal.fire({
      icon: 'error',
      title: activeLang === "kh" ? "បញ្ហាការភ្ជាប់បណ្តាញ" : "Connection Error",
      text: networkMsg,
      confirmButtonText: okText,
      confirmButtonColor: '#1e4a2d',
    });
  } else {
    const fallbackMsg = err.message || "Something went wrong";
    Swal.fire({
      icon: 'error',
      title: activeLang === "kh" ? "មានបញ្ហា!" : "Error!",
      text: fallbackMsg,
      confirmButtonText: okText,
      confirmButtonColor: '#1e4a2d',
    });
  }
};


export const request = (url = "", method = "get", data = {}) => {
  // 🧠 SMART TOKEN SELECTION: 
  // If we are on a customer-facing route, use the guest token. 
  // Otherwise, use the staff token.
  const isCustomerPath = window.location.pathname.includes("/customer");
  const access_token = isCustomerPath ? getGuestToken() : getAcccessToken();

  // Skip requests that require auth if token is missing (except login/register and public menu)
  const isPublicMenu = isCustomerPath && (url.includes("category") || url.includes("product"));
  const isAuthRoute =
    url.includes("auth/login") ||
    url.includes("auth/register") ||
    url.includes("auth/register-owner") ||
    url.includes("auth/guest-access") ||
    url.includes("auth/verify-email") ||
    url.includes("auth/forgot-password") ||
    url.includes("auth/verify-otp") ||
    url.includes("auth/reset-password") ||
    url.includes("auth/google-login") ||
    url.includes("order-web") ||
    url.includes("business/public-config") ||
    url.includes("plans/public") ||
    url.includes("subscription/packages/public") ||
    url.includes("system-settings/public") ||
    isPublicMenu;

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

  if (method.toLowerCase() === "get") {
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
            const { setProfile, setPermission } = await import("@/app/store/profile.store");
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
        var errorMessage = response.data?.message || response.data?.error || "Operation failed";

        if (status == 401) {
          setLogout();
          if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/register")) {
             window.location.href = "/login";
          }
        }
        
        if (status == 403 && response.data?.error === "BUSINESS_SUSPENDED") {
          setLogout();
          window.location.href = "/login?suspended=true";
          return Promise.reject({ ...response.data, message: errorMessage, error: true, status: status });
        }

        // Call our new unified multi-language error alert handler
        alertAPIError(err);
        
        setServerSatus(status);
        return Promise.reject({ ...response.data, message: errorMessage, error: true, status: status });
      }

      // Handle network or fallback client errors through the alert helper too
      alertAPIError(err);
      
      if (err.code == "ERR_NETWORK") {
        setServerSatus("error");
        return Promise.reject({ error: true, message: err.message });
      }
      return Promise.reject({ error: true, message: err.message });
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
  if (!name) return 'Coffee';
  const lowerName = name.toLowerCase();

  // Coffee & Cafe (Specific)
  if (lowerName.includes('coffee') || lowerName.includes('កាហ្វេ')) return 'Coffee';
  if (lowerName.includes('tea') || lowerName.includes('តែ')) return 'Leaf';
  if (lowerName.includes('frappe') || lowerName.includes('blend')) return 'IceCream';
  if (lowerName.includes('soda') || lowerName.includes('refresher')) return 'GlassWater';
  if (lowerName.includes('juice') || lowerName.includes('ទឹកផ្លែឈើ')) return 'Citrus';
  if (lowerName.includes('milk') || lowerName.includes('ដោះគោ')) return 'Milk';
  if (lowerName.includes('cake') || lowerName.includes('នំខេក')) return 'Cake';
  if (lowerName.includes('pastry') || lowerName.includes('pastries') || lowerName.includes('bread') || lowerName.includes('នំប៉័ង')) return 'Croissant';
  if (lowerName.includes('signature') || lowerName.includes('special')) return 'Sparkles';
  if (lowerName.includes('dessert') || lowerName.includes('បង្អែម')) return 'Cake';
  if (lowerName.includes('snack') || lowerName.includes('ចម្រុះ')) return 'Cookie';

  // Restaurant & Food
  if (lowerName.includes('seafood') || lowerName.includes('គ្រឿងសមុទ្រ')) return 'Fish';
  if (lowerName.includes('soup') || lowerName.includes('សម្ល')) return 'Soup';
  if (lowerName.includes('stir-fry') || lowerName.includes('ម្ហូបឆា')) return 'Flame';
  if (lowerName.includes('roasted') || lowerName.includes('deep-fried') || lowerName.includes('បំពង')) return 'ChefHat';
  if (lowerName.includes('salad') || lowerName.includes('spicy') || lowerName.includes('ញាំ')) return 'Salad';
  if (lowerName.includes('rice') || lowerName.includes('បាយ')) return 'ChefHat';
  if (lowerName.includes('drink') || lowerName.includes('ភេសជ្ជៈ')) return 'CupSoda';

  // Pharmacy 
  if (lowerName.includes('medicine') || lowerName.includes('ថ្នាំ')) return 'Pills';
  if (lowerName.includes('antibiotics') || lowerName.includes('ថ្នាំផ្សះ')) return 'Pills';
  if (lowerName.includes('supplement') || lowerName.includes('vitamin') || lowerName.includes('វីតាមីន')) return 'Pills';
  if (lowerName.includes('skincare') || lowerName.includes('care') || lowerName.includes('ថែរក្សា')) return 'Sparkles';
  if (lowerName.includes('medical') || lowerName.includes('equipment') || lowerName.includes('ឧបករណ៍')) return 'Stethoscope';
  if (lowerName.includes('baby') || lowerName.includes('mom') || lowerName.includes('ម្តាយ')) return 'Baby';
  if (lowerName.includes('first aid') || lowerName.includes('សង្គ្រោះ')) return 'Activity';

  return 'Coffee';
};

export const getColorForCategory = (name) => {
  if (!name) return '#8B4513';
  const lowerName = name.toLowerCase();

  // Cafe/Food Colors
  if (lowerName.includes('coffee') || lowerName.includes('កាហ្វេ')) return '#8B4513';
  if (lowerName.includes('tea') || lowerName.includes('តែ')) return '#4CAF50';
  if (lowerName.includes('frappe') || lowerName.includes('blend')) return '#FF69B4';
  if (lowerName.includes('soda') || lowerName.includes('refresher')) return '#00BCD4';
  if (lowerName.includes('juice') || lowerName.includes('ទឹកផ្លែឈើ')) return '#FF9800';
  if (lowerName.includes('milk') || lowerName.includes('ដោះគោ')) return '#2196F3';
  if (lowerName.includes('cake') || lowerName.includes('pastry') || lowerName.includes('bread') || lowerName.includes('នំ')) return '#E91E63';
  if (lowerName.includes('signature') || lowerName.includes('special')) return '#FFD700';
  if (lowerName.includes('dessert') || lowerName.includes('បង្អែម')) return '#9C27B0';
  if (lowerName.includes('snack')) return '#795548';

  // Restaurant & Food Colors
  if (lowerName.includes('seafood') || lowerName.includes('គ្រឿងសមុទ្រ')) return '#13c2c2';
  if (lowerName.includes('soup') || lowerName.includes('សម្ល')) return '#1890ff';
  if (lowerName.includes('stir-fry') || lowerName.includes('ម្ហូបឆា')) return '#fa541c';
  if (lowerName.includes('roasted') || lowerName.includes('deep-fried') || lowerName.includes('បំពង')) return '#faad14';
  if (lowerName.includes('salad') || lowerName.includes('spicy') || lowerName.includes('ញាំ')) return '#52c41a';
  if (lowerName.includes('rice')) return '#f5222d';

  // Pharmacy Colors
  if (lowerName.includes('medicine') || lowerName.includes('ថ្នាំ')) return '#13c2c2';
  if (lowerName.includes('antibiotics') || lowerName.includes('ថ្នាំផ្សះ')) return '#f5222d';
  if (lowerName.includes('supplement') || lowerName.includes('vitamin')) return '#eb2f96';
  if (lowerName.includes('skincare') || lowerName.includes('care')) return '#faad14';
  if (lowerName.includes('medical') || lowerName.includes('equipment')) return '#0958d9';
  if (lowerName.includes('baby') || lowerName.includes('mom')) return '#2f54eb';

  return '#8B4513';
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
