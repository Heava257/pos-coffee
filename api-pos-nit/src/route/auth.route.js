const {
  register,
  login,
  getProfile,
  updateProfile,
  verifyEmail,
  verifyManager
} = require("../controller/auth.controller");
const { guestAccess } = require("../controller/guest.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { uploadFile } = require("../util/helper");

module.exports = (app) => {
  // Public Routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.get("/api/auth/guest-access", guestAccess);
  app.post("/api/auth/verify-email", verifyEmail);
  app.post("/api/auth/forgot-password", require("../controller/auth.controller").forgotPassword);
  app.post("/api/auth/verify-otp", require("../controller/auth.controller").verifyOtp);
  app.post("/api/auth/reset-password", require("../controller/auth.controller").resetPassword);
  app.post("/api/auth/google-login", require("../controller/auth.controller").googleLogin);
  app.post("/api/auth/login-switch", authMiddleware(), require("../controller/auth.controller").loginByPassword);

  // Protected Routes
  app.get("/api/auth/profile", authMiddleware(), getProfile);
  app.put("/api/auth/profile", authMiddleware(), uploadFile.single("upload_image"), updateProfile);
  app.post("/api/auth/verify-manager", authMiddleware(), verifyManager);
};
