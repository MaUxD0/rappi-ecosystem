import { api } from "../api/api";

export async function getStores() {

  const response = await api.get("/stores");

  return response.data;

}