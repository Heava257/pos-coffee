
const {
  getList,
  register,
  login,
  profile,
  validate_token,
  remove,
  update,
  newBarcode,
  getuserProfile,
  updateuserProfile,
  refreshToken,
} = require("../controller/auth.controller");
const { uploadFile } = require("../util/helper");

module.exports = (app) => {
  app.get("/api/groups/get-list", validate_token("user.getlist"), getList);
  app.get("/api/auth/get-list", validate_token("user.getlist"), getList);

  app.post('/api/refresh-token', refreshToken);
  // SSO Transition: Registration and Login are now handled by the main SaaS Platform
  // app.post("/api/auth/register",  validate_token("user.create"),uploadFile.single("upload_image"), register);
  // app.post("/api/auth/login",login);
  app.post("/api/auth/profile", validate_token(), profile);
  app.post("/api/auth/new_barcode", validate_token(), newBarcode);
  app.get("/api/auth/user-profile/:userId", validate_token(), getuserProfile);
  app.put("/api/user/profile/:userId", validate_token("user.update"), uploadFile.single("upload_image"), updateuserProfile);

};

