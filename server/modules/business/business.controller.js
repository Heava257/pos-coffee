const businessController = require("../../src/controller/business.controller");
const settingsController = require("../../src/controller/settings.controller");
const configController = require("../../src/controller/config.controller");
const exchangeController = require("../../src/controller/exchange.controller");

module.exports = {
  ...businessController,
  getBusinessConfig: configController.getList,
  getProductConfig: configController.getProductConfig,
  getSettings: settingsController.getSettings,
  updateSettings: settingsController.updateSettings,
  testTelegramNotification: settingsController.testTelegramNotification,
  getExchangeRate: exchangeController.getExchangeRate,
  getBalanceData: exchangeController.getBalanceData,
  getTransactions: exchangeController.getTransactions
};