import { useEffect, useState } from "react";
import { getAvailableOrders, acceptOrder, getMyDeliveries } from "../../services/deliveryService";

interface Order {
  id: string;
  consumerid: string;
  storeid: string;
  deliveryid: string | null;
  consumername: string;
  storename: string;
}

export default function DeliveryDashboardPage() {
  const [available, setAvailable] = useState<Order[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<Order[]>([]);
  const [tab, setTab] = useState<"available" | "mine">("available");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [avail, mine] = await Promise.all([
          getAvailableOrders(),
          getMyDeliveries(),
        ]);
        setAvailable(avail);
        setMyDeliveries(mine);
      } catch {
        console.error("Error loading delivery data");
      }
    }
    fetchData();
  }, [refresh]);

  async function handleAccept(orderId: string) {
    try {
      await acceptOrder(orderId);
      setRefresh((r) => r + 1);
    } catch {
      alert("Error aceptando la orden");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-3xl font-black text-orange-500 tracking-tighter" style={{ fontFamily: 'Nunito, sans-serif' }}>
            rappi
          </h1>
          <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">
            Repartidor
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-8 mb-6 text-white">
          <h2 className="text-2xl font-black mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>Panel de Entregas</h2>
          <p className="text-orange-100 text-sm">Acepta órdenes y gestiona tus entregas</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-4xl font-black text-orange-500" style={{ fontFamily: 'Nunito, sans-serif' }}>{available.length}</p>
            <p className="text-xs text-gray-400 font-semibold mt-1">Disponibles</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-4xl font-black text-green-500" style={{ fontFamily: 'Nunito, sans-serif' }}>{myDeliveries.length}</p>
            <p className="text-xs text-gray-400 font-semibold mt-1">Mis entregas</p>
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-full p-1 w-fit mb-6">
          {(["available", "mine"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                tab === t ? "bg-white text-orange-500 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {t === "available" ? (
                <span className="flex items-center gap-2">
                  Disponibles
                  {available.length > 0 && (
                    <span className="bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {available.length}
                    </span>
                  )}
                </span>
              ) : "Mis entregas"}
            </button>
          ))}
        </div>

        {tab === "available" && (
          available.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-bold text-gray-600">No hay órdenes disponibles</p>
              <p className="text-sm text-gray-400 mt-1">Espera a que lleguen nuevas órdenes</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {available.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-xl flex-shrink-0" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {order.storename.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>{order.storename}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Para: {order.consumername}</p>
                  </div>
                  <button
                    onClick={() => handleAccept(order.id)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-4 py-2 rounded-full transition-all shadow-md shadow-orange-200 flex-shrink-0"
                    style={{ fontFamily: 'Nunito, sans-serif' }}
                  >
                    Aceptar
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "mine" && (
          myDeliveries.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-bold text-gray-600">No tienes entregas aún</p>
              <p className="text-sm text-gray-400 mt-1">Acepta órdenes para comenzar</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {myDeliveries.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 font-black text-xl flex-shrink-0" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {order.storename.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>{order.storename}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Para: {order.consumername}</p>
                  </div>
                  <span className="bg-green-100 text-green-600 text-xs font-bold px-3 py-1 rounded-full">
                    En camino
                  </span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}