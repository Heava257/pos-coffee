const {
  register,
  login,
  getProfile
} = require("../controller/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

module.exports = (app) => {
  // Public Routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);

  // Protected Routes
  app.get("/api/auth/profile", authMiddleware(), getProfile);
};
