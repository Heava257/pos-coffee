const categoryController = require("../../src/controller/category.controller");
const businessCategoryController = require("../../src/controller/business_category.controller");

module.exports = {
  ...categoryController,
  getBusinessCategories: businessCategoryController.getList,
  toggleBusinessCategory: businessCategoryController.toggle,
  bulkSaveBusinessCategories: businessCategoryController.bulkSave
};