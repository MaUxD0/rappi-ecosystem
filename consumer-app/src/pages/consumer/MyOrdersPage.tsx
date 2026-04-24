import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { getMyOrders } from "../../services/orderService";
import { supabase } from "../../lib/supabase";
import L from "leaflet";

// Fix leaflet
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

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 17);
  }, [lat, lng, map]);
  return null;
}

export default function MyOrdersPage() {
  interface Order {
  orderid: string;
  storeid: string;
  productname: string;
  quantity: number;
  status: string;
}

const [orders, setOrders] = useState<Order[]>([]);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [deliveryPosition, setDeliveryPosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    getMyOrders().then(setOrders);
  }, []);

  // ✅ REALTIME CORREGIDO
  useEffect(() => {
    if (!trackingOrderId) return;

    const channel = supabase
      .channel(`order:${trackingOrderId}`)
      .on("broadcast", { event: "position-update" }, (payload) => {
        console.log("🔥 EVENT:", payload);

        const lat = payload.payload?.lat;
        const lng = payload.payload?.lng;

        // 🔥 FIX REAL
        if (lat !== undefined && lng !== undefined) {
          console.log("📍 Updating:", lat, lng);

          setDeliveryPosition({ lat, lng });
        }
      })
      .on("broadcast", { event: "order-delivered" }, () => {
        alert("Pedido entregado 🚀");
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [trackingOrderId]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Mis órdenes</h2>

      {orders.map((order) => (
        <div key={order.orderid}>
          <p>{order.productname}</p>

          <button onClick={() => setTrackingOrderId(order.orderid)}>
            Rastrear
          </button>
        </div>
      ))}

      {deliveryPosition && (
        <MapContainer
          center={[deliveryPosition.lat, deliveryPosition.lng]}
          zoom={17}
          style={{ height: 300 }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapUpdater lat={deliveryPosition.lat} lng={deliveryPosition.lng} />
          <Marker position={[deliveryPosition.lat, deliveryPosition.lng]} icon={deliveryIcon}>
            <Popup>Repartidor</Popup>
          </Marker>
        </MapContainer>
      )}
    </div>
  );
}