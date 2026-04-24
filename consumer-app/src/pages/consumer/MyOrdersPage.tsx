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

// Ícono azul para el repartidor
const deliveryIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Ícono rojo para el destino
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

interface DeliveryPosition {
  lat: number;
  lng: number;
}

interface BroadcastPayload {
  payload: {
    lat?: number;
    lng?: number;
    status?: string;
    arrived?: boolean;
  };
}

// Detalle completo de una orden (lo que devuelve GET /api/orders/:id)
interface OrderDetail {
  delivery_lat?: number;
  delivery_lng?: number;
  destination_lat?: number;
  destination_lng?: number;
  status?: string;
}

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
  const [deliveryPosition, setDeliveryPosition] = useState<DeliveryPosition | null>(null);
  const [destinationPosition, setDestinationPosition] = useState<DeliveryPosition | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const [loadingPosition, setLoadingPosition] = useState(false);

  // ─── 1. Cargar órdenes con polling cada 2 segundos ───────────────────────
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
    const interval = setInterval(loadOrders, 2000);
    return () => clearInterval(interval);
  }, []);

  // ─── 2. Iniciar tracking: cargar posición actual + suscribir broadcast ───
  const startTracking = useCallback(async (orderId: string, currentStatus: string) => {
    setTrackingOrderId(orderId);
    setDeliveryPosition(null);
    setDestinationPosition(null);
    setOrderStatus(currentStatus);
    setLoadingPosition(true);

    try {
      // FIX PRINCIPAL: Obtener la posición actual del repartidor desde el backend
      // para inicializar el mapa aunque el consumidor se una tarde al broadcast.
      const token = localStorage.getItem("token")!;
      const res = await api.get<OrderDetail>(`/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const detail = res.data;

      // Si el backend devuelve la posición actual del repartidor, la usamos
      if (detail.delivery_lat && detail.delivery_lng) {
        setDeliveryPosition({ lat: detail.delivery_lat, lng: detail.delivery_lng });
      }

      // Guardar el destino para mostrarlo en el mapa del consumidor
      if (detail.destination_lat && detail.destination_lng) {
        setDestinationPosition({ lat: detail.destination_lat, lng: detail.destination_lng });
      }

      if (detail.status) {
        setOrderStatus(detail.status);
      }
    } catch (err) {
      console.error("Error loading order detail for tracking:", err);
    } finally {
      setLoadingPosition(false);
    }
  }, []);

  // ─── 3. Suscripción a Supabase Broadcast cuando hay un trackingOrderId ───
  useEffect(() => {
    if (!trackingOrderId) return;

    const channel = supabase.channel(`order:${trackingOrderId}`, {
      config: {
        broadcast: { self: true },
      },
    });

    const handlePositionUpdate = (payload: BroadcastPayload) => {
      console.log("📍 Position update received:", payload.payload);
      if (payload.payload.lat !== undefined && payload.payload.lng !== undefined) {
        // FIX: actualizar posición en tiempo real con cada broadcast del repartidor
        setDeliveryPosition({
          lat: payload.payload.lat,
          lng: payload.payload.lng,
        });
        if (payload.payload.status) {
          setOrderStatus(payload.payload.status);
        }
      }
    };

    const handleOrderDelivered = (payload: BroadcastPayload) => {
      console.log("✅ Order delivered broadcast received:", payload.payload);
      setOrderStatus("Entregado");
      setShowToast(true);
      // Recargar órdenes para reflejar el nuevo status
      getMyOrders().then((data) => setOrders(data)).catch(console.error);
      setTimeout(() => setShowToast(false), 5000);
    };

    channel
      .on("broadcast", { event: "position-update" }, handlePositionUpdate)
      .on("broadcast", { event: "order-delivered" }, handleOrderDelivered)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Consumer subscribed to channel:", trackingOrderId);
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Channel error:", trackingOrderId);
        }
      });

    return () => {
      console.log("🔌 Consumer unsubscribing from:", trackingOrderId);
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [trackingOrderId]);

  // ─── Agrupar items por orderid ────────────────────────────────────────────
  const groupedOrders = orders.reduce(
    (acc, order) => {
      if (!acc[order.orderid]) {
        acc[order.orderid] = {
          orderid: order.orderid,
          storeid: order.storeid,
          status: order.status,
          items: [],
        };
      }
      acc[order.orderid].items.push({
        productname: order.productname,
        quantity: order.quantity,
      });
      return acc;
    },
    {} as Record<
      string,
      {
        orderid: string;
        storeid: string;
        status: string;
        items: { productname: string; quantity: number }[];
      }
    >
  );

  const uniqueOrders = Object.values(groupedOrders);

  // Posición inicial del mapa: repartidor si existe, sino destino, sino Cali
  const mapCenter = deliveryPosition ?? destinationPosition ?? { lat: 3.451, lng: -76.532 };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast de llegada */}
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
          <h1
            className="text-3xl font-black text-orange-500 tracking-tighter"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
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
        <h2
          className="text-2xl font-black text-gray-900 mb-1"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          Mis órdenes
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Selecciona una orden en entrega para rastrearla en tiempo real
        </p>

        {/* ── Mapa de tracking ── */}
        {trackingOrderId && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-3">
              <p
                className="font-black text-gray-900 text-sm"
                style={{ fontFamily: "Nunito, sans-serif" }}
              >
                📍 Rastreando pedido en tiempo real
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    orderStatus === "Entregado"
                      ? "bg-green-100 text-green-600"
                      : orderStatus === "En entrega"
                      ? "bg-orange-100 text-orange-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {orderStatus || "Conectando..."}
                </span>
                <button
                  onClick={() => {
                    setTrackingOrderId(null);
                    setDeliveryPosition(null);
                    setDestinationPosition(null);
                    setOrderStatus("");
                  }}
                  className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Spinner mientras carga la posición inicial */}
            {loadingPosition ? (
              <div className="h-48 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-center text-gray-400">
                  <div className="text-3xl mb-2 animate-spin">🛵</div>
                  <p className="text-sm font-bold">Cargando posición...</p>
                </div>
              </div>
            ) : !deliveryPosition ? (
              /* Sin posición aún: repartidor no ha comenzado a moverse */
              <div className="h-48 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-center text-gray-400">
                  <div className="text-3xl mb-2">🛵</div>
                  <p className="text-sm font-bold">Esperando al repartidor...</p>
                  <p className="text-xs mt-1">El mapa aparecerá cuando el repartidor se mueva</p>
                </div>
              </div>
            ) : (
              /* ── MAPA CON POSICIÓN EN TIEMPO REAL ── */
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
                  {/* Re-centrar automáticamente cuando se mueve el repartidor */}
                  <MapUpdater lat={deliveryPosition.lat} lng={deliveryPosition.lng} />

                  {/* Marcador azul: repartidor (se mueve en tiempo real) */}
                  <Marker
                    position={[deliveryPosition.lat, deliveryPosition.lng]}
                    icon={deliveryIcon}
                  >
                    <Popup>🛵 Tu repartidor</Popup>
                  </Marker>

                  {/* Marcador rojo: destino de entrega */}
                  {destinationPosition && (
                    <Marker
                      position={[destinationPosition.lat, destinationPosition.lng]}
                      icon={destIcon}
                    >
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
              <div
                key={order.orderid}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-sm flex-shrink-0">
                    🛒
                  </div>
                  <div className="flex-1">
                    <p
                      className="font-black text-gray-900 text-sm"
                      style={{ fontFamily: "Nunito, sans-serif" }}
                    >
                      Orden #{order.orderid.slice(0, 8)}...
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          order.status === "Entregado"
                            ? "bg-green-100 text-green-600"
                            : order.status === "En entrega"
                            ? "bg-orange-100 text-orange-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {order.status || "Creado"}
                      </span>
                    </div>
                  </div>

                  {/* Botón de tracking: solo para órdenes "En entrega" */}
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

                {/* Items de la orden */}
                <div className="flex flex-col gap-1 pl-16">
                  {order.items.map((item, i) => (
                    <p key={i} className="text-xs text-gray-500">
                      • {item.productname}{" "}
                      <span className="text-gray-400">x{item.quantity}</span>
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