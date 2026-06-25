// export const Config = {
//   base_url: import.meta.env.VITE_BASE_URL,
//   version: import.meta.env.VITE_APP_VERSION,
//   token: import.meta.env.VITE_APP_TOKEN,
//   image_path: import.meta.env.VITE_IMAGE_PATH,
// };

// export const Config = {
//   base_url: "http://localhost:8080/api/",
//   version: "1.0",
//   token: "",
//   image_path: "http://localhost:/fullstack/",
// };


// Helper to get consistent API URL
const getDynamicBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Smart Railway URL detection
    if (host.includes("railway.app")) {
      // If we are on pos-coffee-web-production.up.railway.app
      // we want to hit pos-coffee-api-production.up.railway.app
      const apiHost = host.replace("-web", "-api");
      return `https://${apiHost}/api/`;
    }
    // Fallback for local testing and deployment
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return window.location.origin + "/api/";
    }
  }
  return import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080/api/";
};

const formattedBaseUrl = getDynamicBaseUrl();
const defaultImagePath = formattedBaseUrl.replace('/api/', '/public/images/');

export const Config = {
  base_url: formattedBaseUrl,
  version: "1.0",
  token: "",
  image_path: import.meta.env.VITE_IMAGE_PATH || defaultImagePath,
  platform_url: typeof window !== 'undefined' ? window.location.origin : (import.meta.env.VITE_PLATFORM_URL || "http://localhost:3000"),
  optimizeCloudinary: (url, transform = "f_auto,q_auto") => {
    if (!url || typeof url !== 'string' || !url.includes("cloudinary.com")) return url;
    if (url.includes("/upload/f_auto") || url.includes("/upload/w_")) return url;
    if (url.includes("/upload/")) {
      return url.replace("/upload/", `/upload/${transform}/`);
    }
    return url;
  },
  getFullImagePath: (imagePart) => {
    if (!imagePart) return "";
    if (imagePart.startsWith('http')) return Config.optimizeCloudinary(imagePart);

    // If it's a Cloudinary ID from our backend (e.g., coffee-pos/img-...)
    if (imagePart.startsWith('coffee-pos/')) {
      return `https://res.cloudinary.com/dq2iul0rv/image/upload/${imagePart}`;
    }

    const base = Config.image_path.endsWith('/') ? Config.image_path : `${Config.image_path}/`;
    return Config.optimizeCloudinary(`${base}${imagePart}`);
  },
  getProductImagePath: (imagePart) => {
    if (!imagePart) return "";
    if (imagePart.startsWith('http') || Config.image_path.includes('cloudinary')) return Config.getFullImagePath(imagePart);
    const base = Config.image_path.endsWith('/') ? Config.image_path : `${Config.image_path}/`;
    return Config.optimizeCloudinary(`${base}image_pos/${imagePart}`);
  },
};