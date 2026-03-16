
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
    async function load() {
      try {
        const token = localStorage.getItem("token")!;
        const data = await getMyOrders(token);
        setOrders(data);
      } catch (error) {
        console.error(error);
      }
    }
    load();
  }, []);

  return (
    <div>
      <h1>My Orders</h1>
      {orders.length === 0 ? <p>No orders yet</p> : (
        orders.map((order, i) => (
          <div key={i} style={{ border: "1px solid #ccc", margin: "8px", padding: "12px" }}>
            <p>Order: {order.orderid}</p>
            <p>Product: {order.productname} x{order.quantity}</p>
          </div>
        ))
      )}
    </div>
  );
}