
import { api } from "../api/api";

export async function createOrder(storeId: string, token: string) {
  const response = await api.post(
    "/orders",
    { storeId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

export async function addProductToOrder(orderId: string, productId: string, quantity: number, token: string) {
  const response = await api.post(
    "/orders/add-product",
    { orderId, productId, quantity },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

export async function getMyOrders(token: string) {
  const response = await api.get("/orders/my-orders", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}