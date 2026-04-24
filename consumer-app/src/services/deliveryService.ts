import { api } from "../api/api";

export async function getAvailableOrders() {
  const token = localStorage.getItem("token")!;
  const response = await api.get("/delivery/orders", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function acceptOrder(orderId: string) {
  const token = localStorage.getItem("token")!;
  const response = await api.post(
    "/delivery/accept",
    { orderId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data; 
}

export async function getMyDeliveries() {
  const token = localStorage.getItem("token")!;
  const response = await api.get("/delivery/my-deliveries", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}