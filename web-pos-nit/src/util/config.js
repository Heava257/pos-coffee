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


const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/";
const formattedBaseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl : `${rawBaseUrl}/`;

export const Config = {
  base_url: formattedBaseUrl,
  version: "1.0",
  token: "",
  image_path: import.meta.env.VITE_IMAGE_PATH || "http://localhost:80/fullstack/",
  platform_url: import.meta.env.VITE_PLATFORM_URL || "http://localhost:3000",
  getFullImagePath: (imagePart) => `${Config.image_path}${imagePart}`,
  getProductImagePath: (imagePart) => `${Config.image_path}image_pos/${imagePart}`,
};