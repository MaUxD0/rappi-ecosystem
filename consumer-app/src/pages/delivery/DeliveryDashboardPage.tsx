import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { getAvailableOrders, acceptOrder, getMyDeliveries } from "../../services/deliveryService";
import { api } from "../../api/api";
import L from "leaflet";

// Fix íconos leaflet
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Ícono rojo para el destino
const destIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Ícono azul para el delivery
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

  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPosition = useRef(position);

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

  // Movimiento por teclado con throttle
  useEffect(() => {
    if (!activeOrder || delivered) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      let { lat, lng } = position;

      switch (e.key) {
        case "ArrowUp":    lat += STEP; break;
        case "ArrowDown":  lat -= STEP; break;
        case "ArrowLeft":  lng -= STEP; break;
        case "ArrowRight": lng += STEP; break;
        default: return;
      }

      e.preventDefault();

      // 1. Mover marcador inmediatamente en el mapa
      setPosition({ lat, lng });
      pendingPosition.current = { lat, lng };

      // 2. Si ya hay throttle activo, no hacer nada más
      if (throttleRef.current) return;

      // 3. Abrir ciclo de 1 segundo: enviar posición más reciente al backend
      throttleRef.current = setTimeout(async () => {
        try {
          const token = localStorage.getItem("token")!;
          const res = await api.patch(
            `/delivery/${activeOrder.id}/position`,
            pendingPosition.current,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // Si el backend detectó llegada
          if (res.data.arrived) {
            setDelivered(true);
          }
        } catch (err) {
          console.error("Error updating position", err);
        }
        throttleRef.current = null;
      }, 1000);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (throttleRef.current) clearTimeout(throttleRef.current);
    };
  }, [position, activeOrder, delivered]);

  async function handleAccept(order: Order) {
    try {
      const result = await acceptOrder(order.id);
      setActiveOrder({
        ...order,
        destination_lat: result.destination_lat ?? order.destination_lat,
        destination_lng: result.destination_lng ?? order.destination_lng,
        status: result.status,
      });
      setDelivered(false);
      setPosition({ lat: 3.451, lng: -76.532 });
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

        {/* Mapa activo cuando hay una orden en curso */}
        {activeOrder && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="font-black text-gray-900 text-sm" style={{ fontFamily: "Nunito, sans-serif" }}>
                🛵 Entregando a: {activeOrder.consumername}
              </p>
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
                {/* Marcador del repartidor */}
                <Marker position={[position.lat, position.lng]} icon={deliveryIcon}>
                  <Popup>Tu posición</Popup>
                </Marker>
                {/* Marcador del destino */}
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

            <div className="flex items-center justify-between gap-2 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-gray-600 font-semibold">
                  🎮 Modo simulación (teclado)
                </span>
              </label>
            </div>

            {!delivered && (
              <p className="text-xs text-gray-400 text-center">
                Usa las teclas <kbd className="bg-gray-100 px-1 rounded">↑</kbd> <kbd className="bg-gray-100 px-1 rounded">↓</kbd> <kbd className="bg-gray-100 px-1 rounded">←</kbd> <kbd className="bg-gray-100 px-1 rounded">→</kbd> para moverte
              </p>
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