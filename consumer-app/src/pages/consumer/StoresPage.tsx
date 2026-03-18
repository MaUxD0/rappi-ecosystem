import { useEffect, useState } from "react";
import { getStores } from "../../services/storeService";
import { useNavigate } from "react-router-dom";

interface Store {
  id: string;
  name: string;
  isopen: boolean;
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadStores() {
      try {
        const data = await getStores();
        setStores(data);
      } catch {
        console.error("Error loading stores");
      }
    }
    loadStores();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-3xl font-black text-orange-500 tracking-tighter" style={{ fontFamily: 'Nunito, sans-serif' }}>
            rappi
          </h1>
          <a href="/my-orders">
            <button className="text-orange-500 border-2 border-orange-500 hover:bg-orange-50 font-bold text-sm px-4 py-2 rounded-full transition-all" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Mis órdenes
            </button>
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-8 mb-8 text-white">
          <h2 className="text-2xl font-black mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Bienvenido a Rappi
          </h2>
          <p className="text-orange-100 text-sm">Explora las tiendas y realiza tu pedido</p>
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-gray-800" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Tiendas
          </h3>
          <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">
            {stores.filter((s) => s.isopen).length} abiertas
          </span>
        </div>

        {stores.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-bold">No hay tiendas disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {stores.map((store) => (
              <div
                key={store.id}
                onClick={() => store.isopen && navigate(`/stores/${store.id}/products`)}
                className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm transition-all
                  ${store.isopen ? "cursor-pointer hover:-translate-y-1 hover:shadow-md" : "opacity-50 cursor-not-allowed"}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-xl" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {store.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full
                    ${store.isopen ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                    {store.isopen ? "Abierto" : "Cerrado"}
                  </span>
                </div>
                <p className="font-black text-gray-900 text-base" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {store.name}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {store.isopen ? "Ver productos →" : "Cerrado por ahora"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
