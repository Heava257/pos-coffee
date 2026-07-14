const express = require("express");
const router = express.Router();
const c = require("./recipe.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/", authMiddleware("recipe"), c.getRecipe);
router.post("/", authMiddleware("recipe"), c.saveRecipe);
router.delete("/", authMiddleware("recipe"), c.removeRecipe);

module.exports = router;