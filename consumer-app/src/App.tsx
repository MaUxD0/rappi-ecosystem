import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StoresPage from "./pages/StoresPage";

function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route path="/" element={<LoginPage />} />

        <Route path="/register" element={<RegisterPage />} />

        <Route path="/stores" element={<StoresPage />} />

      </Routes>

    </BrowserRouter>

  );

}

export default App;