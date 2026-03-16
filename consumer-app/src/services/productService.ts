// consumer-app/src/services/productService.ts
import { api } from "../api/api";

export async function getProductsByStore(storeId: string) {
  const response = await api.get(`/products/store/${storeId}`);
  return response.data;
}

export async function createProduct(name: string, price: number, storeId: string) {
  const token = localStorage.getItem("token")!;
  const response = await api.post(
    "/products",
    { name, price, storeId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}