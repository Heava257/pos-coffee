const { validate_token } = require("../controller/auth.controller");
const {
    getRecipe,
    saveRecipe,
    removeRecipe,
} = require("../controller/recipe.controller");

module.exports = (app) => {
    app.get("/api/recipe", validate_token("recipe.get"), getRecipe);
    app.post("/api/recipe", validate_token("recipe.create"), saveRecipe);
    app.delete("/api/recipe", validate_token("recipe.delete"), removeRecipe);
};
