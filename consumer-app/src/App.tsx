import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StoresPage from "./pages/consumer/StoresPage";
import ProductsPage from "./pages/consumer/ProductsPage";
import MyOrdersPage from "./pages/consumer/MyOrdersPage";
import StoreDashboardPage from "./pages/store/StoreDashboardPage";
import DeliveryDashboardPage from "./pages/delivery/DeliveryDashboardPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Consumer */}
        <Route path="/stores" element={<StoresPage />} />
        <Route path="/stores/:storeId/products" element={<ProductsPage />} />
        <Route path="/my-orders" element={<MyOrdersPage />} />

        {/* Store */}
        <Route path="/store-dashboard" element={<StoreDashboardPage />} />

        {/* Delivery */}
        <Route path="/delivery-dashboard" element={<DeliveryDashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;