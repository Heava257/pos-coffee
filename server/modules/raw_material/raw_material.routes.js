const express = require("express");
const router = express.Router();
const c = require("./raw_material.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const uploadMiddleware = require("../../middlewares/upload.middleware");

router.get("/forecast", authMiddleware(), c.getForecast);
router.get("/", authMiddleware(), c.getList);
router.post("/", authMiddleware(), uploadMiddleware.single("image"), c.create);
router.put("/", authMiddleware(), uploadMiddleware.single("image"), c.update);
router.delete("/", authMiddleware(), c.remove);

module.exports = router;
