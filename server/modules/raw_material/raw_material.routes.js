const express = require("express");
const router = express.Router();
const c = require("./raw_material.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const uploadMiddleware = require("../../middlewares/upload.middleware");

router.get("/forecast", authMiddleware("raw_material"), c.getForecast);
router.get("/", authMiddleware("raw_material"), c.getList);
router.post("/", authMiddleware("raw_material"), uploadMiddleware.single("image"), c.create);
router.put("/", authMiddleware("raw_material"), uploadMiddleware.single("image"), c.update);
router.delete("/", authMiddleware("raw_material"), c.remove);

module.exports = router;
