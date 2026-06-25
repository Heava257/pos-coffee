
import "@/App.css";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import HomePage from "@/modules/dashboard/pages/HomePage";
import LoginPage from "@/modules/auth/pages/LoginPage";
import RegisterPage from "@/modules/auth/pages/RegisterPage";
import WorkspaceSetupPage from "@/modules/auth/pages/WorkspaceSetupPage";
import ScanPage from "@/modules/auth/pages/ScanPage";
import VerifyEmailPage from "@/modules/auth/pages/VerifyEmailPage";
import ForgotPasswordPage from "@/modules/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/modules/auth/pages/ResetPasswordPage";

import MainLayout from "@/app/layouts/MainLayout";
import MainLayoutAuth from "@/app/layouts/MainLayoutAuth";
import EmployeePage from "@/modules/administration/user/pages/EmployeePage";
import CoffeeMenuApp from "@/modules/pos/pages/CoffeeMenuApp";
import UserPage from "@/modules/administration/user/pages/UserPage";
import CategoryPage from "@/modules/catalog/category/pages/CategoryPage";
import GlobalCategoryPage from "@/modules/catalog/category/pages/GlobalCategoryPage";
import RolePage from "@/modules/administration/role/pages/RolePage";
import PermissionPage from "@/modules/administration/role/pages/PermissionPage";
import PlanPage from "@/modules/platform/plan/pages/PlanPage";
import SupplierPage from "@/modules/purchasing/supplier/pages/SupplierPage";
import ProductPage_single from "@/modules/catalog/product/pages/ProductPage_single";
import OrderPage from "@/modules/pos/pages/OrderPage";
import ReportSale_Summary from "@/modules/reports/pages/ReportSale_Summary";
import ReportExpense_Summary from "@/modules/reports/pages/ReportExpense_Summary";
import ReportCustomer_Summary from "@/modules/reports/pages/ReportCustomer_Summary";
import ReportPurchase_Summary from "@/modules/reports/pages/ReportPurchase_Summary";
import Top_Sales from "@/modules/reports/pages/Top_Sales";
import ProfilePage from "@/modules/administration/user/pages/ProfilePage";
import PosPage from "@/modules/pos/pages/PosPage";
import { ExchangeRateProvider } from "@/app/providers/ExchangeRateProvider";
import ExchangeRatePage from "@/modules/finance/payment/pages/ExchangeRatePage";
import BranchPage from "@/modules/administration/branch/pages/BranchPage";
import ExpensePage from "@/modules/finance/expense/pages/ExpensePage";
import BusinessPage from "@/modules/administration/branch/pages/BusinessPage";
// import SmartProductEntry from "@/page/product/ProductPage";
// import ChatPage from "@/modules/dashboard/pages/ChatPage";
import RawMaterialPage from "@/modules/inventory/raw-material/pages/RawMaterialPage";
import WastePage from "@/modules/inventory/waste/pages/WastePage";
import IngredientForecastPage from "@/modules/inventory/forecast/pages/IngredientForecastPage";
import MarketingDashboard from "@/modules/crm/marketing/pages/MarketingDashboard";
import EmployeePerformancePage from "@/modules/administration/user/pages/EmployeePerformancePage";
import PurchasePage from "@/modules/purchasing/purchase-order/pages/PurchasePage";
import StockPage from "@/modules/inventory/stock/pages/StockPage";
import MyPlanPage from "@/modules/platform/subscription/pages/MyPlanPage";
import PaymentResultPage from "@/modules/platform/subscription/pages/PaymentResultPage";
import TablePage from "@/modules/administration/branch/pages/TablePage";
import SettingsPage from "@/modules/administration/user/pages/SettingsPage";
import KdsPage from "@/modules/pos/pages/KdsPage";
import RecipePage from "@/modules/catalog/recipe/pages/RecipePage";
import DigitalReceiptPage from "@/modules/pos/pages/DigitalReceiptPage";
import CustomerPortalPage from "@/modules/pos/pages/CustomerPortalPage";
import LoyaltySearchPage from "@/modules/pos/pages/LoyaltySearchPage";
import DigitalMenuBoard from "@/modules/pos/pages/DigitalMenuBoard";
import ModuleConfigPage from "@/modules/platform/module/pages/ModuleConfigPage";
import SystemModulePage from "@/modules/platform/module/pages/SystemModulePage";
import StockTransferPage from "@/modules/inventory/transfer/pages/StockTransferPage";
import { getProfile } from "@/app/store/profile.store";
import SaasLandingPage from "@/modules/platform/pages/SaasLandingPage";
import LegalPage from "@/modules/platform/pages/LegalPage";

const RootRedirect = () => {
  const profile = getProfile();
  if (!profile) return <SaasLandingPage />;

  const isAdmin = profile.is_super_admin === 1 ||
    profile.business_id === 1 ||
    ['Owner', 'Executive', 'Admin', 'PlatForm Owner', 'Platform Owner'].includes(profile.role_name);

  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  // Staff/Sale redirects to POS
  return <Navigate to="/invoices" replace />;
};


function App() {
  const MainLayoutWrapper = () => (
    <MainLayoutAuth>
      <Outlet />
    </MainLayoutAuth>
  );
  return (
    <ExchangeRateProvider>
      <BrowserRouter basename="/">
        <Routes >
          <Route path="/customer" element={<CoffeeMenuApp />} />
          <Route path="/customer/menu" element={<CoffeeMenuApp />} />
          <Route path="/receipt/:id" element={<DigitalReceiptPage />} />
          <Route path="/membership/:id" element={<CustomerPortalPage />} />
          <Route path="/membership/search" element={<LoyaltySearchPage />} />
          <Route path="/menu-board" element={<DigitalMenuBoard />} />
          <Route path="/scan" element={<ScanPage />} />

          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<HomePage />} />
            <Route path="/invoices" element={<PosPage />} />
            <Route path="/table" element={<TablePage />} />
            <Route path="/category" element={<CategoryPage />} />
            <Route path="/global-category" element={<GlobalCategoryPage />} />
            <Route path="/shop_managment" element={<BranchPage />} />
            <Route path="/expense" element={<ExpensePage />} />
            {/* <Route path="/total_due" element={<SmartProductEntry />} /> */}

            <Route path="/user" element={<UserPage />} />
            <Route path="/product" element={<ProductPage_single />} />
            <Route path="/role" element={<RolePage />} />
            <Route path="/permission" element={<PermissionPage />} />
            <Route path="/plans" element={<PlanPage />} />
            <Route path="/business" element={<BusinessPage />} />
            <Route path="/service-blueprints" element={<ModuleConfigPage />} />
            <Route path="/system-subscriptions" element={<PlanPage />} />
            <Route path="/system-modules" element={<SystemModulePage />} />
            <Route path="/my-plan" element={<MyPlanPage />} />
            <Route path="/payment/result" element={<PaymentResultPage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/marketing/dashboard" element={<MarketingDashboard />} />
            <Route path="/employee/performance" element={<EmployeePerformancePage />} />
            <Route path="/supplier" element={<SupplierPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />

            <Route path="/report_Sale_Summary" element={<ReportSale_Summary />} />
            <Route path="/report_Expense_Summary" element={<ReportExpense_Summary />} />
            <Route path="/report_Customer" element={<ReportCustomer_Summary />} />
            <Route path="/purchase_Summary" element={<ReportPurchase_Summary />} />
            <Route path="/Top_Sale" element={<Top_Sales />} />
            <Route path="/raw_material" element={<RawMaterialPage />} />
            <Route path="/purchase" element={<PurchasePage />} />
            <Route path="/stock" element={<StockPage />} />
            <Route path="/stock-transfer" element={<StockTransferPage />} />
            <Route path="/recipe" element={<RecipePage />} />
            <Route path="/waste" element={<WastePage />} />
            <Route path="/inventory/forecast" element={<IngredientForecastPage />} />
            <Route path="/kds" element={<KdsPage />} />
            <Route path="*" element={<Navigate to="/customer" replace />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/workspace-setup" element={<WorkspaceSetupPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/terms" element={<LegalPage />} />
          <Route path="/privacy" element={<LegalPage />} />
          <Route path="/cookies" element={<LegalPage />} />
          <Route path="/refund-policy" element={<LegalPage />} />
          <Route path="/acceptable-use" element={<LegalPage />} />
          <Route path="/contact" element={<LegalPage />} />
          <Route path="/about" element={<LegalPage />} />
          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>


    </ExchangeRateProvider>

  );
}

export default App;


