import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { getAvailableOrders, acceptOrder, getMyDeliveries } from "../../services/deliveryService";
import { api } from "../../api/api";
import { supabase } from "../../lib/supabase";
import L from "leaflet";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const destIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const deliveryIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const STEP = 0.00005;

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 17);
  }, [lat, lng, map]);
  return null;
}

interface Order {
  id: string;
  consumerid: string;
  storeid: string;
  deliveryid: string | null;
  status: string;
  consumername: string;
  storename: string;
  destination_lat?: number;
  destination_lng?: number;
}

export default function DeliveryDashboardPage() {
  const [available, setAvailable] = useState<Order[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<Order[]>([]);
  const [tab, setTab] = useState<"available" | "mine">("available");
  const [refresh, setRefresh] = useState(0);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [position, setPosition] = useState({ lat: 3.451, lng: -76.532 });
  const [delivered, setDelivered] = useState(false);
  const [channelReady, setChannelReady] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Referencias estables para el canal y la posición pendiente
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const positionRef = useRef({ lat: 3.451, lng: -76.532 });
  const deliveredRef = useRef(false);
  const isSendingRef = useRef(false); // evitar envíos solapados
  const lastSentRef = useRef(0);      // timestamp del último envío (throttle)

  // Sincronizar refs con state para usarlos en closures del keydown
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    deliveredRef.current = delivered;
  }, [delivered]);

  // ── Cargar datos ────────────────────────────────────────────────────────────
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
        console.error("Error cargando datos de delivery");
      }
    }
    fetchData();
  }, [refresh]);

  // ── Crear canal Supabase cuando hay orden activa ────────────────────────────
  useEffect(() => {
    if (!activeOrder) return;

    setChannelReady(false);
    setStatusMsg("Conectando canal...");

    // Limpiar canal anterior si existe
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = `order:${activeOrder.id}`;
    console.log("🔌 Creando canal:", channelName);

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false, ack: false },
      },
    });

    channel.subscribe((status, err) => {
      console.log("📡 Canal status:", status, err ?? "");
      if (status === "SUBSCRIBED") {
        channelRef.current = channel;
        setChannelReady(true);
        setStatusMsg("Canal listo ✓");
        console.log("✅ Canal SUBSCRIBED:", channelName);
      } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
        setChannelReady(false);
        setStatusMsg("Error de canal, reconectando...");
        console.error("❌ Canal error:", status);
      }
    });

    return () => {
      console.log("🧹 Limpiando canal:", channelName);
      setChannelReady(false);
      channel.unsubscribe();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [activeOrder?.id]);

  // ── Función para enviar posición al backend + broadcast ─────────────────────
  const sendPosition = useCallback(
    async (lat: number, lng: number) => {
      if (!activeOrder || deliveredRef.current || isSendingRef.current) return;

      const now = Date.now();
      // Throttle: máximo 1 envío por segundo
      if (now - lastSentRef.current < 1000) return;

      isSendingRef.current = true;
      lastSentRef.current = now;

      try {
        const token = localStorage.getItem("token")!;

        // ✅ RUTA CORRECTA: /delivery/:orderId/position (según position.routes.ts)
        const res = await api.patch<{ status: string; arrived: boolean }>(
          `/delivery/${activeOrder.id}/position`,
          { lat, lng },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("📍 Backend response:", res.data);

        const ch = channelRef.current;

        if (res.data.arrived) {
          // ── ENTREGADO ────────────────────────────────────────────────────
          setDelivered(true);
          deliveredRef.current = true;
          setStatusMsg("¡Entregado! 🎉");

          if (ch) {
            await ch.send({
              type: "broadcast",
              event: "order-delivered",
              payload: {
                orderId: activeOrder.id,
                status: res.data.status ?? "Entregado",
              },
            });
            console.log("🎉 Broadcast order-delivered enviado");
          }
        } else {
          // ── EN MOVIMIENTO ────────────────────────────────────────────────
          if (ch) {
            await ch.send({
              type: "broadcast",
              event: "position-update",
              payload: {
                lat,
                lng,
                status: res.data.status,
              },
            });
            console.log("📍 Broadcast position-update enviado:", lat, lng);
          } else {
            console.warn("⚠️ Canal no disponible aún, broadcast omitido");
          }
        }
      } catch (err) {
        console.error("❌ Error enviando posición:", err);
        setStatusMsg("Error enviando posición");
      } finally {
        isSendingRef.current = false;
      }
    },
    [activeOrder]
  );

  // ── Movimiento por teclado ──────────────────────────────────────────────────
  useEffect(() => {
    if (!activeOrder || delivered) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
      if (deliveredRef.current) return;

      e.preventDefault();

      // Calcular nueva posición desde la ref (siempre actualizada)
      let { lat, lng } = positionRef.current;
      switch (e.key) {
        case "ArrowUp":    lat += STEP; break;
        case "ArrowDown":  lat -= STEP; break;
        case "ArrowLeft":  lng -= STEP; break;
        case "ArrowRight": lng += STEP; break;
      }

      // 1. Actualizar estado del mapa inmediatamente
      setPosition({ lat, lng });
      positionRef.current = { lat, lng };

      // 2. Enviar al backend (con throttle interno)
      sendPosition(lat, lng);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeOrder, delivered, sendPosition]);

  // ── Aceptar orden ───────────────────────────────────────────────────────────
  async function handleAccept(order: Order) {
    try {
      const result = await acceptOrder(order.id);
      const newOrder: Order = {
        ...order,
        destination_lat: result.destination_lat ?? order.destination_lat,
        destination_lng: result.destination_lng ?? order.destination_lng,
        status: result.status,
      };
      setActiveOrder(newOrder);
      setDelivered(false);
      deliveredRef.current = false;
      setPosition({ lat: 3.451, lng: -76.532 });
      positionRef.current = { lat: 3.451, lng: -76.532 };
      setTab("mine");
      setRefresh((r) => r + 1);
    } catch {
      alert("Error aceptando la orden");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-3xl font-black text-orange-500 tracking-tighter" style={{ fontFamily: "Nunito, sans-serif" }}>
            rappi
          </h1>
          <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">
            Repartidor
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-8 mb-6 text-white">
          <h2 className="text-2xl font-black mb-1" style={{ fontFamily: "Nunito, sans-serif" }}>
            Panel de Entregas
          </h2>
          <p className="text-orange-100 text-sm">Acepta órdenes y gestiona tus entregas</p>
        </div>

        {/* ── Panel de orden activa ── */}
        {activeOrder && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="font-black text-gray-900 text-sm" style={{ fontFamily: "Nunito, sans-serif" }}>
                🛵 Entregando a: {activeOrder.consumername}
              </p>
              <div className="flex items-center gap-2">
                {/* Indicador de canal */}
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                  channelReady ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${channelReady ? "bg-green-500 animate-pulse" : "bg-yellow-400"}`} />
                  {channelReady ? "En vivo" : "Conectando..."}
                </span>
                {delivered ? (
                  <span className="bg-green-100 text-green-600 text-xs font-bold px-3 py-1 rounded-full">
                    ✓ Entregado
                  </span>
                ) : (
                  <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">
                    En entrega
                  </span>
                )}
              </div>
            </div>

            {/* Debug status */}
            {statusMsg && (
              <p className="text-xs text-gray-400 mb-2 font-mono">{statusMsg}</p>
            )}

            {delivered && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 text-center">
                <p className="text-green-700 font-black text-sm">
                  🎉 ¡Llegaste al destino! Pedido entregado.
                </p>
              </div>
            )}

            <div className="rounded-xl overflow-hidden border border-gray-200 mb-3" style={{ zIndex: 0 }}>
              <MapContainer
                center={[position.lat, position.lng]}
                zoom={17}
                style={{ height: "300px", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <MapUpdater lat={position.lat} lng={position.lng} />
                <Marker position={[position.lat, position.lng]} icon={deliveryIcon}>
                  <Popup>Tu posición</Popup>
                </Marker>
                {activeOrder.destination_lat && activeOrder.destination_lng && (
                  <Marker
                    position={[activeOrder.destination_lat, activeOrder.destination_lng]}
                    icon={destIcon}
                  >
                    <Popup>Destino del cliente</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>

            {!delivered && (
              <div className="text-center">
                <p className="text-xs text-gray-400">
                  Usa las teclas{" "}
                  <kbd className="bg-gray-100 px-1 rounded">↑</kbd>{" "}
                  <kbd className="bg-gray-100 px-1 rounded">↓</kbd>{" "}
                  <kbd className="bg-gray-100 px-1 rounded">←</kbd>{" "}
                  <kbd className="bg-gray-100 px-1 rounded">→</kbd>{" "}
                  para moverte
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  Pos: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-4xl font-black text-orange-500" style={{ fontFamily: "Nunito, sans-serif" }}>{available.length}</p>
            <p className="text-xs text-gray-400 font-semibold mt-1">Disponibles</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-4xl font-black text-green-500" style={{ fontFamily: "Nunito, sans-serif" }}>{myDeliveries.length}</p>
            <p className="text-xs text-gray-400 font-semibold mt-1">Mis entregas</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-full p-1 w-fit mb-6">
          {(["available", "mine"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                tab === t ? "bg-white text-orange-500 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
              style={{ fontFamily: "Nunito, sans-serif" }}
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
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-xl flex-shrink-0">
                    {order.storename.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-sm" style={{ fontFamily: "Nunito, sans-serif" }}>{order.storename}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Para: {order.consumername}</p>
                  </div>
                  <button
                    onClick={() => handleAccept(order)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-4 py-2 rounded-full transition-all shadow-md shadow-orange-200 flex-shrink-0"
                    style={{ fontFamily: "Nunito, sans-serif" }}
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
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 font-black text-xl flex-shrink-0">
                    {order.storename.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-sm" style={{ fontFamily: "Nunito, sans-serif" }}>{order.storename}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Para: {order.consumername}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    order.status === "Entregado"
                      ? "bg-green-100 text-green-600"
                      : order.status === "En entrega"
                      ? "bg-orange-100 text-orange-600"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {order.status}
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