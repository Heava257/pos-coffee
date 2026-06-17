const express = require("express");
const router = express.Router();
const c = require("./category.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const uploadMiddleware = require("../../middlewares/upload.middleware");

// Relative to /api/v1/categories
router.get("/", authMiddleware(), c.getList);
router.post("/", authMiddleware("category"), uploadMiddleware.single("image"), c.create);
router.put("/", authMiddleware("category"), uploadMiddleware.single("image"), c.update);
router.delete("/", authMiddleware("category"), c.remove);

router.get("/business-categories", authMiddleware("category"), c.getBusinessCategories);
router.put("/business-categories/toggle", authMiddleware("category"), c.toggleBusinessCategory);
router.post("/business-categories/bulk", authMiddleware("category"), c.bulkSaveBusinessCategories);

module.exports = router;