import { useState } from "react";
import { register } from "../services/authService";

const ROLES = [
  { value: "consumer", icon: "🛒", label: "Consumidor", desc: "Compra en tiendas" },
  { value: "store",    icon: "🏪", label: "Tienda",     desc: "Vende productos" },
  { value: "delivery", icon: "🛵", label: "Repartidor", desc: "Entrega pedidos" },
];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("consumer");
  const [storeName, setStoreName] = useState("");

  const handleRegister = async () => {
    try {
      const finalName = role === "store" ? storeName : name;
      if (!finalName || !email || !password) {
        alert("Por favor llena todos los campos");
        return;
      }
      await register(finalName, email, password, role);
      alert("Cuenta creada. Por favor inicia sesión.");
      window.location.href = "/";
    } catch (error) {
      alert("Register failed");
      console.error(error);
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
          Únete a millones de usuarios
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 lg:max-w-md bg-white flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-sm py-8">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-5xl font-black text-orange-500 tracking-tighter" style={{ fontFamily: 'Nunito, sans-serif' }}>
              rappi
            </h1>
          </div>

          <h2 className="text-3xl font-black text-gray-900 mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Crear cuenta
          </h2>
          <p className="text-gray-400 text-sm mb-8">Gratis y en menos de 2 minutos</p>

          {/* Role selector */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              Tipo de cuenta
            </label>
            <div className="grid grid-cols-3 gap-3">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all text-center
                    ${role === r.value
                      ? "border-orange-500 bg-orange-50 text-orange-600"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  style={{ boxShadow: "none" }}
                >
                  <span className="text-2xl mb-1">{r.icon}</span>
                  <span className="text-xs font-bold" style={{ fontFamily: 'Nunito, sans-serif' }}>{r.label}</span>
                  <span className="text-xs text-gray-400 mt-0.5">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {role === "store" ? (
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Nombre de la tienda
              </label>
              <input
                type="text"
                placeholder="Ej: Burger House"
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              />
            </div>
          ) : (
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Tu nombre
              </label>
              <input
                type="text"
                placeholder="Ej: Carlos Rodríguez"
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              />
            </div>
          )}

          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="tu@correo.com"
              onChange={(e) => setEmail(e.target.value)}
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
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <button
            onClick={handleRegister}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl text-base transition-all shadow-lg shadow-orange-200 hover:-translate-y-0.5"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Crear cuenta
          </button>

          <p className="text-center mt-6 text-sm text-gray-400">
            ¿Ya tienes cuenta?{" "}
            <a href="/" className="text-orange-500 font-bold hover:underline">
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}