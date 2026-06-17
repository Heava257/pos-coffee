const productController = require("../../src/controller/product.controller");
const favoriteController = require("../../src/controller/favorite.controller");

module.exports = {
  ...productController,
  getFavorites: favoriteController.getList,
  toggleFavorite: favoriteController.toggle
};