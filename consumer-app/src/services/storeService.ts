// consumer-app/src/services/storeService.ts
import { api } from "../api/api";

export async function getStores() {
  const response = await api.get("/stores");
  return response.data;
}

export async function getStoreByUser() {
  const token = localStorage.getItem("token")!;
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const response = await api.get(`/stores/my-store/${user.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function toggleStore(storeId: string, isOpen: boolean) {
  const token = localStorage.getItem("token")!;
  const response = await api.patch(
    `/stores/${storeId}/toggle`,
    { isOpen },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

export async function getStoreOrders(storeId: string) {
  const token = localStorage.getItem("token")!;
  const response = await api.get(`/stores/${storeId}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}