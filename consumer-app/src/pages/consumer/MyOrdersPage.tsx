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
    <div>
      <h1>Mis Órdenes</h1>
      {orders.length === 0 ? (
        <p>No tienes órdenes aún</p>
      ) : (
        orders.map((order, i) => (
          <div
            key={i}
            style={{ border: "1px solid #ccc", margin: "8px", padding: "8px" }}
          >
            <p>Orden: {order.orderid}</p>
            <p>Producto: {order.productname} x{order.quantity}</p>
          </div>
        ))
      )}
      <a href="/stores">← Volver a tiendas</a>
    </div>
  );
}