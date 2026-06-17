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
router.get("/order-pending", authMiddleware(), orderController.getPendingOrders);
router.get("/config", authMiddleware(), require("../modules/business/business.controller").getBusinessConfig);

const planController = require("../modules/plan/plan.controller");
router.get("/my-plan", authMiddleware(), planController.getBusinessPlan);
router.get("/my-plan/billing-history", authMiddleware(), planController.getBillingHistory);
router.post("/my-plan/upgrade", authMiddleware(), planController.selfUpgrade);

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

module.exports = router;
