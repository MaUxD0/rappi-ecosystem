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

  useEffect(() => {
    async function loadData() {
      try {
        const avail = await getAvailableOrders();
        setAvailable(avail);
        const mine = await getMyDeliveries();
        setMyDeliveries(mine);
      } catch {
        console.error("Error loading delivery data");
      }
    }
    loadData();
  }, []);

  async function handleAccept(orderId: string) {
    try {
      await acceptOrder(orderId);
      alert("Orden aceptada");
      const avail = await getAvailableOrders();
      setAvailable(avail);
      const mine = await getMyDeliveries();
      setMyDeliveries(mine);
    } catch {
      alert("Error aceptando la orden");
    }
  }

  return (
    <div>
      <h1>Delivery Dashboard</h1>

      <button
        onClick={() => setTab("available")}
        style={{ fontWeight: tab === "available" ? "bold" : "normal", marginRight: 8 }}
      >
        Órdenes disponibles
      </button>
      <button
        onClick={() => setTab("mine")}
        style={{ fontWeight: tab === "mine" ? "bold" : "normal" }}
      >
        Mis entregas
      </button>

      <hr />

      {tab === "available" && (
        <div>
          <h2>Órdenes Disponibles</h2>
          {available.length === 0 ? (
            <p>No hay órdenes disponibles</p>
          ) : (
            available.map((order) => (
              <div key={order.id} style={{ border: "1px solid #ccc", margin: "8px", padding: "8px" }}>
                <p>Tienda: {order.storename}</p>
                <p>Consumer: {order.consumername}</p>
                <button onClick={() => handleAccept(order.id)}>Aceptar</button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "mine" && (
        <div>
          <h2>Mis Entregas</h2>
          {myDeliveries.length === 0 ? (
            <p>No tienes entregas aún</p>
          ) : (
            myDeliveries.map((order) => (
              <div key={order.id} style={{ border: "1px solid #ccc", margin: "8px", padding: "8px" }}>
                <p>Tienda: {order.storename}</p>
                <p>Consumer: {order.consumername}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}