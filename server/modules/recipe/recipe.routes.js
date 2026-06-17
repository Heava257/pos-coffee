const express = require("express");
const router = express.Router();
const c = require("./recipe.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/", authMiddleware(), c.getRecipe);
router.post("/", authMiddleware(), c.saveRecipe);
router.delete("/", authMiddleware(), c.removeRecipe);

module.exports = router;