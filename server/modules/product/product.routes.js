const express = require("express");
const router = express.Router();
const c = require("./product.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const uploadMiddleware = require("../../middlewares/upload.middleware");

// Relative to /api/v1/products
router.get("/", authMiddleware("product"), c.getList);
router.post("/", authMiddleware("product"), uploadMiddleware.single("upload_image"), c.create);
router.put("/", authMiddleware("product"), uploadMiddleware.single("upload_image"), c.update);
router.delete("/", authMiddleware("product"), c.remove);

router.get("/business", authMiddleware("product"), c.getBusinessProducts);
router.post("/link", authMiddleware("product"), c.linkToBranch);

router.post("/new-barcode", authMiddleware("product"), c.generateBarcode);
router.get("/check-barcode/:barcode", authMiddleware("product"), c.checkBarcode);

router.get("/favorite", authMiddleware("product"), c.getFavorites);
router.post("/favorite", authMiddleware("product"), c.toggleFavorite);

module.exports = router;