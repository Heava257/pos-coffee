const express = require("express");
const router = express.Router();
const c = require("./branch.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const upload = require("../../middlewares/upload.middleware");

router.get("/", authMiddleware("shop_managment"), c.getList);
router.post("/", authMiddleware("shop_managment"), upload.single("khqr_image"), c.create);
router.put("/", authMiddleware("shop_managment"), upload.single("khqr_image"), c.update);
router.delete("/", authMiddleware("shop_managment"), c.remove);

module.exports = router;