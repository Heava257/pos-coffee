
import "./App.css";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import HomePage from "./page/home/HomePage";
import LogingPage from "./page/auth/LogingPage";
import RegisterPage from "./page/auth/RegisterPage";

import MainLayout from "./component/layout/MainLayout";
import MainLayoutAuth from "./component/layout/MainLayoutAuth";
import EmployeePage from "./page/employee/EmployeePage";
import CoffeeMenuApp from "./page/CoffeeMenuApp/CoffeeMenuApp";
import CategoryPage from "./page/category/CategoryPage";
import UserPage from "./page/user/UserPage";
import RolePage from "./page/role/RolePage";
import SupplierPage from "./page/purchase/SupplierPage";
import ProductPage_single from "./page/product/ProductPage_single";
import ExpansePage from "./page/expanse/ExpansePage";
// import  CoffeePOSPage from "./page/pos/CoffeePOSPage";
import OrderPage from "./page/orderPage/OrderPage";
import ReportSale_Summary from "./page/report/ReportSale_Summary";
import ReportExpense_Summary from "./page/report/ReportExpense_Summary";
import ReportCustomer_Summary from "./page/report/ReportCustomer_Summary";
import ReportPurchase_Summary from "./page/report/ReportPurchase_Summary";
import Top_Sales from "./page/top_sale/Top_Sales";
import Total_DuePage from "./page/total_due/Total_DuePage";
// import AboutHomepage from "./page/about/Aboutpage";
import ProfilePage from "./page/user/ProfilePage";
import ExpanseTypePage from "./page/expanse/ExpanseTypePage";
import PosPage from "./page/pos/PosPage";
import { ExchangeRateProvider } from "../src/component/pos/ExchangeRateContext";
import ExchangeRatePage from "./page/ExchangeRatePage/ExchangeRatePage";
import ShopPage from "./page/shop/ShopPage";
// import SmartProductEntry from "./page/product/ProductPage";
// import ChatPage from "./component/chat/ChatPage";


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

          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/employee" element={<ExchangeRatePage />} />
            <Route path="/invoices" element={<PosPage />} />
            <Route path="/category" element={<CategoryPage />} />
            <Route path="/shop_managment" element={<ShopPage />} />
            {/* <Route path="/total_due" element={<SmartProductEntry />} /> */}

            <Route path="/user" element={<UserPage />} />
            <Route path="/product" element={<ProductPage_single />} />
            <Route path="/role" element={<RolePage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/supplier" element={<SupplierPage />} />
            {/* <Route path="/total_due" element={<Total_DuePage />} /> */}
            <Route path="/profile" element={<ProfilePage />} />


            <Route path="/expanse" element={<ExpansePage />} />
            <Route path="/expanse_type" element={<ExpanseTypePage />} />
            <Route path="/report_Sale_Summary" element={<ReportSale_Summary />} />
            <Route path="/report_Expense_Summary" element={<ReportExpense_Summary />} />
            <Route path="/report_Customer" element={<ReportCustomer_Summary />} />
            <Route path="/purchase_Summary" element={<ReportPurchase_Summary />} />
            <Route path="/Top_Sale" element={<Top_Sales />} />




            <Route path="*" element={<h1>404-Route Not Found!</h1>} />
          </Route>

          <Route element={<MainLayoutAuth />}>
            {/* <Route path="/about" element={<AboutHomepage />} /> */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LogingPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
        </Routes>
      </BrowserRouter>


    </ExchangeRateProvider>

  );
}

export default App;


