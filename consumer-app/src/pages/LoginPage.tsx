import { useState } from "react";
import { login } from "../services/authService";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user.role === "consumer") window.location.href = "/stores";
      else if (data.user.role === "store") window.location.href = "/store-dashboard";
      else if (data.user.role === "delivery") window.location.href = "/delivery-dashboard";
    } catch {
      alert("Login failed");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-orange-500 to-orange-400 flex-col items-center justify-center p-16 text-white">
        <h1 className="text-7xl font-black tracking-tighter mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
          rappi
        </h1>
        <p className="text-xl font-semibold text-center max-w-xs opacity-95 leading-relaxed">
          Todo lo que necesitas, entregado en minutos
        </p>
        <div className="mt-12 flex flex-col gap-4 w-full max-w-xs">
          {["Miles de tiendas disponibles", "Entrega ultrarrápida", "Pago fácil y seguro"].map((item) => (
            <div key={item} className="flex items-center gap-3 bg-white/20 rounded-2xl px-5 py-3">
              <div className="w-2 h-2 rounded-full bg-white" />
              <span className="font-semibold text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 lg:max-w-md bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-5xl font-black text-orange-500 tracking-tighter" style={{ fontFamily: 'Nunito, sans-serif' }}>
              rappi
            </h1>
          </div>

          <h2 className="text-3xl font-black text-gray-900 mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Bienvenido
          </h2>
          <p className="text-gray-400 text-sm mb-8">Ingresa tus datos para continuar</p>

          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="tu@correo.com"
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-black py-4 rounded-xl text-base transition-all shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:-translate-y-0.5"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Iniciar sesión
          </button>

          <p className="text-center mt-6 text-sm text-gray-400">
            ¿No tienes cuenta?{" "}
            <a href="/register" className="text-orange-500 font-bold hover:underline">
              Regístrate gratis
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}