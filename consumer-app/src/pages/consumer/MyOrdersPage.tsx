import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { getMyOrders } from "../../services/orderService";
import { supabase } from "../../lib/supabase";
import { api } from "../../api/api";
import L from "leaflet";

// Fix íconos leaflet
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const deliveryIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const destIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Order {
  orderid: string;
  storeid: string;
  productname: string;
  quantity: number;
  status: string;
}

interface Position {
  lat: number;
  lng: number;
}

interface BroadcastPayload {
  payload: {
    lat?: number;
    lng?: number;
    status?: string;
  };
}

interface OrderDetail {
  delivery_lat: number | null;
  delivery_lng: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
  status: string;
}

// Re-centra el mapa cuando cambia la posición del repartidor
function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 17);
  }, [lat, lng, map]);
  return null;
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [deliveryPos, setDeliveryPos] = useState<Position | null>(null);
  const [destinationPos, setDestinationPos] = useState<Position | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [loadingPos, setLoadingPos] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // ── Polling de órdenes cada 2s ──────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const data = await getMyOrders();
        setOrders(data);
      } catch (e) {
        console.error("Error loading orders", e);
      }
    }
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, []);

  // ── Iniciar tracking: carga posición actual del backend, luego escucha broadcast ──
  const startTracking = useCallback(async (orderId: string, currentStatus: string) => {
    // Si ya estamos rastreando esta misma orden, no hacer nada
    if (trackingOrderId === orderId) return;

    setTrackingOrderId(orderId);
    setDeliveryPos(null);
    setDestinationPos(null);
    setOrderStatus(currentStatus);
    setLoadingPos(true);

    try {
      const token = localStorage.getItem("token")!;
      // GET /orders/:id → devuelve delivery_lat/lng y destination_lat/lng desde PostGIS
      const res = await api.get<OrderDetail>(`/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = res.data;

      if (d.delivery_lat && d.delivery_lng) {
        setDeliveryPos({ lat: d.delivery_lat, lng: d.delivery_lng });
      }
      if (d.destination_lat && d.destination_lng) {
        setDestinationPos({ lat: d.destination_lat, lng: d.destination_lng });
      }
      if (d.status) setOrderStatus(d.status);
    } catch (e) {
      console.error("Error loading order detail:", e);
    } finally {
      setLoadingPos(false);
    }
  }, [trackingOrderId]);

  // ── Suscripción Supabase Broadcast ──────────────────────────────────────────
  useEffect(() => {
    if (!trackingOrderId) return;

    // El canal debe usar el mismo nombre que el repartidor: `order:<id>`
    const channel = supabase.channel(`order:${trackingOrderId}`, {
      config: { broadcast: { self: true } },
    });

    channel
      .on("broadcast", { event: "position-update" }, (msg: BroadcastPayload) => {
        const { lat, lng, status } = msg.payload;
        console.log("📍 position-update recibido:", lat, lng);
        if (lat !== undefined && lng !== undefined) {
          // Actualiza el marcador azul en tiempo real
          setDeliveryPos({ lat, lng });
        }
        if (status) setOrderStatus(status);
      })
      .on("broadcast", { event: "order-delivered" }, () => {
        console.log("✅ order-delivered recibido");
        setOrderStatus("Entregado");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
        // Refrescar lista para mostrar badge "Entregado"
        getMyOrders().then(setOrders).catch(console.error);
      })
      .subscribe((status) => {
        console.log("📡 Consumer canal status:", status, "| order:", trackingOrderId);
      });

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [trackingOrderId]);

  // ── Agrupar items por orderid ───────────────────────────────────────────────
  const grouped = orders.reduce(
    (acc, o) => {
      if (!acc[o.orderid]) {
        acc[o.orderid] = { orderid: o.orderid, storeid: o.storeid, status: o.status, items: [] };
      }
      acc[o.orderid].items.push({ productname: o.productname, quantity: o.quantity });
      return acc;
    },
    {} as Record<string, { orderid: string; storeid: string; status: string; items: { productname: string; quantity: number }[] }>
  );
  const uniqueOrders = Object.values(grouped);

  const mapCenter = deliveryPos ?? destinationPos ?? { lat: 3.451, lng: -76.532 };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Toast llegada */}
      {showToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-black text-sm" style={{ fontFamily: "Nunito, sans-serif" }}>
              ¡Tu repartidor llegó!
            </p>
            <p className="text-xs text-green-100">El pedido ha sido entregado</p>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-3xl font-black text-orange-500 tracking-tighter" style={{ fontFamily: "Nunito, sans-serif" }}>
            rappi
          </h1>
          <a href="/stores">
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm px-4 py-2 rounded-full transition-all">
              ← Tiendas
            </button>
          </a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-black text-gray-900 mb-1" style={{ fontFamily: "Nunito, sans-serif" }}>
          Mis órdenes
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Selecciona una orden en entrega para rastrearla en tiempo real
        </p>

        {/* ── Panel de tracking ── */}
        {trackingOrderId && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="font-black text-gray-900 text-sm" style={{ fontFamily: "Nunito, sans-serif" }}>
                📍 Rastreando en tiempo real
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  orderStatus === "Entregado"   ? "bg-green-100 text-green-600"
                  : orderStatus === "En entrega" ? "bg-orange-100 text-orange-600"
                  : "bg-gray-100 text-gray-500"
                }`}>
                  {orderStatus || "Conectando..."}
                </span>
                <button
                  onClick={() => {
                    setTrackingOrderId(null);
                    setDeliveryPos(null);
                    setDestinationPos(null);
                    setOrderStatus("");
                  }}
                  className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                >✕</button>
              </div>
            </div>

            {/* Estado del mapa */}
            {loadingPos ? (
              <div className="h-48 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-center text-gray-400">
                  <div className="text-3xl mb-2">⏳</div>
                  <p className="text-sm font-bold">Cargando posición...</p>
                </div>
              </div>
            ) : !deliveryPos ? (
              <div className="h-48 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-center text-gray-400">
                  <div className="text-3xl mb-2">🛵</div>
                  <p className="text-sm font-bold">Esperando al repartidor...</p>
                  <p className="text-xs mt-1">El mapa aparece cuando el repartidor empieza a moverse</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <MapContainer
                  center={[mapCenter.lat, mapCenter.lng]}
                  zoom={17}
                  style={{ height: "300px", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  {/* Sigue al repartidor automáticamente */}
                  <MapUpdater lat={deliveryPos.lat} lng={deliveryPos.lng} />

                  {/* 🔵 Repartidor — se mueve con cada broadcast */}
                  <Marker position={[deliveryPos.lat, deliveryPos.lng]} icon={deliveryIcon}>
                    <Popup>🛵 Tu repartidor</Popup>
                  </Marker>

                  {/* 🔴 Destino */}
                  {destinationPos && (
                    <Marker position={[destinationPos.lat, destinationPos.lng]} icon={destIcon}>
                      <Popup>📦 Tu dirección de entrega</Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center mt-2">
              🔴 Tu dirección &nbsp;|&nbsp; 🔵 Repartidor
            </p>
          </div>
        )}

        {/* ── Lista de órdenes ── */}
        {uniqueOrders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-bold text-gray-600 mb-2">No tienes órdenes aún</p>
            <p className="text-sm mb-6">Realiza tu primer pedido</p>
            <a href="/stores">
              <button className="bg-orange-500 hover:bg-orange-600 text-white font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-orange-200">
                Ver tiendas
              </button>
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {uniqueOrders.map((order) => (
              <div key={order.orderid} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-sm flex-shrink-0">
                    🛒
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-sm" style={{ fontFamily: "Nunito, sans-serif" }}>
                      Orden #{order.orderid.slice(0, 8)}...
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        order.status === "Entregado"   ? "bg-green-100 text-green-600"
                        : order.status === "En entrega" ? "bg-orange-100 text-orange-600"
                        : "bg-blue-100 text-blue-600"
                      }`}>
                        {order.status || "Creado"}
                      </span>
                    </div>
                  </div>

                  {order.status === "En entrega" && (
                    <button
                      onClick={() => startTracking(order.orderid, order.status)}
                      className={`text-xs font-bold px-3 py-2 rounded-full transition-all flex-shrink-0 ${
                        trackingOrderId === order.orderid
                          ? "bg-orange-500 text-white"
                          : "bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white"
                      }`}
                    >
                      {trackingOrderId === order.orderid ? "📍 Rastreando" : "🗺️ Rastrear"}
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-1 pl-16">
                  {order.items.map((item, i) => (
                    <p key={i} className="text-xs text-gray-500">
                      • {item.productname} <span className="text-gray-400">x{item.quantity}</span>
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}