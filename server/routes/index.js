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
registerRoute("/security", "/securities", "../modules/security/security.routes");
registerRoute("/employee", "/employees", "../modules/employee/employee.routes");
registerRoute("/shift", "/shifts", "../modules/shift/shift.routes");
registerRoute("/table", "/tables", "../modules/table/table.routes");
registerRoute("/developer", "/developers", "../modules/developer/developer.routes");
registerRoute("/payment-gateway", "/payment-gateways", "../modules/payment_gateway/payment_gateway.routes");
registerRoute("/backup", "/backups", "../modules/backup/backup.routes");

// Special Compatibility Aliases for non-nested flat requests
const orderController = require("../modules/order/order.controller");
const dashboardController = require("../modules/dashboard/dashboard.controller");
const reportController = require("../modules/report/report.controller");
const purchaseController = require("../modules/purchase/purchase.controller");

router.get("/order-pending", authMiddleware("order"), orderController.getPendingOrders);
router.get("/config", authMiddleware("config"), require("../modules/business/business.controller").getBusinessConfig);
router.get("/admin-dashboard", authMiddleware("dashboard"), dashboardController.getAdminDashboard);

// Purchase Flat Routes
router.get("/purchase-details", authMiddleware("purchase"), purchaseController.getDetails);
router.get("/purchases-details", authMiddleware("purchase"), purchaseController.getDetails);
router.post("/purchase-receive", authMiddleware("purchase"), purchaseController.receive);
router.post("/purchase-approve", authMiddleware("purchase"), purchaseController.approve);

// Flat Compatibility Routes for Reports
router.get("/top_sales", authMiddleware("Top_Sale"), reportController.top_sale);
router.get("/top-sales", authMiddleware("Top_Sale"), reportController.top_sale);
router.get("/report_Sale_Sammary", authMiddleware("report_Sale_Summary"), reportController.report_Sale_Summary);
router.get("/report_Sale_Summary", authMiddleware("report_Sale_Summary"), reportController.report_Sale_Summary);
router.get("/report_Expense_Summary", authMiddleware("report_Expense_Summary"), reportController.report_Expense_Summary);
router.get("/report_Customer", authMiddleware("report_Sale_Summary"), reportController.report_Customer);
router.get("/report_Purchase_Summary", authMiddleware("report_Sale_Summary"), reportController.report_Purchase_Summary);

// Settings and Modular Packages Compatibility Routes
const settingsController = require("../modules/system-settings/settings.controller");
const modularPackageController = require("../modules/subscription/modular_package.controller");
const systemModuleController = require("../modules/subscription/system_module.controller");
const uploadMiddleware = require("../middlewares/upload.middleware");

router.get("/settings", authMiddleware("settings"), settingsController.getSettings);
router.put("/settings", authMiddleware("settings"), uploadMiddleware.single("upload_logo"), settingsController.updateSettings);
router.post("/settings/test-telegram", authMiddleware("settings"), settingsController.testTelegramNotification);

router.get("/modular_package", authMiddleware("subscription"), modularPackageController.getList);
router.get("/modular_packages", authMiddleware("subscription"), modularPackageController.getList);
router.post("/modular_package", authMiddleware("subscription"), modularPackageController.create);
router.put("/modular_package", authMiddleware("subscription"), modularPackageController.update);
router.get("/modular_package/permissions", authMiddleware("subscription"), modularPackageController.getPermissions);

router.get("/system_module", authMiddleware("subscription"), systemModuleController.getList);
router.get("/system_modules", authMiddleware("subscription"), systemModuleController.getList);
router.post("/system_module", authMiddleware("subscription"), systemModuleController.create);
router.put("/system_module", authMiddleware("subscription"), systemModuleController.update);
router.delete("/system_module", authMiddleware("subscription"), systemModuleController.remove);

router.get("/permission_matrix", authMiddleware("subscription"), systemModuleController.getMatrix);
router.get("/permission_matrices", authMiddleware("subscription"), systemModuleController.getMatrix);
router.post("/permission_matrix", authMiddleware("subscription"), systemModuleController.saveMatrix);
router.post("/permission_matrices", authMiddleware("subscription"), systemModuleController.saveMatrix);

const planController = require("../modules/plan/plan.controller");
router.get("/my-plan", authMiddleware("my-plan"), planController.getBusinessPlan);
router.get("/my-plan/billing-history", authMiddleware("my-plan"), planController.getBillingHistory);
router.post("/my-plan/upgrade", authMiddleware("my-plan"), planController.selfUpgrade);
router.get("/system-subscriptions", authMiddleware("system-subscriptions"), planController.getSystemSubscriptions);
router.put("/system-subscriptions", authMiddleware("system-subscriptions"), planController.updateSystemSubscription);
router.post("/system-subscriptions/send-reminder", authMiddleware("system-subscriptions"), planController.sendManualReminder);

router.get("/user-switch-list", authMiddleware("user"), require("../modules/user/user.controller").getStaffSwitchList);

router.get("/exchange_rate", authMiddleware("exchange_rate"), require("../modules/business/business.controller").getExchangeRate);
router.get("/exchange-rate", authMiddleware("exchange_rate"), require("../modules/business/business.controller").getExchangeRate);

router.get("/order-kds", authMiddleware("kds"), orderController.getKDSOrders);
router.put("/order-kitchen-status", authMiddleware("kds"), orderController.updateKitchenStatus);
router.put("/order-send-to-kitchen", authMiddleware("order"), orderController.sendOrderToKitchen);

const orderWebRouter = express.Router();
orderWebRouter.post("/", orderController.createWebOrder);
orderWebRouter.get("/active", orderController.getActiveOrderByTable);
orderWebRouter.get("/customer/:customer_id", orderController.getList);
orderWebRouter.get("/:order_id", orderController.getOrderDetail);
router.use("/order-web", orderWebRouter);

// Barcode compatibility routes for frontend flat requests
const productController = require("../modules/product/product.controller");
router.post("/new_barcode", authMiddleware("product"), productController.generateBarcode);
router.post("/new-barcode", authMiddleware("product"), productController.generateBarcode);
router.get("/check_barcode/:barcode", authMiddleware("product"), productController.checkBarcode);
router.get("/check-barcode/:barcode", authMiddleware("product"), productController.checkBarcode);

module.exports = router;
