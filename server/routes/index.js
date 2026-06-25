const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");

// Helper to register both singular and plural versions of routes
const registerRoute = (singular, plural, modulePath) => {
  const moduleRouter = require(modulePath);
  router.use(plural, moduleRouter);
  router.use(singular, moduleRouter);
};

router.use("/auth", require("../modules/auth/auth.routes"));

registerRoute("/dashboard", "/dashboards", "../modules/dashboard/dashboard.routes");
registerRoute("/user", "/users", "../modules/user/user.routes");
registerRoute("/role", "/roles", "../modules/role/role.routes");
registerRoute("/permission", "/permissions", "../modules/permission/permission.routes");
registerRoute("/product", "/products", "../modules/product/product.routes");
registerRoute("/category", "/categories", "../modules/category/category.routes");
registerRoute("/recipe", "/recipes", "../modules/recipe/recipe.routes");
registerRoute("/customer", "/customers", "../modules/customer/customer.routes");
registerRoute("/membership", "/memberships", "../modules/membership/membership.routes");

router.use("/loyalty", require("../modules/loyalty/loyalty.routes"));

registerRoute("/order", "/orders", "../modules/order/order.routes");
registerRoute("/invoice", "/invoices", "../modules/invoice/invoice.routes");
registerRoute("/payment", "/payments", "../modules/payment/payment.routes");
registerRoute("/supplier", "/suppliers", "../modules/supplier/supplier.routes");
registerRoute("/purchase", "/purchases", "../modules/purchase/purchase.routes");
registerRoute("/receiving", "/receivings", "../modules/receiving/receiving.routes");
registerRoute("/stock", "/stocks", "../modules/stock/stock.routes");
registerRoute("/stock-transfer", "/stock-transfers", "../modules/stock-transfer/stock-transfer.routes");
registerRoute("/waste", "/wastes", "../modules/waste/waste.routes");
registerRoute("/expense", "/expenses", "../modules/expense/expense.routes");
registerRoute("/report", "/reports", "../modules/report/report.routes");
registerRoute("/branch", "/branches", "../modules/branch/branch.routes");
registerRoute("/business", "/businesses", "../modules/business/business.routes");
registerRoute("/plan", "/plans", "../modules/plan/plan.routes");
registerRoute("/raw_material", "/raw_materials", "../modules/raw_material/raw_material.routes");
router.use("/raw-material", require("../modules/raw_material/raw_material.routes"));
router.use("/raw-materials", require("../modules/raw_material/raw_material.routes"));

registerRoute("/system-setting", "/system-settings", "../modules/system-settings/system-settings.routes");
registerRoute("/subscription", "/subscriptions", "../modules/subscription/subscription.routes");

router.use("/billing", require("../modules/billing/billing.routes"));

registerRoute("/notification", "/notifications", "../modules/notification/notification.routes");
registerRoute("/employee", "/employees", "../modules/employee/employee.routes");
registerRoute("/shift", "/shifts", "../modules/shift/shift.routes");
registerRoute("/table", "/tables", "../modules/table/table.routes");

// Special Compatibility Aliases for non-nested flat requests
const orderController = require("../modules/order/order.controller");
const dashboardController = require("../src/controller/dashboard.controller");
const reportController = require("../src/controller/report.controller");
const purchaseController = require("../src/controller/purchase.controller");

router.get("/order-pending", authMiddleware(), orderController.getPendingOrders);
router.get("/config", authMiddleware(), require("../modules/business/business.controller").getBusinessConfig);
router.get("/admin-dashboard", authMiddleware(), dashboardController.getAdminDashboard);

// Purchase Flat Routes
router.get("/purchase-details", authMiddleware(), purchaseController.getDetails);
router.get("/purchases-details", authMiddleware(), purchaseController.getDetails);
router.post("/purchase-receive", authMiddleware(), purchaseController.receive);
router.post("/purchase-approve", authMiddleware(), purchaseController.approve);

// Flat Compatibility Routes for Reports
router.get("/top_sales", authMiddleware(), reportController.top_sale);
router.get("/top-sales", authMiddleware(), reportController.top_sale);
router.get("/report_Sale_Sammary", authMiddleware(), reportController.report_Sale_Summary);
router.get("/report_Sale_Summary", authMiddleware(), reportController.report_Sale_Summary);
router.get("/report_Expense_Summary", authMiddleware(), reportController.report_Expense_Summary);
router.get("/report_Customer", authMiddleware(), reportController.report_Customer);
router.get("/report_Purchase_Summary", authMiddleware(), reportController.report_Purchase_Summary);

// Settings and Modular Packages Compatibility Routes
const settingsController = require("../src/controller/settings.controller");
const modularPackageController = require("../src/controller/modular_package.controller");
const systemModuleController = require("../src/controller/system_module.controller");
const uploadMiddleware = require("../middlewares/upload.middleware");

router.get("/settings", authMiddleware(), settingsController.getSettings);
router.put("/settings", authMiddleware(), uploadMiddleware.single("upload_logo"), settingsController.updateSettings);
router.post("/settings/test-telegram", authMiddleware(), settingsController.testTelegramNotification);

router.get("/modular_package", authMiddleware(), modularPackageController.getList);
router.get("/modular_packages", authMiddleware(), modularPackageController.getList);
router.post("/modular_package", authMiddleware(), modularPackageController.create);
router.put("/modular_package", authMiddleware(), modularPackageController.update);
router.get("/modular_package/permissions", authMiddleware(), modularPackageController.getPermissions);

router.get("/system_module", authMiddleware(), systemModuleController.getList);
router.get("/system_modules", authMiddleware(), systemModuleController.getList);
router.post("/system_module", authMiddleware(), systemModuleController.create);
router.put("/system_module", authMiddleware(), systemModuleController.update);
router.delete("/system_module", authMiddleware(), systemModuleController.remove);

router.get("/permission_matrix", authMiddleware(), systemModuleController.getMatrix);
router.get("/permission_matrices", authMiddleware(), systemModuleController.getMatrix);
router.post("/permission_matrix", authMiddleware(), systemModuleController.saveMatrix);
router.post("/permission_matrices", authMiddleware(), systemModuleController.saveMatrix);

const planController = require("../modules/plan/plan.controller");
router.get("/my-plan", authMiddleware(), planController.getBusinessPlan);
router.get("/my-plan/billing-history", authMiddleware(), planController.getBillingHistory);
router.post("/my-plan/upgrade", authMiddleware(), planController.selfUpgrade);
router.get("/system-subscriptions", authMiddleware(), planController.getSystemSubscriptions);
router.put("/system-subscriptions", authMiddleware(), planController.updateSystemSubscription);
router.post("/system-subscriptions/send-reminder", authMiddleware(), planController.sendManualReminder);

router.get("/user-switch-list", authMiddleware(), require("../modules/user/user.controller").getStaffSwitchList);

router.get("/exchange_rate", authMiddleware(), require("../modules/business/business.controller").getExchangeRate);
router.get("/exchange-rate", authMiddleware(), require("../modules/business/business.controller").getExchangeRate);

router.get("/order-kds", authMiddleware(), orderController.getKDSOrders);
router.put("/order-kitchen-status", authMiddleware(), orderController.updateKitchenStatus);
router.put("/order-send-to-kitchen", authMiddleware(), orderController.sendOrderToKitchen);

const orderWebRouter = express.Router();
orderWebRouter.post("/", orderController.createWebOrder);
orderWebRouter.get("/active", orderController.getActiveOrderByTable);
orderWebRouter.get("/customer/:customer_id", orderController.getList);
orderWebRouter.get("/:order_id", orderController.getOrderDetail);
router.use("/order-web", orderWebRouter);

// Barcode compatibility routes for frontend flat requests
const productController = require("../modules/product/product.controller");
router.post("/new_barcode", authMiddleware(), productController.generateBarcode);
router.post("/new-barcode", authMiddleware(), productController.generateBarcode);
router.get("/check_barcode/:barcode", authMiddleware(), productController.checkBarcode);
router.get("/check-barcode/:barcode", authMiddleware(), productController.checkBarcode);

module.exports = router;
