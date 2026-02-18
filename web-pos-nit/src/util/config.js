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


export const Config = {
  base_url: "http://localhost:8080/api/",
  version: "1.0",
  token: "",
  image_path: "http://localhost:80/fullstack/", 
  getFullImagePath: (imagePart) => `${Config.image_path}${imagePart}`,
  getProductImagePath: (imagePart) => `${Config.image_path}image_pos/${imagePart}`,
};