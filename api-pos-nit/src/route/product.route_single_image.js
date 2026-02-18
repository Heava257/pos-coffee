const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  create,
  update,
  remove,
  newBarcode,
  checkBarcode,
  getSizes,
  getAddons,
} = require("../controller/product.controller_single_image");
const { uploadFile } = require("../util/helper");

module.exports = (app) => {
    app.get("/api/sizes", getSizes);
  app.get("/api/addons", getAddons);
  app.post(
    "/api/product",
    validate_token(),
    uploadFile.single("upload_image"),
    create
  );
  app.get('/api/product/:user_id',validate_token("product.getlist"),getList);
  app.get('/api/check-barcode/:barcode', validate_token("product.getlist"), checkBarcode);

  app.put(
    "/api/product",
    validate_token(),
    uploadFile.single("upload_image"),
    update
  );
  app.delete("/api/product", validate_token(), remove);
  app.post("/api/new_barcode", validate_token(), newBarcode);
};
