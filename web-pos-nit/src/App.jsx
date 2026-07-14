import React, { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { request } from "@/shared/utils/helper";
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
import SecurityDashboardPage from "@/modules/platform/pages/SecurityDashboardPage";
import DeveloperPortalPage from "@/modules/platform/pages/DeveloperPortalPage";
import PaymentGatewayPage from "@/modules/platform/pages/PaymentGatewayPage";
import IntegrationCenterPage from "@/modules/platform/pages/IntegrationCenterPage";
import AuditLogsPage from "@/modules/platform/pages/AuditLogsPage";
import BackupRecoveryPage from "@/modules/platform/pages/BackupRecoveryPage";
import InfrastructureMonitoringPage from "@/modules/platform/pages/InfrastructureMonitoringPage";
import FeatureFlagsPage from "@/modules/platform/pages/FeatureFlagsPage";
import StockTransferPage from "@/modules/inventory/transfer/pages/StockTransferPage";
import { getProfile } from "@/app/store/profile.store";
import SaasLandingPage from "@/modules/platform/pages/SaasLandingPage";
import LegalPage from "@/modules/platform/pages/LegalPage";
import SolutionsPage from "@/modules/platform/pages/SolutionsPage";
import FeaturesPage from "@/modules/platform/pages/FeaturesPage";
import PricingPage from "@/modules/platform/pages/PricingPage";
import ResourcesPage from "@/modules/platform/pages/ResourcesPage";
import CompanyPage from "@/modules/platform/pages/CompanyPage";
import ModulesPage from "@/modules/platform/pages/ModulesPage";
import IntegrationsPage from "@/modules/platform/pages/IntegrationsPage";

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
  useEffect(() => {
    let cleanUpMediaQuery = null;

    const applyTheme = async () => {
      try {
        const res = await request("system-setting/public", "get");
        if (res && res.success && res.settings) {
          Object.keys(res.settings).forEach(key => {
            if (key.startsWith("flag_")) {
              localStorage.setItem(key, res.settings[key]);
            }
          });
        }
        if (res && res.success && res.settings && res.settings.flag_dark_mode_auto === "true") {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          
          const handleThemeChange = (e) => {
            if (e.matches) {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }
          };

          handleThemeChange(mediaQuery);
          mediaQuery.addEventListener('change', handleThemeChange);
          cleanUpMediaQuery = () => mediaQuery.removeEventListener('change', handleThemeChange);
        } else {
          const savedTheme = localStorage.getItem("landing_theme") || "dark";
          if (savedTheme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      } catch (err) {
        console.error("Theme auto-detection failed:", err);
      }
    };

    applyTheme();

    return () => {
      if (cleanUpMediaQuery) cleanUpMediaQuery();
    };
  }, []);

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
            <Route path="/security-logs" element={<SecurityDashboardPage />} />
            
            {/* Platform Owner Alias Routes */}
            <Route path="/global-dashboard" element={<HomePage />} />
            <Route path="/organization-directory" element={<BusinessPage />} />
            <Route path="/revenue-analytics" element={<HomePage />} />
            <Route path="/invoice-management" element={<ReportSale_Summary />} />
            <Route path="/payment-gateway" element={<PaymentGatewayPage />} />
            <Route path="/app-marketplace" element={<SystemModulePage />} />
            <Route path="/developer-portal" element={<DeveloperPortalPage />} />
            <Route path="/api-management" element={<DeveloperPortalPage />} />
            <Route path="/integration-center" element={<IntegrationCenterPage />} />
            <Route path="/threat-monitoring" element={<SecurityDashboardPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/compliance-center" element={<SecurityDashboardPage />} />
            <Route path="/data-governance" element={<SecurityDashboardPage />} />
            <Route path="/feature-flags" element={<FeatureFlagsPage />} />
            <Route path="/notification-center" element={<SettingsPage />} />
            <Route path="/backup-recovery" element={<BackupRecoveryPage />} />
            <Route path="/infrastructure-monitoring" element={<InfrastructureMonitoringPage />} />

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
          <Route path="/solutions" element={<SolutionsPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/company" element={<CompanyPage />} />
          <Route path="/modules" element={<ModulesPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
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


