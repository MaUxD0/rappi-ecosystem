import { useEffect, useState } from "react";
import { getMyOrders } from "../../services/orderService";

interface Order {
  orderid: string;
  storeid: string;
  productname: string;
  quantity: number;
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await getMyOrders();
        setOrders(data);
      } catch (error) {
        console.error("Error loading orders", error);
      }
    }
    loadOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-3xl font-black text-orange-500 tracking-tighter" style={{ fontFamily: 'Nunito, sans-serif' }}>
            rappi
          </h1>
          <a href="/stores">
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm px-4 py-2 rounded-full transition-all" style={{ fontFamily: 'Nunito, sans-serif' }}>
              ← Tiendas
            </button>
          </a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-black text-gray-900 mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>Mis órdenes</h2>
        <p className="text-gray-400 text-sm mb-6">Historial de todos tus pedidos</p>

        {orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-bold text-gray-600 mb-2">No tienes órdenes aún</p>
            <p className="text-sm mb-6">Realiza tu primer pedido</p>
            <a href="/stores">
              <button className="bg-orange-500 hover:bg-orange-600 text-white font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-orange-200" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Ver tiendas
              </button>
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-sm flex-shrink-0" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  #{i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-black text-gray-900 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {order.productname}
                    <span className="text-gray-400 font-semibold ml-2">x{order.quantity}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">
                    {order.orderid.slice(0, 12)}...
                  </p>
                </div>
                <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">
                  Completado
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}